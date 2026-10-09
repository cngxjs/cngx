import { select } from '@inquirer/prompts';
import { type Rule, type SchematicContext, type Tree } from '@angular-devkit/schematics';
import { readWorkspace } from '@schematics/angular/utility';

import { declaredRange, type NgAddOptions, parseManifest } from '../shared/manifest';

const SPIKE_FILE = '.cngx/spike.json';

/**
 * Stage two smoke. Logs what detection sees, asks one question when a TTY
 * is attached, writes one file. A probe for the CLI behaviour recorded in
 * SPIKE.md, not the onboarding itself.
 */
export function ngAddSetup(options: NgAddOptions): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    const workspace = await readWorkspace(tree);
    const manifest = parseManifest(tree.readText('package.json'));
    const projects = [...workspace.projects.keys()];
    const facts = {
      projects,
      project: options.project ?? projects[0] ?? null,
      material: declaredRange(manifest, '@angular/material') !== undefined,
      cngxUtils: declaredRange(manifest, '@cngx/utils') !== undefined,
      isTTY: process.stdout.isTTY === true,
    };
    context.logger.info(`cngx ng-add-setup: detection ${JSON.stringify(facts)}`);

    // `ng add` strips --interactive and --dry-run before the rule runs, so
    // the terminal itself is the only signal available here.
    const canPrompt = facts.isTTY;
    const theme = canPrompt
      ? await select({
          message: 'Which theme should cngx generate?',
          choices: [
            { name: 'cngx default', value: 'cngx' },
            { name: 'Material bridge', value: 'material' },
          ],
        })
      : 'cngx';
    context.logger.info(`cngx ng-add-setup: theme answer "${theme}" (prompted: ${canPrompt})`);

    const content = JSON.stringify({ facts, preset: options.preset ?? 'recommended', theme }, null, 2) + '\n';
    if (tree.exists(SPIKE_FILE)) {
      tree.overwrite(SPIKE_FILE, content);
    } else {
      tree.create(SPIKE_FILE, content);
    }
  };
}
