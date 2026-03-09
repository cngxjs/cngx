#!/usr/bin/env node
// Usage:
//   node scripts/publish.mjs --bump patch              # all libs, bump patch
//   node scripts/publish.mjs --bump minor              # all libs, bump minor
//   node scripts/publish.mjs --version 1.2.3           # all libs, explicit version
//   node scripts/publish.mjs --lib core --bump patch   # single lib
//   node scripts/publish.mjs --dry-run --bump patch    # preview without publishing
//   node scripts/publish.mjs --tag next --bump major   # publish with dist-tag

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '..');
const LIBS = ['core', 'forms', 'ui', 'common'];
const PLACEHOLDER = '0.0.0-PLACEHOLDER';

function readRootPkg() {
  return JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
}

function writeRootPkg(pkg) {
  writeFileSync(join(ROOT, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');
}

function bumpVersion(version, type) {
  const [major, minor, patch] = version.split('.').map(Number);
  switch (type) {
    case 'major': return `${major + 1}.0.0`;
    case 'minor': return `${major}.${minor + 1}.0`;
    case 'patch': return `${major}.${minor}.${patch + 1}`;
    default: throw new Error(`Unknown bump type: ${type}. Use patch, minor, or major.`);
  }
}

function run(cmd, cwd = ROOT) {
  console.log(`  $ ${cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit' });
}

function parseArgs() {
  const args = process.argv.slice(2);
  const result = { libs: [], version: null, bump: null, dryRun: false, tag: 'latest' };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--lib':     result.libs.push(args[++i]); break;
      case '--version': result.version = args[++i]; break;
      case '--bump':    result.bump = args[++i]; break;
      case '--tag':     result.tag = args[++i]; break;
      case '--dry-run': result.dryRun = true; break;
      default:
        console.error(`Unknown argument: ${args[i]}`);
        process.exit(1);
    }
  }

  // Default to all libs when none specified
  if (!result.libs.length) result.libs = [...LIBS];

  return result;
}

function main() {
  const { libs, version, bump, dryRun, tag } = parseArgs();

  if (!version && !bump) {
    console.error('Specify --version <x.y.z> or --bump patch|minor|major');
    process.exit(1);
  }

  for (const lib of libs) {
    if (!LIBS.includes(lib)) {
      console.error(`Unknown lib "${lib}". Available: ${LIBS.join(', ')}`);
      process.exit(1);
    }
  }

  const rootPkg = readRootPkg();
  const currentVersion = rootPkg.version;
  const nextVersion = version ?? bumpVersion(currentVersion, bump);

  console.log(`\nVersion: ${currentVersion} -> ${nextVersion}${dryRun ? ' (dry run)' : ''}`);
  console.log(`Libs:    ${libs.join(', ')}`);
  console.log(`Tag:     ${tag}\n`);

  for (const lib of libs) {
    console.log(`\n[${lib}]`);

    console.log('  Building...');
    run(`ng build ${lib}`);

    const distPkgPath = join(ROOT, 'dist', lib, 'package.json');
    const distPkg = JSON.parse(readFileSync(distPkgPath, 'utf8'));

    if (distPkg.version !== PLACEHOLDER) {
      console.warn(`  Warning: expected "${PLACEHOLDER}", found "${distPkg.version}"`);
    }

    distPkg.version = nextVersion;

    if (!dryRun) {
      writeFileSync(distPkgPath, JSON.stringify(distPkg, null, 2) + '\n');
      run(`npm publish --access public --tag ${tag}`, join(ROOT, 'dist', lib));
      console.log(`  Published @cngx/${lib}@${nextVersion}`);
    } else {
      console.log(`  Would publish @cngx/${lib}@${nextVersion} (dist/${lib})`);
    }
  }

  // Update root version after all libs published successfully
  if (!dryRun) {
    rootPkg.version = nextVersion;
    writeRootPkg(rootPkg);
    console.log(`\nRoot package.json updated to ${nextVersion}`);
  }

  console.log('\nDone.');
}

main();
