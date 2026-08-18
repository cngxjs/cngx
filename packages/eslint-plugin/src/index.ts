import { plugin } from './plugin';

/**
 * Package entry. Exported via `export =` (not `export default`).
 *
 * Under CJS output `export default` emits `exports.default`, so an ESM
 * flat-config `import cngx from '@cngx/eslint-plugin'` would resolve to
 * `{ default: plugin }` and `plugins: { cngx }` would break. `export =` resolves
 * to the plugin object directly under both `require` and an ESM default import.
 */
export = plugin;
