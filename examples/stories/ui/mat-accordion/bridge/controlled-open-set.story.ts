import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxMatAccordion: controlled open set',
  subtitle:
    'One <code>cngxMatAccordion</code> attribute drives a vanilla <code>&lt;mat-accordion&gt;</code> from the headless <code>CngxAccordion</code> brain. Expansion becomes a single <code>[(openIds)]</code> <code>ReadonlySet&lt;string&gt;</code> plus <code>[multi]</code> arbitration - neither of which Material exposes, since it only has per-panel <code>[expanded]</code>.',
  description:
    "The panels, headers, ARIA and arrow-key movement between headers stay Material's; the directive renders none of it. A header click flows Material to brain through <code>toggle()</code>, and the brain writes <code>expanded</code> back onto every panel, so <em>Collapse all</em> is just <code>openIds.set(new Set())</code>. In single mode the brain clamps the set to the most recently added id and closes the siblings; the directive pins Material's own <code>multi</code> to <code>true</code> underneath so Material never runs a competing single-open close. Switching from multi back to single with several panels open keeps only the last opened one expanded; the bound set is rewritten from that clamped view on the next toggle. Panel ids are generated per panel - bind <code>[panelIdFn]</code> when a pre-populated <code>openIds</code> must address panels by consumer-known keys.",
  level: 'molecule',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['integration', 'behavior'],
  apiComponents: ['CngxMatAccordion', 'CngxAccordion'],
  moduleImports: [
    "import { MatExpansionModule } from '@angular/material/expansion';",
    "import { CngxMatAccordion } from '@cngx/ui/mat-accordion';",
    "import { CngxButtonToggleGroup, CngxButtonToggle } from '@cngx/common/interactive';",
  ],
  imports: ['MatExpansionModule', 'CngxMatAccordion', 'CngxButtonToggleGroup', 'CngxButtonToggle'],
  setup: `
  protected readonly multi = signal(false);
  protected readonly openIds = signal<ReadonlySet<string>>(new Set());

  protected collapseAll(): void {
    this.openIds.set(new Set());
  }`,
  template: `
  <mat-accordion cngxMatAccordion [(openIds)]="openIds" [multi]="multi()">
    <mat-expansion-panel>
      <mat-expansion-panel-header>Personal info</mat-expansion-panel-header>
      <p>Tell us who you are.</p>
    </mat-expansion-panel>

    <mat-expansion-panel>
      <mat-expansion-panel-header>Account</mat-expansion-panel-header>
      <p>Choose your sign-in method.</p>
    </mat-expansion-panel>

    <mat-expansion-panel>
      <mat-expansion-panel-header>Confirm</mat-expansion-panel-header>
      <p>Review everything, then finish.</p>
    </mat-expansion-panel>
  </mat-accordion>

  <div class="demo-inline-actions" style="margin-top:12px">
    <button type="button" (click)="collapseAll()">Collapse all</button>
  </div>`,
  templateChromeBefore: `
  <p style="margin-bottom:12px">
    Open a few panels in each mode. In single mode opening a panel closes the
    others; in multi mode they stay open. Collapse all clears the bound set.
  </p>
  <div style="margin-bottom:16px">
    <cngx-button-toggle-group
      label="Open mode"
      [value]="multi() ? 'multi' : 'single'"
      (valueChange)="multi.set($event === 'multi')"
    >
      <button type="button" cngxButtonToggle value="single">Single</button>
      <button type="button" cngxButtonToggle value="multi">Multi</button>
    </cngx-button-toggle-group>
  </div>`,
  setupChrome: `
  protected readonly openIdList = computed(() => [...this.openIds()].join(', ') || 'none');`,
  templateChrome: `
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">multi</span><span class="event-value">{{ multi() }}</span></div>
    <div class="event-row"><span class="event-label">openIds().size</span><span class="event-value">{{ openIds().size }}</span></div>
    <div class="event-row"><span class="event-label">openIds()</span><span class="event-value">{{ openIdList() }}</span></div>
  </div>`,
};
