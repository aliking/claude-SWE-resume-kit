#!/usr/bin/env node
/**
 * generate_claude_settings.js
 *
 * Reads the permission policy from .devcontainer/devcontainer.json and writes
 * .devcontainer/claude-settings.json for Claude Code.
 *
 * Source of truth in devcontainer.json:
 *
 *   customizations.vscode.settings
 *     ["chat.tools.terminal.autoApprove"]
 *       Keys are regex patterns (anchored with ^ and $).
 *       Values: true means auto-approve, false means require confirmation.
 *       This script translates true -> Claude Bash allow, false -> Claude Bash ask.
 *
 *     ["chat.tools.edits.autoApprove"]
 *       File patterns with false values require confirmation in Copilot.
 *       This script translates false -> Claude deny Write()/Edit().
 *
 * Regex translation rules (regex → Claude Bash() glob):
 *   ^…$ anchors are stripped.
 *   Alternation groups (a|b|c) are expanded into separate entries.
 *   Trailing optional args ( .*)? produces two entries: bare and " *" variant.
 *   Escaped dots \. are unescaped to literal dots.
 *
 * Usage:
 *   node scripts/generate_claude_settings.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const repoRoot       = path.join(__dirname, '..');
const devcontainerPath = path.join(repoRoot, '.devcontainer', 'devcontainer.json');
const outputPath     = path.join(repoRoot, '.devcontainer', 'claude-settings.json');

// ---------------------------------------------------------------------------
// Read source
// ---------------------------------------------------------------------------

const devcontainer = JSON.parse(fs.readFileSync(devcontainerPath, 'utf8'));
const vscodeSettings = devcontainer?.customizations?.vscode?.settings ?? {};

// terminal.autoApprove true -> Claude allow, false -> Claude ask
const terminalAutoApprove = vscodeSettings['chat.tools.terminal.autoApprove'] ?? {};
// edits.autoApprove false entries → Claude deny Write()/Edit()
const autoApprove = vscodeSettings['chat.tools.edits.autoApprove'] ?? {};

// ---------------------------------------------------------------------------
// Pattern translation: regex string → Claude Bash() permission strings
// ---------------------------------------------------------------------------

/**
 * Expand (a|b|c) alternation groups into separate strings (recursively).
 * Only matches groups that contain at least one pipe (|), so optional-args
 * groups like ( .*)? are left untouched for toClaudePatterns to handle.
 */
function expandAlternations(p) {
  const match = p.match(/\(([^()]*\|[^()]*)\)/);
  if (!match) return [p];

  const alts   = match[1].split('|');
  const before = p.slice(0, match.index);
  const after  = p.slice(match.index + match[0].length);

  return alts.flatMap(alt => expandAlternations(before + alt + after));
}

/**
 * Convert one (alternation-free) regex string to Claude Bash() entries.
 * Emits two entries when the pattern ends with the optional-args suffix ( .*)?:
 *   one bare (no args), one with " *" (any args).
 */
function toClaudePatterns(p) {
  // Unescape \. → .
  const cleaned = p.replace(/\\([.])/g, '$1');

  if (cleaned.endsWith('( .*)?')) {
    const base = cleaned.slice(0, -6).trimEnd();
    return [`Bash(${base})`, `Bash(${base} *)`];
  }

  return [`Bash(${cleaned.trim()})`];
}

/** Full pipeline: regex string → array of Claude Bash() permission strings */
function expandToClaude(regexStr) {
  // Handle /pattern/flags format — strip slashes and flags
  const slashMatch = regexStr.match(/^\/(.+?)\/[a-z]*$/);
  const inner = slashMatch ? slashMatch[1] : regexStr;
  const p = inner.replace(/^\^/, '').replace(/\$$/, '');
  return expandAlternations(p).flatMap(toClaudePatterns);
}

// ---------------------------------------------------------------------------
// Build output arrays
// ---------------------------------------------------------------------------

// Value can be: true, false, or { approve: boolean, matchCommandLine: boolean }
function isApproved(v) { return v === true || (v && typeof v === 'object' && v.approve === true); }
function isDenied(v)   { return v === false || (v && typeof v === 'object' && v.approve === false); }

const claudeAllow = Object.entries(terminalAutoApprove)
  .filter(([, v]) => isApproved(v))
  .flatMap(([k]) => expandToClaude(k));

const claudeAsk = Object.entries(terminalAutoApprove)
  .filter(([, v]) => isDenied(v))
  .flatMap(([k]) => expandToClaude(k));

const claudeDeny = Object.entries(autoApprove)
  .filter(([, v]) => v === false)
  .flatMap(([p]) => [`Write(${p})`, `Edit(${p})`]);

// ---------------------------------------------------------------------------
// Compose settings object (sandbox block stays static)
// ---------------------------------------------------------------------------

const settings = {
  $schema: 'https://json.schemastore.org/claude-code-settings.json',
  permissions: {
    defaultMode: 'acceptEdits',
    allow: claudeAllow,
    ask:   claudeAsk,
    deny:  claudeDeny,
  },
  sandbox: {
    enabled: true,
    autoAllowBashIfSandboxed: true,
    allowUnsandboxedCommands: false,
    enableWeakerNestedSandbox: true,
    filesystem: {
      allowWrite: ['./', '/tmp'],
      denyRead:   ['~/.aws/credentials', '~/.gnupg/**', '~/.ssh/**'],
    },
  },
};

// ---------------------------------------------------------------------------
// Write output
// ---------------------------------------------------------------------------

fs.writeFileSync(outputPath, JSON.stringify(settings, null, 2) + '\n');
console.log(`Generated: ${path.relative(process.cwd(), outputPath)}`);
console.log(`  allow: ${claudeAllow.length} entries`);
console.log(`  ask:   ${claudeAsk.length} entries`);
console.log(`  deny:  ${claudeDeny.length} entries`);
