import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { NodePackageImporter, compileString } from 'sass';
import { describe, expect, it } from 'vitest';

// The tooltip indicator mixin is documented as
// `@use '@cngx/common/popover/tooltip-indicator'`; it ships as an asset of
// @cngx/common and resolves through the package exports. Checked against the
// built package, so it needs `npm run build:common` (CI builds every lib
// before this suite) and reports as skipped where dist/common is absent.

const DIST_COMMON = resolve(import.meta.dirname, '../../dist/common');

describe('@cngx/common tooltip indicator mixin', () => {
  it.skipIf(!existsSync(join(DIST_COMMON, 'package.json')))(
    'ships the stylesheet and resolves it by its documented @use path',
    () => {
      expect(existsSync(join(DIST_COMMON, 'popover/tooltip-indicator.scss'))).toBe(true);

      const consumer = mkdtempSync(join(tmpdir(), 'cngx-tooltip-indicator-'));
      try {
        mkdirSync(join(consumer, 'node_modules/@cngx'), { recursive: true });
        symlinkSync(DIST_COMMON, join(consumer, 'node_modules/@cngx/common'), 'dir');
        const body = '.x { @include indicator.touch-only(); }';
        // Through the package exports (`pkg:` is how Sass resolves them).
        const viaExports = compileString(
          `@use 'pkg:@cngx/common/popover/tooltip-indicator' as indicator;\n${body}`,
          { importers: [new NodePackageImporter(consumer)] },
        );
        expect(viaExports.css).toContain('.x');
        // The documented bare path, as a node_modules load path resolves it.
        const viaLoadPath = compileString(
          `@use '@cngx/common/popover/tooltip-indicator' as indicator;\n${body}`,
          { loadPaths: [join(consumer, 'node_modules')] },
        );
        expect(viaLoadPath.css).toContain('.x');
      } finally {
        rmSync(consumer, { recursive: true, force: true });
      }
    },
  );
});
