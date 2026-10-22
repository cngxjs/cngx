import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxButton: Tones',
  subtitle: 'Intent is a second axis: every variant takes <code>neutral</code>, <code>primary</code> or <code>danger</code>.',
  description: 'Variant (emphasis) and tone (intent) are orthogonal, so a destructive action can be a quiet <code>outline</code> in a table row and a loud <code>solid</code> in a confirm step without a second component. The grid renders every variant in every tone. Pick a default for the whole app with <code>provideButtonConfig(withButtonTone(...))</code>.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: ['CngxButton'],
  moduleImports: ["import { CngxButton } from '@cngx/common/button';"],
  imports: ['CngxButton'],
  setup: `
  protected readonly variants = ['solid', 'secondary', 'outline', 'ghost', 'link'] as const;
  protected readonly tones = ['neutral', 'primary', 'danger'] as const;`,
  template: `
  <div style="display:grid; grid-template-columns:repeat(5, max-content); align-items:center; gap:12px">
    @for (tone of tones; track tone) {
      @for (variant of variants; track variant) {
        <button [cngxButton]="variant" [tone]="tone">{{ tone }} {{ variant }}</button>
      }
    }
  </div>`,
};
