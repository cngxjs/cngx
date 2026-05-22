import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBeforeUnload: Protect dirty form',
  subtitle: 'Bind <code>[cngxBeforeUnload]</code> to a dirty signal. When the page is closed, refreshed, or the URL is changed externally while the binding is <code>true</code>, the browser shows its native unload confirmation.',
  description: 'Window-level <code>beforeunload</code> guard. Attaches a listener while the host is alive; calls <code>event.preventDefault()</code> only when the bound signal is <code>true</code>, which triggers the browser-native "Leave this page?" dialog. The dialog text and styling are browser-controlled, not consumer-customisable. The directive does NOT integrate with the Angular Router; pair with <code>canDeactivateWhenClean()</code> for in-app route navigation guards. Touch the textarea to flip the dirty signal, then try refreshing the tab; the Save button resets the signal so subsequent refreshes pass through.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'integration'],
  apiComponents: [
    'CngxBeforeUnload',
  ],
  moduleImports: [
    'import { CngxBeforeUnload } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxBeforeUnload'],
  references: [
    { label: 'HTML Living Standard: `beforeunload` event', href: 'https://html.spec.whatwg.org/multipage/indices.html#event-beforeunload' },
    { label: 'WCAG 2.1 SC 3.3.4 Error Prevention', href: 'https://www.w3.org/WAI/WCAG21/Understanding/error-prevention-legal-financial-data.html' },
  ],
  setup: `
  protected readonly isDirty = signal<boolean>(false);
  protected readonly draft = signal<string>('');

  protected handleInput(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.draft.set(value);
    this.isDirty.set(value.length > 0);
  }

  protected handleSave(): void {
    this.isDirty.set(false);
  }

  protected handleReset(): void {
    this.draft.set('');
    this.isDirty.set(false);
  }`,
  template: `
  <form [cngxBeforeUnload]="isDirty()" style="display:flex; flex-direction:column; gap:8px; max-width:32rem">
    <label for="bu-draft">Draft note</label>
    <textarea
      id="bu-draft"
      rows="4"
      [value]="draft()"
      (input)="handleInput($event)"
    ></textarea>
    <button type="button" (click)="handleSave()" style="align-self:flex-start">Save</button>
  </form>`,
  templateChrome: `
  <div class="button-row" style="margin-top:12px">
    <button type="button" (click)="handleReset()">Reset draft</button>
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">isDirty()</span>
      <span class="event-value">{{ isDirty() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">guard active</span>
      <span class="event-value">{{ isDirty() ? 'beforeunload will fire' : 'no guard' }}</span>
    </div>
  </div>`,
};
