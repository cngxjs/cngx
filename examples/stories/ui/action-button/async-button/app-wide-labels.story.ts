import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxActionButton: App-wide labels',
  subtitle:
    'One <code>provideCngxButtonAt(withActionStatusLabels(...))</code> gives every action host in scope its pending, succeeded and failed labels; a bound label still wins.',
  description:
    "The view provides <code>withActionStatusLabels({ pending: 'Working...', succeeded: 'Done', failed: 'Failed' })</code> through <code>provideCngxButtonAt</code>, which routes it to <code>CNGX_ACTION_STATUS_CONFIG</code>. Save and Delete bind no label: Save succeeds with the scoped Done, Delete fails with the scoped Failed. Publish binds <code>succeededLabel=\"Published\"</code>, so its own label wins over the scope. Archive binds <code>failedLabel=\"\"</code>: an empty label switches its failed cell off, so the button keeps its idle text after the failure while the live region still speaks the i18n copy. The English language pack leaves every label empty, so without a scope or a bound label an action host shows only its content. Labels set app-wide this way, or in a language pack section <code>actionStatus</code>, are copy and follow a language switch when passed as a <code>Signal</code>.",
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'async-state'],
  apiComponents: ['CngxActionButton', 'CngxActionStatusBrain'],
  moduleImports: [
    "import { provideCngxButtonAt } from '@cngx/common/button';",
    "import { withActionStatusLabels } from '@cngx/common/interactive';",
    "import { CngxActionButton } from '@cngx/ui/action-button';",
  ],
  imports: ['CngxActionButton'],
  viewProviders: [
    "...provideCngxButtonAt(withActionStatusLabels({ pending: 'Working...', succeeded: 'Done', failed: 'Failed' }))",
  ],
  setup: `protected readonly succeed = (): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, 1200));

  protected readonly fail = (): Promise<void> =>
    new Promise((_, reject) => setTimeout(() => reject(new Error('Locked')), 1000));`,
  template: `
  <div style="display:flex;gap:.5rem;align-items:center;flex-wrap:wrap">
    <button cngxActionButton tone="primary" [action]="succeed">Save</button>
    <button cngxActionButton="outline" [action]="succeed" succeededLabel="Published">Publish</button>
    <button cngxActionButton="outline" tone="danger" [action]="fail">Delete</button>
    <button cngxActionButton="outline" tone="danger" [action]="fail" failedLabel="">Archive</button>
  </div>`,
};
