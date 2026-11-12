#!/usr/bin/env node
// The release tags the docs site keeps next to `main`: final releases only
// (prereleases have no docs of their own), from DOCS_MIN_VERSION on, the
// newest DOCS_KEEP_VERSIONS of them. deploy-docs.yml builds one docs folder
// per printed tag.
//
// Usage:
//   node scripts/docs-release-tags.mjs        # one tag per line, newest first
//   DOCS_KEEP_VERSIONS=2 node scripts/docs-release-tags.mjs

import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const DOCS_MIN_VERSION = '0.3.0';
export const DOCS_KEEP_VERSIONS = 4;

const FINAL_TAG = /^v(\d+)\.(\d+)\.(\d+)$/;
const FINAL_VERSION = /^\d+\.\d+\.\d+$/;

const parts = (version) => version.split('.').map(Number);

function compareVersions(a, b) {
  const [left, right] = [parts(a), parts(b)];
  for (let i = 0; i < 3; i += 1) {
    if (left[i] !== right[i]) {
      return left[i] - right[i];
    }
  }
  return 0;
}

/**
 * The final release tags (`v<major>.<minor>.<patch>`) at or above `min`, newest
 * first, at most `keep` of them. Anything else (prereleases, other tags) is
 * dropped, so no prerelease ordering is needed.
 */
export function selectReleaseTags(tags, { min, keep }) {
  return finalTagsFrom(tags, min).slice(0, keep);
}

/**
 * The counterpart of `selectReleaseTags`: the final release tags at or above
 * `min` that fell out of the newest `keep`, newest first. Their docs are no
 * longer built; the deploy answers their error-code URLs with moved pages.
 */
export function selectDroppedTags(tags, { min, keep }) {
  return finalTagsFrom(tags, min).slice(keep);
}

function finalTagsFrom(tags, min) {
  return tags
    .filter((tag) => FINAL_TAG.test(tag))
    .map((tag) => tag.slice(1))
    .filter((version) => compareVersions(version, min) >= 0)
    .sort((a, b) => compareVersions(b, a))
    .map((version) => `v${version}`);
}

/** `min` and `keep` from the environment; a malformed value throws. */
export function parseReleaseTagOptions(env) {
  const min = env.DOCS_MIN_VERSION ?? DOCS_MIN_VERSION;
  if (!FINAL_VERSION.test(min)) {
    throw new Error(`DOCS_MIN_VERSION "${min}" is not a final version (x.y.z)`);
  }
  const rawKeep = env.DOCS_KEEP_VERSIONS ?? String(DOCS_KEEP_VERSIONS);
  const keep = Number(rawKeep);
  if (!Number.isInteger(keep) || keep < 1) {
    throw new Error(`DOCS_KEEP_VERSIONS "${rawKeep}" is not a positive integer`);
  }
  return { min, keep };
}

function main() {
  let options;
  try {
    options = parseReleaseTagOptions(process.env);
  } catch (error) {
    console.error(`docs-release-tags: ${error.message}`);
    process.exit(1);
  }
  const tags = execFileSync('git', ['tag', '--list', 'v*'], { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);
  for (const tag of selectReleaseTags(tags, options)) {
    console.log(tag);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
