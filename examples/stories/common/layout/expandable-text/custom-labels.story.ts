import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Custom Labels',
  subtitle: 'German labels, 2-line limit.',
  description: 'Molecule wrapping CngxTruncate with a built-in expand/collapse toggle and aria-expanded.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: [
    'CngxExpandableText',
  ],
  moduleImports: [
    'import { CngxExpandableText } from \'@cngx/common/layout\';',
  ],
  imports: ['CngxExpandableText'],
  template: `
  <div style="max-width:400px">
    <cngx-expandable-text [lines]="2" moreLabel="Mehr anzeigen" lessLabel="Weniger">
      CNGX ist die fehlende Kompositionsschicht zwischen Angular CDK und Angular Material.
      Es macht beides deklarativ, Signal-first und kommunikativ, ohne sie zu ersetzen.
      Jede Komponente ist dafuer verantwortlich, ihren Zustand vollstaendig zu kommunizieren.
    </cngx-expandable-text>
  </div>`,
};
