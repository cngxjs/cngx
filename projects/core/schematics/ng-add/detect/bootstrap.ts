import { posix } from 'node:path';

import {
  declaredRange,
  hasArrayLiteral,
  type PackageManifest,
  readBootstrapCall,
  topLevelBindings,
  unfollowedRootProviders,
} from '../../engine';

const OTHER_UI_LIBRARIES = ['@angular/material', 'primeng', 'tailwindcss', 'bootstrap'];

// What `ng new` 21 puts into the root providers; anything else means someone
// has already wired the app.
const SCAFFOLD_PROVIDERS = new Set([
  'provideBrowserGlobalErrorListeners',
  'provideRouter',
  'provideZoneChangeDetection',
  'provideZonelessChangeDetection',
  'provideClientHydration',
]);

// Follows the import of the second `bootstrapApplication` argument or the
// `bootstrapModule` argument; a providers array written into the bootstrap
// call keeps main.ts (also one cngx cannot edit, so it is named there),
// anything else falls back to the scaffold path. The call
// is read from the syntax tree, so a commented-out one never counts.
export function rootProvidersPath(mainPath: string, main: string, standalone: boolean, sourceRoot: string): string {
  const fallback = posix.join(sourceRoot, 'app', 'app.config.ts');
  const call = readBootstrapCall(main);
  const application = call?.kind === 'application' ? call.configName : undefined;
  const identifier = standalone ? application : call?.kind === 'module' ? call.moduleName : undefined;
  if (identifier === undefined) {
    const inline = hasArrayLiteral(main, { kind: 'root-providers' }) || unfollowedRootProviders(main) !== undefined;
    return inline ? mainPath : fallback;
  }
  const specifier = topLevelBindings(main).get(identifier)?.module;
  return specifier?.startsWith('.') === true ? `${posix.join(posix.dirname(mainPath), specifier)}.ts` : fallback;
}

// An app is existing once it has more than the root component, another UI
// library, providers beyond the scaffold, or a config written into the
// bootstrap call (`ng new` never writes one there).
export function maturityOf(
  componentCount: number,
  manifest: PackageManifest,
  providers: readonly string[],
  inlineConfig: boolean,
): 'fresh' | 'existing' {
  const hasOtherUi = OTHER_UI_LIBRARIES.some((library) => declaredRange(manifest, library) !== undefined);
  const hasOwnProviders = providers.some((provider) => !SCAFFOLD_PROVIDERS.has(provider));
  return componentCount > 1 || hasOtherUi || hasOwnProviders || inlineConfig ? 'existing' : 'fresh';
}
