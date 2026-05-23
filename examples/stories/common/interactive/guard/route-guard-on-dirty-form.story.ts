import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCanDeactivateWhenClean: Route guard on dirty form',
  subtitle: 'Wire <code>canDeactivateWhenClean(() => isDirty())</code> into a route\'s <code>canDeactivate</code> array. The guard shows a <code>confirm()</code> when navigating away from a dirty form, allows the route to leave when clean, and stays SSR-safe.',
  description: 'Functional route guard factory. Returns a <code>CanDeactivateFn</code>-compatible callback that reads the consumer\'s <code>isDirty</code> signal, opens the browser <code>confirm()</code> dialog with the configured message, and gates navigation on the user\'s reply. <code>inject(DOCUMENT)</code> at runtime keeps the guard SSR-safe (returns <code>true</code> when no window is available). Production wiring lives in the route config: <code>&#123; path: \'edit\', component: EditComponent, canDeactivate: [canDeactivateWhenClean(() =&gt; editForm.dirty())] &#125;</code>. The live form lets you see the dirty signal flip; Angular Router invokes the returned guard fn in its own injection context on a real navigation. Pair with <code>CngxBeforeUnload</code> to also cover full-page close and tab refresh.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'integration'],
  apiComponents: [
    'canDeactivateWhenClean',
  ],
  moduleImports: [
    'import { canDeactivateWhenClean } from \'@cngx/common/interactive\';',
  ],
  imports: [],
  references: [
    { label: 'Angular Router: `CanDeactivateFn` guard', href: 'https://angular.dev/api/router/CanDeactivateFn' },
    { label: 'WCAG 2.1 SC 3.3.4 Error Prevention', href: 'https://www.w3.org/WAI/WCAG21/Understanding/error-prevention-legal-financial-data.html' },
  ],
  setup: `
  protected readonly isDirty = signal<boolean>(false);
  protected readonly draft = signal<string>('');

  /**
   * Returned guard fn — Angular Router would invoke this in its own
   * injection context on a navigation attempt. The factory is called
   * here at component-construction time so the demo shows the wiring
   * shape; the returned fn is intentionally not called from a click
   * handler because that would skip the Router's injection context.
   */
  protected readonly canLeave = canDeactivateWhenClean(
    () => this.isDirty(),
    'You have unsaved changes. Leave anyway?',
  );

  protected handleInput(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.draft.set(value);
    this.isDirty.set(value.length > 0);
  }

  protected handleSave(): void {
    this.isDirty.set(false);
  }`,
  template: `
  <form style="display:flex; flex-direction:column; gap:8px; max-width:32rem">
    <label for="dg-draft">Draft note</label>
    <textarea
      id="dg-draft"
      rows="4"
      [value]="draft()"
      (input)="handleInput($event)"
    ></textarea>
    <button type="button" (click)="handleSave()" style="align-self:flex-start">Save</button>
  </form>`,
  templateChromeBefore: `
  <p style="margin-bottom:12px">Touch the textarea to flip the dirty signal, then save to clear it. Production wiring lives in the route config (see description above); Angular Router runs the returned guard fn in its own injection context on a real navigation.</p>`,
  templateChrome: `
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">isDirty()</span>
      <span class="event-value">{{ isDirty() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">canLeave</span>
      <span class="event-value">{{ canLeave ? 'guard fn ready' : '—' }}</span>
    </div>
  </div>`,
};
