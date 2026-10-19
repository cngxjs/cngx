import { SchematicsException } from '@angular-devkit/schematics';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { type StarterTemplates } from '../steps/starter';

/** The starter's files in `ng-add/files/starter`, by the key the step reads them under. */
export const STARTER_TEMPLATE_FILES: Readonly<Record<keyof StarterTemplates, string>> = {
  component: 'app.ts.tpl',
  template: 'app.html.tpl',
  stylesheet: 'app.css.tpl',
  favicon: 'favicon.svg',
};

/**
 * Reads the starter's files from `dir`, `files/starter` next to the ng-add
 * entry in the sources and in the published package alike; they ship as
 * files, not inside the bundle. A missing one is an incomplete package.
 */
export function readStarterTemplates(dir: string): StarterTemplates {
  const read = (file: string): string => {
    const path = join(dir, file);
    if (!existsSync(path)) {
      throw new SchematicsException(`${path} is missing; reinstall @cngx/core, its package is incomplete.`);
    }
    return readFileSync(path, 'utf8');
  };
  return {
    component: read(STARTER_TEMPLATE_FILES.component),
    template: read(STARTER_TEMPLATE_FILES.template),
    stylesheet: read(STARTER_TEMPLATE_FILES.stylesheet),
    favicon: read(STARTER_TEMPLATE_FILES.favicon),
  };
}
