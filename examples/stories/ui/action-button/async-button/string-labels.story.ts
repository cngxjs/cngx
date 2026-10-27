import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxActionButton: String labels',
  subtitle: 'The simplest usage: pass <code>pendingLabel</code>, <code>succeededLabel</code>, <code>failedLabel</code> as strings. Default content is shown when idle.',
  description: 'Two buttons exercise the success and error paths separately so each terminal state is reachable deterministically; both rely on the built-in templates with custom string labels. Variant and tone are the <code>cngxButton</code> axes: <code>cngxActionButton="outline"</code> binds the variant through the selector.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['async-state', 'composition', 'visual-variants'],
  apiComponents: [
    'CngxActionButton',
  ],
  moduleImports: [
    'import { CngxActionButton } from \'@cngx/ui\';',
  ],
  imports: ['CngxActionButton'],
  setup: `protected readonly saveAction = () => new Promise<void>(resolve => setTimeout(resolve, 1500));
  protected readonly deleteAction = () => new Promise<void>((_, reject) =>
    setTimeout(() => reject(new Error('403 Forbidden')), 1000),
  );`,
  template: `
  <div style="display:flex;gap:.5rem;align-items:center;flex-wrap:wrap">
    <button cngxActionButton tone="primary" [action]="saveAction" pendingLabel="Saving..." succeededLabel="Saved!">
      Save Draft
    </button>
    <button cngxActionButton="outline" tone="danger" [action]="deleteAction" pendingLabel="Deleting..." failedLabel="Failed!">
      Delete
    </button>
  </div>`,
};
