#!/usr/bin/env node
// Usage:
//   node scripts/publish.mjs --bump patch              # all libs, bump patch
//   node scripts/publish.mjs --bump minor              # all libs, bump minor
//   node scripts/publish.mjs --version 1.2.3           # all libs, explicit version
//   node scripts/publish.mjs --lib core --bump patch   # single lib
//   node scripts/publish.mjs --dry-run --bump patch    # preview without publishing
//   node scripts/publish.mjs --tag next --bump major   # publish with dist-tag
//   node scripts/publish.mjs --skip-git-tag --bump patch  # do not tag/push git
//   node scripts/publish.mjs --registry <url> ...      # override npm registry

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '..');
const LIBS = ['utils', 'core', 'common', 'forms', 'data-display', 'ui'];
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

function walkJs(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkJs(full));
    else if (entry.name.endsWith('.js') || entry.name.endsWith('.mjs')) files.push(full);
  }
  return files;
}

function replaceVersionInDist(distDir, nextVersion) {
  for (const file of walkJs(distDir)) {
    const content = readFileSync(file, 'utf8');
    if (content.includes(PLACEHOLDER)) {
      writeFileSync(file, content.replaceAll(PLACEHOLDER, nextVersion));
    }
  }
}

function run(cmd, cwd = ROOT) {
  console.log(`  $ ${cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit' });
}

function capture(cmd, cwd = ROOT) {
  return execSync(cmd, { cwd, encoding: 'utf8' }).trim();
}

function assertCleanWorktree() {
  const status = capture('git status --porcelain');
  if (status.length > 0) {
    console.error('Refusing to publish: working tree is dirty.');
    console.error('Commit or stash changes first, then re-run.');
    console.error('\n--- git status ---');
    console.error(status);
    process.exit(1);
  }
}

function assertTagAvailable(tagName) {
  const existing = capture(`git tag --list ${tagName}`);
  if (existing) {
    console.error(`Refusing to publish: git tag "${tagName}" already exists.`);
    console.error('Bump to a different version or delete the tag first.');
    process.exit(1);
  }
}

function createAndPushGitTag(version) {
  const tagName = `v${version}`;
  run(`git tag ${tagName} -m "Release ${tagName}"`);
  run(`git push origin ${tagName}`);
  console.log(`  Pushed git tag ${tagName}`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const result = {
    libs: [],
    version: null,
    bump: null,
    dryRun: false,
    tag: 'latest',
    registry: null,
    skipGitTag: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--lib':          result.libs.push(args[++i]); break;
      case '--version':      result.version = args[++i]; break;
      case '--bump':         result.bump = args[++i]; break;
      case '--tag':          result.tag = args[++i]; break;
      case '--registry':     result.registry = args[++i]; break;
      case '--dry-run':      result.dryRun = true; break;
      case '--skip-git-tag': result.skipGitTag = true; break;
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
  const { libs, version, bump, dryRun, tag, registry, skipGitTag } = parseArgs();

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
  const gitTagName = `v${nextVersion}`;

  // Pre-flight: clean worktree + tag availability when going for real
  if (!dryRun) {
    assertCleanWorktree();
    if (!skipGitTag) assertTagAvailable(gitTagName);
  }

  console.log(`\nVersion:  ${currentVersion} -> ${nextVersion}${dryRun ? ' (dry run)' : ''}`);
  console.log(`Libs:     ${libs.join(', ')}`);
  console.log(`Tag:      ${tag}`);
  if (registry) console.log(`Registry: ${registry}`);
  console.log(`Git tag:  ${skipGitTag ? 'skipped' : gitTagName}\n`);

  const registryFlag = registry ? ` --registry ${registry}` : '';

  for (const lib of libs) {
    console.log(`\n[${lib}]`);

    console.log('  Building...');
    run(`npx ng build ${lib}`);

    const distPkgPath = join(ROOT, 'dist', lib, 'package.json');
    const distPkg = JSON.parse(readFileSync(distPkgPath, 'utf8'));

    if (distPkg.version !== PLACEHOLDER) {
      console.warn(`  Warning: expected "${PLACEHOLDER}", found "${distPkg.version}"`);
    }

    distPkg.version = nextVersion;

    if (!dryRun) {
      writeFileSync(distPkgPath, JSON.stringify(distPkg, null, 2) + '\n');
      replaceVersionInDist(join(ROOT, 'dist', lib), nextVersion);
      run(`npm publish --access public --tag ${tag}${registryFlag}`, join(ROOT, 'dist', lib));
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

    if (skipGitTag) {
      console.log('\nGit tagging skipped (--skip-git-tag).');
      console.log('Note: root package.json was bumped — remember to commit it.');
    } else {
      console.log('\nCreating git tag...');
      // Commit the root version bump so the tag points at it
      run(`git add package.json`);
      run(`git commit -m "chore(release): ${nextVersion}"`);
      createAndPushGitTag(nextVersion);
      run(`git push origin HEAD`);
    }
  }

  console.log('\nDone.');
}

main();
