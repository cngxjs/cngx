#!/usr/bin/env node
// Usage (the examples-e2e and console-sweep jobs of ci.yml):
//   node scripts/e2e-gate.mjs <e2e-scope result> <scope mode> <shard result>
//
// The required check of a sharded e2e suite. GitHub reports a matrix job
// under its expanded name, so the check branch protection names is this job:
// it passes when every shard passed, or when the scope ran and found nothing
// to run (the shards are then skipped on purpose). A skip for any other
// reason, a failed or cancelled shard, or a scope that did not decide fails.

import { pathToFileURL } from 'node:url';

/** Why the suite fails, or undefined when it passes. */
export function gateFailure(scopeResult, mode, shardResult) {
  if (scopeResult !== 'success') {
    return `the e2e-scope job ended with "${scopeResult}"`;
  }
  if (mode === 'none' && shardResult === 'skipped') {
    return undefined;
  }
  return shardResult === 'success' ? undefined : `the shards ended with "${shardResult}" (scope ${mode})`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [scopeResult, mode, shardResult] = process.argv.slice(2);
  const failure = gateFailure(scopeResult, mode, shardResult);
  if (failure !== undefined) {
    console.error(`e2e gate: ${failure}`);
    process.exit(1);
  }
  console.log(mode === 'none' ? 'e2e gate: no example demo reached; nothing to run' : 'e2e gate: every shard passed');
}
