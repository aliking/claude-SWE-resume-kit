#!/usr/bin/env node
/*
 * PreToolUse hook policy:
 * - For terminal command tools, rewrite unambiguous stderr-drop redirection:
 *     2>/dev/null  ->  2>&1
 * - If any /dev/null remains after rewrite, deny the tool call.
 */

'use strict';

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

function emitJson(obj) {
  process.stdout.write(`${JSON.stringify(obj)}\n`);
}

function isTerminalTool(toolName) {
  return [
    'run_in_terminal',
    'send_to_terminal',
    'runInTerminal',
    'sendToTerminal',
  ].includes(toolName);
}

function deny(reason) {
  emitJson({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    },
  });
}

function allowWithUpdatedInput(updatedInput) {
  emitJson({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'allow',
      updatedInput,
      additionalContext: 'Normalized stderr redirection: replaced 2>/dev/null with 2>&1',
    },
  });
}

(async () => {
  let payload;
  try {
    payload = JSON.parse(await readStdin());
  } catch {
    process.exit(0);
  }

  const toolName = payload?.tool_name;
  if (!isTerminalTool(toolName)) {
    process.exit(0);
  }

  const toolInput = payload?.tool_input;
  if (!toolInput || typeof toolInput !== 'object') {
    process.exit(0);
  }

  const command = toolInput.command;
  if (typeof command !== 'string' || command.length === 0) {
    process.exit(0);
  }

  // Rewrite only the unambiguous pattern discussed.
  const rewritten = command.replace(/2\s*>\s*\/dev\/null/g, '2>&1');
  const hasAnyDevNull = /\/dev\/null/.test(rewritten);

  if (rewritten !== command && !hasAnyDevNull) {
    allowWithUpdatedInput({ ...toolInput, command: rewritten });
    process.exit(0);
  }

  if (hasAnyDevNull) {
    deny('Terminal command rejected: /dev/null redirection is not allowed in this workspace. The hook can auto-rewrite only 2>/dev/null to 2>&1; please resubmit without other /dev/null usages.');
  }
})();
