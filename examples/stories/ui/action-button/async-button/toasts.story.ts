import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxActionButton: Toasts',
  subtitle: '<code>toastSuccess</code> and <code>toastError</code> raise one toast per outcome; the toast is the announcement.',
  description: 'The button co-hosts <code>CngxActionToast</code>, so binding <code>toastSuccess</code> / <code>toastError</code> is all it takes once the app provides <code>CngxToaster</code> (<code>provideFeedback(withToasts())</code>, as this examples app does). <code>[toastErrorDetail]</code> appends the error message to the error toast; in development the raw message is shown with a <code>CNGX3004</code> console warning, a production build shows no detail unless the app maps errors to user-facing text with <code>provideFeedback(withErrorDetail(...))</code>. <code>[toastSuccessDuration]</code> shortens the success toast to 2.5 s; <code>toastErrorDuration="persistent"</code> keeps the error toast until it is dismissed, so a failure cannot time out unread. A shown toast is already spoken by the toast region, so the directive provides <code>CNGX_ANNOUNCEMENT_COVER</code> and the live region next to the button stays empty for that outcome: one announcement, not two. The dashed box below logs the button regions only and stays empty here.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['async-state', 'behavior'],
  apiComponents: ['CngxActionButton', 'CngxActionToast'],
  moduleImports: [
    "import { CngxActionButton } from '@cngx/ui';",
    "import { mirrorScreenReader } from '../../../../fixtures';",
  ],
  imports: ['CngxActionButton'],
  setup: `
  protected readonly saveDraft = () =>
    new Promise<void>((resolve) => setTimeout(resolve, 600));

  protected readonly publish = () =>
    new Promise<void>((_, reject) =>
      setTimeout(() => reject(new Error('The server is unreachable.')), 600),
    );`,
  template: `
  <div class="demo-inline-actions">
    <button
      cngxActionButton
      [action]="saveDraft"
      toastSuccess="Draft saved"
      toastError="Save failed"
      [toastErrorDetail]="true"
      [toastSuccessDuration]="2500"
    >Save draft</button>
    <button
      cngxActionButton
      tone="primary"
      [action]="publish"
      toastSuccess="Published"
      toastError="Publish failed"
      [toastErrorDetail]="true"
      toastErrorDuration="persistent"
    >Publish</button>
  </div>`,
  setupChrome: `
  // Logs the live regions next to the buttons into the box below.
  protected readonly sr = mirrorScreenReader([]);`,
  templateChrome: `
  <div class="cngx-ex-sr-output" style="margin-top:12px">
    <p class="cngx-ex-sr-output__title">Button regions receive</p>
    <dl class="cngx-ex-sr-output__list">
      @for (entry of sr.heard(); track entry.n) {
        <dt>#{{ entry.n }}</dt>
        <dd>{{ entry.text }}</dd>
      } @empty {
        <dt>announced</dt>
        <dd>-</dd>
      }
    </dl>
    <p class="cngx-ex-sr-output__note">
      The texts written to the polite live regions next to the buttons. The toast covers each outcome, so nothing lands here; the toast region speaks it once instead. Save draft always succeeds, Publish always fails.
    </p>
  </div>`,
};
