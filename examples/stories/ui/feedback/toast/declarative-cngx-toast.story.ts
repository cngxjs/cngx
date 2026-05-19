import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Declarative (<cngx-toast>)',
  subtitle: 'Place <code>&lt;cngx-toast&gt;</code> in your template. It renders nothing — pushes into the global outlet when <code>[when]</code> becomes <code>true</code>.',
  description: 'Programmatic and declarative toast notifications with dedup, timer pause on hover/touch, and severity-based styling.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['async-state', 'composition', 'a11y-pattern'],
  apiComponents: [
    'CngxToastOutlet',
    'CngxToastOn',
    'CngxToaster',
    'CngxToast',
  ],
  moduleImports: [
    'import { CngxToast } from \'@cngx/ui/feedback\';',
  ],
  imports: ['CngxToast'],
  setup: `protected readonly showSaved = signal(false);
  protected readonly showDeleted = signal(false);
  protected triggerSave(): void {
    this.showSaved.set(true);
    setTimeout(() => this.showSaved.set(false), 100);
  }
  protected triggerDelete(): void {
    this.showDeleted.set(true);
    setTimeout(() => this.showDeleted.set(false), 100);
  }`,
  template: `
  <div style="display:flex;gap:8px">
    <button (click)="triggerSave()" class="chip">Save Item</button>
    <button (click)="triggerDelete()" class="chip">Delete Item</button>
  </div>

  <cngx-toast severity="success" message="Item saved" [when]="showSaved()" />
  <cngx-toast severity="warning" message="Item deleted — this cannot be undone" [when]="showDeleted()" [duration]="8000" />`,
};
