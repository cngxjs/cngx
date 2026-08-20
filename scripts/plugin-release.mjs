// Cuts a plugin release, decoupled from the library publish flow. The plugin is
// distributed via the committed marketplace manifest, not npm, and it only
// changes when its pack regenerates or the @cngx/mcp pin moves - neither of
// which tracks the 8-lib release cadence in scripts/publish.mjs. So this is its
// own step:
//
//   node scripts/plugin-release.mjs --version 0.1.0-rc.1 --mcp 0.1.0-rc.1
//
//   1. bump packages/plugin/.claude-plugin/plugin.json version
//   2. bump the @cngx/mcp pin in packages/plugin/.mcp.json (when --mcp given)
//   3. regenerate the plugin's doctor copy from the canonical @cngx/doctor package
//   4. regenerate the pack from current public data
//   5. run the drift check - the release must ship a pack that is in sync

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PLUGIN_MANIFEST = 'packages/plugin/.claude-plugin/plugin.json';
const MCP_CONFIG = 'packages/plugin/.mcp.json';

const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

export function bumpPluginManifest(manifest, version) {
  return { ...manifest, version };
}

export function bumpMcpPin(config, mcpVersion) {
  const server = config.mcpServers?.cngx;
  if (!server || !Array.isArray(server.args)) {
    return config;
  }
  const args = server.args.map((arg) =>
    arg.startsWith('@cngx/mcp') ? `@cngx/mcp@${mcpVersion}` : arg,
  );
  return { ...config, mcpServers: { ...config.mcpServers, cngx: { ...server, args } } };
}

export function parseArgs(argv) {
  const parsed = { version: null, mcp: null, dryRun: false };
  for (let i = 0; i < argv.length; i += 1) {
    switch (argv[i]) {
      case '--version':
        parsed.version = argv[(i += 1)];
        break;
      case '--mcp':
        parsed.mcp = argv[(i += 1)];
        break;
      case '--dry-run':
        parsed.dryRun = true;
        break;
      default:
        break;
    }
  }
  return parsed;
}

const readJson = (path) => JSON.parse(readFileSync(resolve(path), 'utf8'));
const writeJson = (path, value) => writeFileSync(resolve(path), `${JSON.stringify(value, null, 2)}\n`);

function main() {
  const { version, mcp, dryRun } = parseArgs(process.argv.slice(2));

  if (!version) {
    process.stderr.write('plugin:release - pass --version <x.y.z> (and optional --mcp <x.y.z>)\n');
    process.exitCode = 1;
    return;
  }
  if (!SEMVER.test(version)) {
    process.stderr.write(`plugin:release - "${version}" is not a well-formed semver\n`);
    process.exitCode = 1;
    return;
  }
  if (mcp && !SEMVER.test(mcp)) {
    process.stderr.write(`plugin:release - "${mcp}" is not a well-formed semver\n`);
    process.exitCode = 1;
    return;
  }

  const nextManifest = bumpPluginManifest(readJson(PLUGIN_MANIFEST), version);
  const nextMcp = mcp ? bumpMcpPin(readJson(MCP_CONFIG), mcp) : null;

  if (dryRun) {
    process.stdout.write(
      `plugin:release (dry-run) - would set plugin ${version}${mcp ? `, @cngx/mcp pin ${mcp}` : ''} and regenerate the pack\n`,
    );
    return;
  }

  writeJson(PLUGIN_MANIFEST, nextManifest);
  if (nextMcp) {
    writeJson(MCP_CONFIG, nextMcp);
  }

  execFileSync('node', ['scripts/sync-doctor.mjs'], { stdio: 'inherit' });
  execFileSync('node', ['scripts/plugin-token-reference.mjs'], { stdio: 'inherit' });
  execFileSync('node', ['scripts/plugin-recipes.mjs'], { stdio: 'inherit' });
  execFileSync('node', ['scripts/plugin-pack-drift.mjs'], { stdio: 'inherit' });

  process.stdout.write(
    `plugin:release - plugin ${version}${mcp ? `, @cngx/mcp pin ${mcp}` : ''}, pack regenerated and in sync\n`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
