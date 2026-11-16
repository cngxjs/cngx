import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxScrollSpy: Scroll based navigation',
  subtitle:
    'Scroll the container. The nav highlights the most visible section and the active section ID is exposed as a signal that doubles as an <code>aria-current</code> source.',
  description:
    'Sticky nav whose [cngxScrollSpy] watches four section IDs inside a scroll container. The directive emits the section with the highest intersection ratio; the demo binds activeId() both to the visual chip state and to aria-current on the matching link.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'a11y-pattern'],
  references: [
    {
      label: 'WAI-ARIA aria-current',
      href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-current',
    },
  ],
  apiComponents: ['CngxScrollSpy'],
  moduleImports: ["import { CngxScrollSpy } from '@cngx/common/layout';"],
  imports: ['CngxScrollSpy'],
  setup: `protected readonly sectionIds = ['spy-intro', 'spy-features', 'spy-pricing', 'spy-faq'];
  protected scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }`,
  template: `  <div style="display:flex;gap:16px;max-width:600px">
    <nav [cngxScrollSpy]="sectionIds" [root]="'.spy-container'" [threshold]="0.1" #spy="cngxScrollSpy"
         aria-label="Section navigation"
         style="position:sticky;top:0;display:flex;flex-direction:column;gap:4px;min-width:100px">
      @for (id of sectionIds; track id) {
        <button type="button"
                class="chip demo-spy-nav-link"
                [attr.aria-current]="spy.activeId() === id ? 'location' : null"
                [attr.aria-pressed]="spy.activeId() === id"
                (click)="scrollTo(id)">
          {{ id.replace('spy-', '') }}
        </button>
      }
    </nav>
    <div class="spy-container demo-spy-container" style="height:300px;overflow-y:auto;flex:1">
      @for (id of sectionIds; track id) {
        <section [id]="id" class="demo-spy-section" style="min-height:200px">
          <h3>{{ id.replace('spy-', '') }}</h3>
          <p>
            Scroll through this section to see the nav update.
            Each section is tall enough to demonstrate the intersection-ratio tracking.
          </p>
        </section>
      }
    </div>
  </div>`,
  css: `.demo-spy-nav-link {
  text-decoration: none;
  font-size: 0.8125rem;
  text-transform: capitalize;
  padding: 6px 10px;
}

.demo-spy-container {
  border: 1px solid var(--cngx-color-border, var(--cngx-ex-border, #d0d5dd));
  border-radius: var(--cngx-radius-md, 8px);
}

.demo-spy-section {
  padding: 20px;
  border-bottom: 1px solid var(--cngx-color-border, var(--cngx-ex-border, #eaeaea));
}

.demo-spy-section:last-child {
  border-bottom: 0;
}

.demo-spy-section h3 {
  margin: 0 0 8px;
  text-transform: capitalize;
}

.demo-spy-section p {
  margin: 0;
  color: var(--cngx-color-text-muted, var(--cngx-ex-muted, #6b7280));
  font-size: 0.875rem;
}`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Active section</span>
      <span class="event-value">{{ spy.activeId() ?? 'none' }}</span>
    </div>
  </div>`,
};
