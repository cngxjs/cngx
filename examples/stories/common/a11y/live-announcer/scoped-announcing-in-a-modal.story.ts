import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'injectScopedLiveRegion: Scoped announcing in a modal',
  subtitle:
    '<code>injectScopedLiveRegion(host)</code> appends a polite and an assertive live region inside <code>host</code> instead of <code>document.body</code>. Use it inside <code>aria-modal</code> overlays: VoiceOver drops body-level regions while the modal is open, a region inside the modal is spoken on every platform.',
  description:
    'Same regions and clear-then-set timing as <code>CngxLiveAnnouncer</code>, scoped to one host. The panel component calls <code>injectScopedLiveRegion(inject(ElementRef).nativeElement)</code> in its injection context and <code>ensure()</code> in its constructor, so both regions are in the DOM before the first message. The regions go away with the panel. The fixture sits next to this story as <code>_scoped-status-panel.component.ts</code>.',
  level: 'atom',
  audience: ['a11y', 'dev'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'composition'],
  apiComponents: ['injectScopedLiveRegion', 'CngxFocusTrap', 'CngxFocusRestore'],
  moduleImports: [
    "import { CngxFocusRestore, CngxFocusTrap } from '@cngx/common/a11y';",
    "import { ScopedStatusPanel } from './_scoped-status-panel.component';",
  ],
  imports: ['CngxFocusTrap', 'CngxFocusRestore', 'ScopedStatusPanel'],
  references: [
    {
      label: 'WCAG 2.1 SC 4.1.3 Status Messages',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html',
    },
  ],
  setup: `protected readonly open = signal(false);`,
  template: `  <button type="button" class="chip" (click)="open.set(true)">Open editor</button>

  @if (open()) {
    <div class="cngx-ex-overlay-backdrop">
      <div class="cngx-ex-overlay-panel"
           cngxFocusTrap
           [enabled]="true"
           cngxFocusRestore
           role="dialog"
           aria-modal="true"
           aria-labelledby="scoped-announcing-title"
           (keydown.escape)="open.set(false)">
        <h3 id="scoped-announcing-title" style="margin:0">Edit draft</h3>
        <demo-scoped-status-panel (closed)="open.set(false)" />
      </div>
    </div>
  }`,
};
