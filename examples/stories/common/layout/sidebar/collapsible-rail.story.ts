import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSidebar: Collapsible rail',
  subtitle:
    '<code>[cngxSidebar]</code> reserves inline space and collapses to a rail or out of the layout. A <code>[cngxPanelTrigger]</code> toggles it; resting the pointer on the collapsed rail peeks it over the content without reflow.',
  description:
    'A navigation sidebar next to a content lane. The trigger carries aria-controls and aria-expanded from the sidebar. Collapsed as a rail, the entries stay operable and show only their initial; hovering the rail peeks the full sidebar over the content, and Escape or moving focus out ends the peek. Collapsed as hidden, the sidebar reserves no space and is inert and aria-hidden until expanded.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'a11y-pattern'],
  apiComponents: ['CngxSidebar', 'CngxPanelTrigger'],
  moduleImports: ["import { CngxPanelTrigger, CngxSidebar } from '@cngx/common/layout';"],
  imports: ['CngxSidebar', 'CngxPanelTrigger'],
  setup: `
  protected readonly collapsed = signal(false);
  protected readonly collapsedAs = signal<'rail' | 'hidden'>('rail');
  protected readonly links = ['Inbox', 'Drafts', 'Archive'];`,
  template: `
  <button type="button" [cngxPanelTrigger]="sidebar">Navigation</button>
  <div style="display: flex; block-size: 14rem; margin-top: 0.5rem; border: 1px solid var(--cngx-border, currentColor); border-radius: 0.5rem; overflow: hidden;">
    <nav cngxSidebar #sidebar="cngxSidebar" [role]="null" aria-label="Main"
         [(collapsed)]="collapsed" [collapsedAs]="collapsedAs()"
         style="flex: none; overflow: hidden; background: var(--cngx-surface, Canvas); border-inline-end: 1px solid var(--cngx-border, currentColor);">
      <ul style="list-style: none; margin: 0; padding: 0.5rem; display: grid; gap: 0.25rem;">
        @for (link of links; track link) {
          <li>
            <button type="button" [attr.aria-label]="sidebar.expanded() ? null : link"
                    style="display: block; inline-size: 100%; padding: 0.5rem; text-align: start; white-space: nowrap;">
              {{ sidebar.expanded() ? link : link.charAt(0) }}
            </button>
          </li>
        }
      </ul>
    </nav>
    <main style="flex: 1; min-inline-size: 0; padding: 0.75rem;">
      <p>Content lane. Its start edge follows the reserved space, not the peek.</p>
    </main>
  </div>`,
  setupChrome: `
  protected readonly rests: ('rail' | 'hidden')[] = ['rail', 'hidden'];`,
  templateChrome: `
  <div class="filter-row" role="group" aria-label="Collapsed as" style="margin-top: 12px">
    @for (r of rests; track r) {
      <button type="button" class="chip" [attr.aria-pressed]="collapsedAs() === r"
              (click)="collapsedAs.set(r)">{{ r }}</button>
    }
  </div>
  <div class="event-grid">
    <div class="event-row">
      <span class="event-label">collapsed()</span>
      <span class="event-value">{{ collapsed() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">sidebar.state()</span>
      <span class="event-value">{{ sidebar.state() }}</span>
    </div>
  </div>`,
};
