import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxDialogOpener (Programmatic)',
  subtitle: 'For fully programmatic dialogs — no <code>&lt;dialog&gt;</code> in your template — use <code>CngxDialogOpener</code>. Requires <code>provideDialog()</code> in providers. Returns a typed <code>CngxDialogRef</code> with Signal-based result and Observable compat.',
  description: 'Signal-driven state machine for native <dialog>. Typed results, deterministic focus return, ARIA communication, CSS transition support, and opt-in draggable behavior.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern', 'behavior'],
  apiComponents: [
    'CngxDialog',
    'CngxDialogTitle',
    'CngxDialogDescription',
    'CngxDialogClose',
    'CngxDialogDraggable',
    'CngxDialogStack',
  ],
  template: `
  <div class="code-block">
    <strong>CngxDialogOpener</strong> is the imperative escape hatch for cases where
    a declarative &lt;dialog&gt; in the template is impractical — e.g. opening a dialog
    from a service, or when the dialog component lives in a separate feature.
    <br><br>
    Key points:
    <ul style="margin: 8px 0 0; padding-left: 20px;">
      <li><code>provideDialog()</code> must be in providers (app or feature level)</li>
      <li><code>dialog.open(Component, config)</code> returns a typed <code>CngxDialogRef</code></li>
      <li>Inject <code>CNGX_DIALOG_DATA</code> in the dialog component to receive data</li>
      <li><code>ref.result()</code> is a Signal — use in computed() or effect()</li>
      <li><code>ref.close(value)</code> sets the result and closes the dialog</li>
      <li>The declarative &lt;dialog cngxDialog&gt; approach (shown above) covers most use cases</li>
    </ul>
  </div>`,
};
