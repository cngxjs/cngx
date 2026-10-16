#!/usr/bin/env node
// Packs every built lib (dist/<lib>) into a tarball stamped exactly as
// scripts/publish.mjs would stamp it, and optionally runs the package checks
// a consumer's install would hit. The tarballs feed the consumer fixtures
// (scripts/consumer-fixture.mjs).
//
// Usage:
//   node scripts/pack-libs.mjs                 # pack into .consumer-compat/tarballs
//   node scripts/pack-libs.mjs --check         # also publint + are-the-types-wrong
//   node scripts/pack-libs.mjs --out <dir> --lib core --lib ui
//
// Requires `npm run build:libs` first.

import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { publint } from 'publint';
import { formatMessage } from 'publint/utils';

import { PACKED_LIBS } from './cngx-libs.mjs';
import { findPlaceholders, readPackageVersion, replaceVersionInDist, stampManifest, stampSchematicsDist } from './publish.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// are-the-types-wrong rules accepted on purpose. false-cjs is the same
// missing "type": "module" as below; internal-resolution-error only shows for
// node10 resolution, which ignores the exports map the secondary entries
// live behind and is not a supported consumer setup for Angular 21.
export const ATTW_IGNORED_RULES = ['false-cjs', 'internal-resolution-error'];

// publint findings accepted on purpose, each with the reason. A new code
// fails the check until someone decides on it.
export const ACCEPTED_PUBLINT_CODES = {
  EXPORTS_TYPES_INVALID_FORMAT:
    'dist manifests carry no "type": "module" (ng-packagr output, and the CommonJS schematics bundle forbids it), so node16 resolution reads the .d.ts as CJS; Angular consumers resolve with "bundler"',
  USE_TYPE: 'same reason: a "type" field would flip the schematics bundle to ESM',
  USE_FILES: 'dist/<lib> is already the package root; there is nothing to exclude',
};

/** Every file path the manifest points at, with `*` patterns kept as patterns. */
export function manifestFileRefs(pkg) {
  const refs = new Set();
  const addString = (value) => {
    if (typeof value === 'string' && value.startsWith('./')) {
      refs.add(value.slice(2));
    }
  };
  const walk = (node) => {
    if (typeof node === 'string') {
      addString(node);
    } else if (node && typeof node === 'object') {
      Object.values(node).forEach(walk);
    }
  };
  walk(pkg.exports);
  for (const field of ['main', 'module', 'typings', 'types', 'schematics']) {
    const value = pkg[field];
    if (typeof value === 'string') {
      refs.add(value.replace(/^\.\//, ''));
    }
  }
  return [...refs];
}

/** Manifest references no file in the tarball satisfies. `tarFiles` are package-relative paths. */
export function missingRefs(pkg, tarFiles) {
  const files = new Set(tarFiles);
  return manifestFileRefs(pkg).filter((ref) => {
    if (!ref.includes('*')) {
      return !files.has(ref);
    }
    const pattern = new RegExp(`^${ref.split('*').map(escapeRegExp).join('.*')}$`);
    return !tarFiles.some((file) => pattern.test(file));
  });
}

function escapeRegExp(text) {
  return text.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
}

function parseArgs(argv) {
  const args = { out: join(ROOT, '.consumer-compat', 'tarballs'), check: false, libs: [] };
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case '--out': args.out = resolve(argv[++i]); break;
      case '--check': args.check = true; break;
      case '--lib': args.libs.push(argv[++i]); break;
      default:
        console.error(`Unknown argument: ${argv[i]}`);
        process.exit(1);
    }
  }
  if (args.libs.length === 0) {
    args.libs = [...PACKED_LIBS];
  }
  return args;
}

// The packed core carries what publish adds at release time, so a fixture
// installs the versions.json `ng add` pins from and the refresh entry
// `ng update` runs. Versions come from the workspace, never the registry.
export function stampStagedSchematics(lib, stage, pkg, version) {
  if (lib !== 'core' || !existsSync(join(stage, 'schematics', 'migrations', 'migrations.json'))) {
    return false;
  }
  stampSchematicsDist({
    schematicsDir: join(stage, 'schematics'),
    nextVersion: version,
    mcpVersion: readPackageVersion('mcp'),
    eslintPluginVersion: readPackageVersion('eslint-plugin'),
    angularRange: pkg.peerDependencies['@angular/core'],
  });
  return true;
}

function packLib(lib, version, out) {
  const distDir = join(ROOT, 'dist', lib);
  if (!existsSync(join(distDir, 'package.json'))) {
    throw new Error(`dist/${lib} is missing: run "npm run build:libs" first`);
  }
  const stage = join(mkdtempSync(join(tmpdir(), `cngx-pack-${lib}-`)), 'package');
  cpSync(distDir, stage, { recursive: true });

  const manifestPath = join(stage, 'package.json');
  const pkg = stampManifest(JSON.parse(readFileSync(manifestPath, 'utf8')), version);
  writeFileSync(manifestPath, JSON.stringify(pkg, null, 2) + '\n');
  replaceVersionInDist(stage, version);
  stampStagedSchematics(lib, stage, pkg, version);

  const [packed] = JSON.parse(
    execFileSync('npm', ['pack', '--json', '--pack-destination', out], { cwd: stage, encoding: 'utf8' }),
  );
  return {
    lib,
    pkg,
    stage,
    tarball: join(out, packed.filename),
    files: packed.files.map((file) => file.path),
  };
}

export async function lintWithPublint(stage) {
  const { messages } = await publint({ pkgDir: stage, level: 'suggestion', pack: 'npm' });
  return messages.filter((message) => !(message.code in ACCEPTED_PUBLINT_CODES));
}

async function checkPacked({ lib, pkg, stage, tarball, files }) {
  const problems = [];
  const placeholders = findPlaceholders(pkg);
  if (placeholders.length > 0) {
    problems.push(`placeholder left in ${placeholders.join(', ')}`);
  }
  const missing = missingRefs(pkg, files);
  if (missing.length > 0) {
    problems.push(`manifest points at files missing from the tarball: ${missing.join(', ')}`);
  }
  for (const message of await lintWithPublint(stage)) {
    problems.push(`publint ${message.code}: ${formatMessage(message, pkg)}`);
  }
  if (existsSync(join(stage, 'fesm2022'))) {
    problems.push(
      ...runTool('attw', [tarball, '--profile', 'esm-only', '--ignore-rules', ...ATTW_IGNORED_RULES, '--format', 'ascii'], lib),
    );
  }
  return problems;
}

function runTool(bin, args, lib) {
  try {
    execFileSync(join(ROOT, 'node_modules', '.bin', bin), args, { encoding: 'utf8', stdio: 'pipe' });
    return [];
  } catch (error) {
    const output = `${error.stdout ?? ''}${error.stderr ?? ''}`.trim();
    return [`${bin} failed for ${lib}:\n${output}`];
  }
}

async function main() {
  const { out, check, libs } = parseArgs(process.argv.slice(2));
  const version = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version;
  mkdirSync(out, { recursive: true });

  let failed = false;
  for (const lib of libs) {
    const packed = packLib(lib, version, out);
    console.log(`packed @cngx/${lib}@${version} -> ${packed.tarball}`);
    if (!check) {
      continue;
    }
    const problems = await checkPacked(packed);
    for (const problem of problems) {
      console.error(`  [${lib}] ${problem}`);
    }
    failed ||= problems.length > 0;
  }
  if (failed) {
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
