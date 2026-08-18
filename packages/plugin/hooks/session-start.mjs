#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const LLMS_TXT = 'https://cngxjs.github.io/cngx/llms.txt';
const LLMS_FULL = 'https://cngxjs.github.io/cngx/llms-full.txt';

const readJson = (path) => {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
};

// Installed versions win: node_modules/@cngx/*/package.json carries the exact
// resolved version. Only when nothing is installed do we fall back to the
// ranges declared in the workspace package.json, so the hook still says
// something useful before a first install.
export function resolveCngxVersions(cwd) {
  const installed = {};
  const scopeDir = join(cwd, 'node_modules', '@cngx');
  if (existsSync(scopeDir)) {
    for (const name of readdirSync(scopeDir)) {
      const pkg = readJson(join(scopeDir, name, 'package.json'));
      if (pkg?.version) {
        installed[`@cngx/${name}`] = pkg.version;
      }
    }
  }
  if (Object.keys(installed).length > 0) {
    return installed;
  }

  const pkg = readJson(join(cwd, 'package.json')) ?? {};
  const declared = {};
  for (const [name, range] of Object.entries({ ...pkg.dependencies, ...pkg.devDependencies })) {
    if (name.startsWith('@cngx/')) {
      declared[name] = range;
    }
  }
  return declared;
}

export function readProfile(cwd) {
  return readJson(join(cwd, '.cngx', 'profile.json'));
}

export function buildContext(cwd) {
  const versions = resolveCngxVersions(cwd);
  const names = Object.keys(versions).sort();
  const profile = readProfile(cwd);
  const lines = [];

  if (names.length === 0) {
    lines.push('No @cngx/* packages are installed in this workspace.');
  } else {
    lines.push('Installed @cngx/* packages in this workspace:');
    for (const name of names) {
      lines.push(`- ${name}@${versions[name]}`);
    }
  }

  if (profile) {
    if (Array.isArray(profile.libs) && profile.libs.length > 0) {
      lines.push(`cngx libraries in use (from .cngx/profile.json): ${profile.libs.join(', ')}.`);
    }
    if (typeof profile.brandTokens === 'string' && profile.brandTokens) {
      lines.push(`Brand token source (from .cngx/profile.json): ${profile.brandTokens}.`);
    }
  }

  lines.push('Use the cngx MCP tools to look up exact @cngx/* API shapes before wiring any symbol.', `cngx docs for LLMs: ${LLMS_TXT} (index), ${LLMS_FULL} (full text).`);

  return lines.join('\n');
}

function readStdin() {
  try {
    return JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    return {};
  }
}

function main() {
  const input = readStdin();
  const cwd = typeof input.cwd === 'string' && input.cwd ? input.cwd : process.cwd();
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: buildContext(cwd),
      },
    }),
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
