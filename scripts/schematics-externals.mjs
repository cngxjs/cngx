// The modules a schematics bundle may leave to the consumer's install, and the
// check build-schematics runs on every bundle it writes. Shared with the dist
// smoke test, so the build guard and the shipped-bundle check read one list.

import { builtinModules } from 'node:module';

/**
 * Bundled as externals: they come from the consumer's Angular CLI install.
 * `@schematics/angular/third_party/*` is not one of them (see below).
 */
export const EXTERNAL = [
  '@angular-devkit/*',
  '@schematics/angular',
  '@schematics/angular/*',
  'typescript',
  '@angular/compiler',
];

// The vendored TypeScript of @schematics/angular 21 is gone in 22, which
// depends on `typescript` instead; a bundle that reaches into it crashes
// `ng add` at load time on the newer CLI. Import `typescript` directly, the
// way @angular/cdk and @angular/material schematics do.
const FORBIDDEN_EXTERNAL = /^@schematics\/angular\/third_party\//;

function isNodeBuiltin(specifier) {
  return specifier.startsWith('node:') || builtinModules.includes(specifier);
}

function isDeclaredExternal(specifier) {
  return EXTERNAL.some((pattern) =>
    pattern.endsWith('/*') ? specifier.startsWith(pattern.slice(0, -1)) : specifier === pattern,
  );
}

/**
 * Every `require("...")` in a bundle that is neither relative, a Node builtin
 * nor a declared external; a private path of an external counts as an
 * offender. Each one would be resolved from the consumer's install and fail
 * there.
 */
export function externalRequireViolations(code) {
  return [...code.matchAll(/\brequire\("([^"]+)"\)/g)]
    .map(([, specifier]) => specifier)
    .filter((specifier) => !specifier.startsWith('.') && !isNodeBuiltin(specifier))
    .filter((specifier) => FORBIDDEN_EXTERNAL.test(specifier) || !isDeclaredExternal(specifier));
}
