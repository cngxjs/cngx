import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxButton: Variants',
  subtitle: 'Five emphasis levels from one selector: the attribute value is the variant.',
  description: 'The variant is the value of the selector itself: <code>cngxButton="outline"</code> and <code>[cngxButton]="variant()"</code> bind the same input, a bare <code>cngxButton</code> falls back to <code>solid</code>. <code>secondary</code> is a tonal fill, <code>ghost</code> paints nothing until hover, <code>link</code> drops the control height and reads as inline text. The host stays the native <code>&lt;button&gt;</code>, so <code>type</code>, forms and every attribute you write land on the real element.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: ['CngxButton'],
  moduleImports: ["import { CngxButton } from '@cngx/common/button';"],
  imports: ['CngxButton'],
  template: `
  <div style="display:flex; flex-direction:column; gap:16px">
    <div style="display:flex; flex-wrap:wrap; align-items:center; gap:12px">
      <button cngxButton>Solid</button>
      <button cngxButton="secondary">Secondary</button>
      <button cngxButton="outline">Outline</button>
      <button cngxButton="ghost">Ghost</button>
      <button cngxButton="link">Link</button>
    </div>
    <div style="display:flex; flex-wrap:wrap; align-items:center; gap:12px">
      <button cngxButton tone="primary">Solid</button>
      <button cngxButton="secondary" tone="primary">Secondary</button>
      <button cngxButton="outline" tone="primary">Outline</button>
      <button cngxButton="ghost" tone="primary">Ghost</button>
      <button cngxButton="link" tone="primary">Link</button>
    </div>
  </div>`,
};
