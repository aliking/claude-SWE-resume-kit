#!/usr/bin/env node
/*
 * PreToolUse hook policy:
 * - For terminal command tools, rewrite unambiguous stderr-drop redirection:
 *     2>/dev/null  ->  2>&1
 * - If any /dev/null remains after rewrite, deny the tool call.
 * - If the command matches a workspace terminal policy that would require
 *   approval, deny early and instruct the agent to use an approved command.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..', '..');
const devcontainerPath = path.join(repoRoot, '.devcontainer', 'devcontainer.json');

function loadApprovalRequiredTerminalPatterns() {
  let devcontainer;

  try {
    devcontainer = JSON.parse(fs.readFileSync(devcontainerPath, 'utf8'));
  } catch {
    return [];
  }

  const terminalAutoApprove = devcontainer?.customizations?.vscode?.settings?.['chat.tools.terminal.autoApprove'];
  if (!terminalAutoApprove || typeof terminalAutoApprove !== 'object') {
    return [];
  }

  return Object.entries(terminalAutoApprove)
    .filter(([, value]) => value === false || (value && typeof value === 'object' && value.approve === false))
    .map(([pattern]) => compilePattern(pattern))
    .filter(Boolean);
}

function compilePattern(pattern) {
  if (typeof pattern !== 'string' || pattern.length === 0) {
    return null;
  }

  const slashMatch = pattern.match(/^\/(.+)\/([a-z]*)$/i);
  if (slashMatch) {
    try {
      return {
        source: pattern,
        matcher: new RegExp(slashMatch[1], slashMatch[2]),
      };
    } catch {
      return null;
    }
  }

  return {
    source: pattern,
    matcher: {
      test(value) {
        return value === pattern;
      },
    },
  };
}

const approvalRequiredTerminalPatterns = loadApprovalRequiredTerminalPatterns();

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

function findApprovalRequiredPattern(command) {
  return approvalRequiredTerminalPatterns.find(({ matcher }) => matcher.test(command)) ?? null;
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

  const approvalRequiredMatch = findApprovalRequiredPattern(rewritten);
  if (approvalRequiredMatch) {
    deny(
      `Terminal command rejected before approval: it matches workspace approval policy ${approvalRequiredMatch.source}. Use an already approved command or wrapper instead of asking for approval. If the task still truly requires a restricted command, explain that need to the user explicitly.`
    );
  }

  if (rewritten !== command && !hasAnyDevNull) {
    allowWithUpdatedInput({ ...toolInput, command: rewritten });
    process.exit(0);
  }

  if (hasAnyDevNull) {
    deny('Terminal command rejected: /dev/null redirection is not allowed in this workspace. The hook can auto-rewrite only 2>/dev/null to 2>&1; please resubmit without other /dev/null usages.');
  }
})();
