import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Closable',
  subtitle: 'Dismiss button via <code>[closable]</code>. SR announces "Alert dismissed".',
  description: 'Inline alert atom with enter/exit animations, state-driven visibility, auto-dismiss with pause-on-hover/focus, auto-collapse, and action buttons.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition', 'a11y-pattern'],
  apiComponents: [
    'CngxAlert',
    'CngxAlertAction',
    'CngxAlertIcon',
  ],
  moduleImports: [
    'import { CngxAlert } from \'@cngx/ui/feedback\';',
  ],
  imports: ['CngxAlert'],
  setup: `protected readonly dismissed = signal(false);`,
  template: `
  @if (!dismissed()) {
    <cngx-alert severity="warning" title="Unsaved changes" [closable]="true" (dismissed)="dismissed.set(true)">
      Your changes will be lost if you leave this page.
    </cngx-alert>
  } @else {
    <button (click)="dismissed.set(false)" class="chip">Show alert again</button>
  }`,
};
