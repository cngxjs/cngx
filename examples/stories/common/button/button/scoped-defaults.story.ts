import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxButton: Scoped defaults',
  subtitle: 'Set the variant, size, busy glyph and close glyph of every button in a subtree with one <code>provideCngxButtonAt</code> call.',
  description: '<code>provideCngxButton</code> is the one entry point for the button family: config features (<code>withButtonVariant</code>, <code>withButtonTone</code>, <code>withButtonSize</code>), the close glyph (<code>withButtonCloseIcon</code>) and the busy glyph (<code>withButtonSpinner</code>) in one call at the app root. <code>provideCngxButtonAt</code> is the component-scoped twin for <code>viewProviders</code>; its config merges over the parent scope, so a subtree overrides only what it names. Here the three <code>cngxButton</code> buttons are outline and small and show dots while busy, without one input setting that on them. An input still wins: Publish sets <code>cngxButton="solid"</code>. The close button at the end renders the circled X from <code>withButtonCloseIcon</code> and keeps its own ghost, small and neutral axes, because a dismiss affordance never follows the app defaults. The menu-button glyphs and labels go through <code>provideCngxMenuButtonAt</code> in <code>@cngx/common/menu-button</code>.',
  level: 'molecule',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['composition', 'visual-variants'],
  apiComponents: ['CngxButton', 'CngxCloseButton', 'CngxAsyncClick'],
  moduleImports: [
    "import { CngxButton, CngxCloseButton, provideCngxButtonAt, withButtonCloseIcon, withButtonSize, withButtonSpinner, withButtonVariant } from '@cngx/common/button';",
    "import { CngxAsyncClick } from '@cngx/common/interactive';",
    "import { DotsSpinner } from './_dots-spinner.component';",
    "import { CircleClose } from '../close-button/_circle-close.component';",
  ],
  imports: ['CngxButton', 'CngxCloseButton', 'CngxAsyncClick'],
  viewProviders: [
    "...provideCngxButtonAt(withButtonVariant('outline'), withButtonSize('sm'), withButtonSpinner(DotsSpinner), withButtonCloseIcon(CircleClose))",
  ],
  setup: `
  protected readonly save = (): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, 1500));`,
  template: `
  <div class="demo-inline-actions">
    <button cngxButton>Cancel</button>
    <button cngxButton tone="primary" [cngxAsyncClick]="save">Save draft</button>
    <button cngxButton="solid" tone="primary" [cngxAsyncClick]="save">Publish</button>
    <button cngxCloseButton aria-label="Close editor"></button>
  </div>`,
};
