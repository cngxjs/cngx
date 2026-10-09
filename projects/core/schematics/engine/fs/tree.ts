/**
 * The engine's only filesystem contract. Every `@schematics/angular` utility
 * takes a devkit `Tree`, so the schematics, the CLI and the specs share it
 * instead of a port of their own.
 */
export type { Tree } from '@angular-devkit/schematics';
