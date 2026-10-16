import { posix } from 'node:path';

import { declaredRange, hasArrayLiteral, type PackageManifest } from '../../engine';

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

export function isSourceFile(path: string): boolean {
  return path.endsWith('.ts') && !path.endsWith('.spec.ts');
}

// Follows the import of the second `bootstrapApplication` argument or the
// `bootstrapModule` argument; a providers array written into the bootstrap
// call keeps main.ts, anything else falls back to the scaffold path.
export function rootProvidersPath(mainPath: string, main: string, standalone: boolean, sourceRoot: string): string {
  const fallback = posix.join(sourceRoot, 'app', 'app.config.ts');
  const call = standalone ? /bootstrapApplication\s*\(\s*\w+\s*,\s*(\w+)/ : /bootstrapModule\s*\(\s*(\w+)/;
  const identifier = call.exec(main)?.[1];
  if (identifier === undefined) {
    return hasArrayLiteral(main, { kind: 'root-providers' }) ? mainPath : fallback;
  }
  const specifier = new RegExp(`import\\s*\\{[^}]*\\b${identifier}\\b[^}]*\\}\\s*from\\s*['"](\\.[^'"]+)['"]`).exec(main)?.[1];
  return specifier === undefined ? fallback : `${posix.join(posix.dirname(mainPath), specifier)}.ts`;
}

// Build output and installs below the source root hold no app components.
export const SKIPPED_SOURCE_DIRS: ReadonlySet<string> = new Set(['node_modules', 'dist']);

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
