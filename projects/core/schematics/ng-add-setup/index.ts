import { select } from '@inquirer/prompts';
import { type Rule, type SchematicContext, type Tree } from '@angular-devkit/schematics';
import { readWorkspace } from '@schematics/angular/utility';

export interface NgAddSetupOptions {
  readonly project?: string;
  readonly preset?: 'minimal' | 'recommended' | 'full';
}

interface PackageManifest {
  readonly dependencies?: Readonly<Record<string, string>>;
  readonly devDependencies?: Readonly<Record<string, string>>;
}

const SPIKE_FILE = '.cngx/spike.json';

function readManifest(tree: Tree): PackageManifest {
  const raw = tree.readText('package.json');
  return JSON.parse(raw) as PackageManifest;
}

function hasPackage(manifest: PackageManifest, name: string): boolean {
  return name in (manifest.dependencies ?? {}) || name in (manifest.devDependencies ?? {});
}

/**
 * Stage two smoke. Logs what detection sees, asks one question when a TTY
 * is attached, writes one file. Exists only to answer the Phase 0 spike
 * questions; the real stage two replaces it in Phase 4.
 */
export function ngAddSetup(options: NgAddSetupOptions): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    const workspace = await readWorkspace(tree);
    const manifest = readManifest(tree);
    const projects = [...workspace.projects.keys()];
    const facts = {
      projects,
      project: options.project ?? projects[0] ?? null,
      material: hasPackage(manifest, '@angular/material'),
      cngxUtils: hasPackage(manifest, '@cngx/utils'),
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
