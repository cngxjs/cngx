import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'String Labels',
  subtitle: 'The simplest usage: pass <code>pendingLabel</code>, <code>succeededLabel</code>, <code>failedLabel</code> as strings. Default content is shown when idle.',
  description: 'Action button molecule with built-in status templates. Zero boilerplate alternative to CngxAsyncClick.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['async-state', 'composition', 'visual-variants'],
  apiComponents: [
    'CngxActionButton',
    'CngxPending',
    'CngxSucceeded',
    'CngxFailed',
  ],
  moduleImports: [
    'import { CngxActionButton } from \'@cngx/ui\';',
  ],
  imports: ['CngxActionButton'],
  setupChrome: `protected readonly saveAction = () => new Promise<void>(resolve => setTimeout(resolve, 1500));
  protected readonly deleteAction = () => new Promise<void>((_, reject) =>
    setTimeout(() => reject(new Error('403 Forbidden')), 1000),
  );`,
  template: ``,
  templateChrome: `<div class="button-row" style="gap:12px">
    <cngx-action-button [action]="saveAction" pendingLabel="Saving..." succeededLabel="Saved!">
      Save Draft
    </cngx-action-button>
    <cngx-action-button [action]="deleteAction" pendingLabel="Deleting..." failedLabel="Failed!">
      Delete
    </cngx-action-button>
  </div>`,
};
