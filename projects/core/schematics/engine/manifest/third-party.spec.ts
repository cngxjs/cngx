import { describe, expect, it } from 'vitest';

import { parseManifest, type PackageManifest } from './manifest';
import { planThirdPartyDependency } from './third-party';

function withDependencies(devDependencies: Record<string, string>): PackageManifest {
  return parseManifest(JSON.stringify({ devDependencies }));
}

describe('planThirdPartyDependency', () => {
  const PROVENANCE = { source: 'ng-add', version: '0.1.0' };
  const PARSER = {
    name: '@angular-eslint/template-parser',
    range: '21.3.0',
    reason: 'parses templates',
    dev: true,
  };

  it('adds a package the app lacks under its range', () => {
    const result = planThirdPartyDependency(withDependencies({}), PARSER, PROVENANCE);

    expect(result).toEqual({
      changes: [
        {
          kind: 'add-dependency',
          id: 'dependency:@angular-eslint/template-parser',
          label: 'Add @angular-eslint/template-parser@21.3.0',
          reason: 'parses templates',
          provenance: PROVENANCE,
          name: '@angular-eslint/template-parser',
          version: '21.3.0',
          dev: true,
        },
      ],
      skipped: [],
    });
  });

  it('keeps a declared package at its own range under the planned id and label', () => {
    const manifest = withDependencies({ '@angular-eslint/template-parser': '^20.0.0' });
    const planned = planThirdPartyDependency(withDependencies({}), PARSER, PROVENANCE);
    const kept = planThirdPartyDependency(manifest, PARSER, PROVENANCE);

    expect(kept.changes).toEqual([]);
    expect(kept.skipped).toEqual([
      {
        id: planned.changes[0]?.id,
        label: planned.changes[0]?.label,
        reason: 'already declared as ^20.0.0',
      },
    ]);
  });

  it('adds a runtime dependency without a dev flag', () => {
    const result = planThirdPartyDependency(
      withDependencies({}),
      { name: '@angular/cdk', range: '^21.2.0', reason: 'a peer' },
      PROVENANCE,
    );

    expect(result.changes[0]).not.toHaveProperty('dev');
  });
});
