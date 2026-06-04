import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxFocusTrap: Slide-out drawer',
  subtitle:
    'A drawer that slides in from either side. Focus is trapped inside while open. Demonstrates <code>[cngxFocusTrap]</code> on a non-modal overlay, useful for filter panels, settings, or navigation drawers.',
  description:
    'Same trap-and-restore composition as the modal demo, but on a side-anchored panel: <code>cngxFocusTrap</code> traps Tab while the drawer is mounted, <code>cngxFocusRestore</code> returns focus to whichever trigger opened it on close. Two trigger buttons drive the same panel from either side without changing the trap or the restore contract. The browser\'s <code>:focus-visible</code> ring only paints reliably after keyboard interaction, so the <code>Focused id</code> readout below makes the restore visible for mouse-driven runs too.',
  level: 'atom',
  audience: ['a11y', 'dev'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior', 'composition'],
  apiComponents: ['CngxFocusTrap', 'CngxFocusRestore'],
  imports: ['CngxFocusTrap', 'CngxFocusRestore'],
  references: [
    {
      label: 'WAI-ARIA APG: Dialog (Modal) pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/',
    },
    {
      label: 'WCAG 2.1 SC 2.1.2 No Keyboard Trap (modal exception)',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/no-keyboard-trap.html',
    },
  ],
  setup: `protected readonly drawerOpen = signal(false);
  protected readonly drawerSide = signal<'left' | 'right'>('right');`,
  setupChrome: `protected readonly focusedId = signal<string>('—');

  constructor() {
    const host = inject(ElementRef).nativeElement as HTMLElement;
    afterNextRender(() => {
      host.addEventListener('focusin', (e) => {
        const t = e.target as HTMLElement | null;
        this.focusedId.set(t?.id || (t?.tagName.toLowerCase() ?? '—'));
      });
      host.addEventListener('focusout', () => {
        setTimeout(() => {
          if (!host.contains(document.activeElement)) {
            this.focusedId.set('—');
          }
        }, 0);
      });
    });
  }`,
  template: `  <div class="button-row">
    <button type="button"
            id="cngx-focus-trap-drawer-trigger-left"
            class="chip"
            (click)="drawerSide.set('left'); drawerOpen.set(true)">Open left drawer</button>
    <button type="button"
            id="cngx-focus-trap-drawer-trigger-right"
            class="chip"
            (click)="drawerSide.set('right'); drawerOpen.set(true)">Open right drawer</button>
  </div>

  @if (drawerOpen()) {
    <div class="cngx-ex-overlay-backdrop"
         [class.cngx-ex-overlay-backdrop--left]="drawerSide() === 'left'"
         [class.cngx-ex-overlay-backdrop--right]="drawerSide() === 'right'"
         (click)="drawerOpen.set(false)">
      <div class="cngx-ex-overlay-panel cngx-ex-overlay-panel--drawer"
           cngxFocusTrap
           [enabled]="drawerOpen()"
           cngxFocusRestore
           (keydown.escape)="drawerOpen.set(false)"
           (click)="$event.stopPropagation()"
           tabindex="-1"
           role="dialog"
           aria-modal="true"
           aria-labelledby="cngx-focus-trap-drawer-title">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <h3 id="cngx-focus-trap-drawer-title" style="margin:0;font-size:1rem">Filter options</h3>
          <button type="button"
                  class="chip"
                  aria-label="Close drawer"
                  (click)="drawerOpen.set(false)">&#x2715;</button>
        </div>

        <label for="cngx-focus-trap-drawer-category" style="display:flex;flex-direction:column;gap:4px;font-size:0.8125rem">
          Category
          <select id="cngx-focus-trap-drawer-category">
            <option>All categories</option>
            <option>Electronics</option>
            <option>Clothing</option>
            <option>Books</option>
          </select>
        </label>

        <label for="cngx-focus-trap-drawer-price" style="display:flex;flex-direction:column;gap:4px;font-size:0.8125rem">
          Price range
          <input id="cngx-focus-trap-drawer-price" type="range" min="0" max="500" value="250" style="width:100%" />
        </label>

        <label style="display:flex;align-items:center;gap:6px;font-size:0.8125rem">
          <input type="checkbox" />
          In stock only
        </label>

        <label style="display:flex;align-items:center;gap:6px;font-size:0.8125rem">
          <input type="checkbox" />
          Free shipping
        </label>

        <div style="flex:1"></div>

        <div class="button-row">
          <button type="button" class="chip" (click)="drawerOpen.set(false)">Apply filters</button>
          <button type="button" class="chip" (click)="drawerOpen.set(false)">Reset</button>
        </div>
      </div>
    </div>
  }`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Drawer</span>
      <span class="event-value">{{ drawerOpen() ? drawerSide() + ', focus trapped' : 'closed' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Focused id</span>
      <span class="event-value">{{ focusedId() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Side</span>
      <span class="event-value">{{ drawerSide() }}</span>
    </div>
  </div>`,
};
