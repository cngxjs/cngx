import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxDensity: scope a section',
  subtitle:
    '<code>[cngxDensity]</code> reflects its value onto the host <code>[data-density]</code> attribute, so one section re-scales <code>--cngx-space-*</code> for its subtree while the rest of the page keeps the root density.',
  description:
    'Both panels hold the same markup: a padded panel, two checkboxes and a radio group, all of which derive their padding and gaps from the <code>--cngx-space-*</code> scale. The left panel inherits the root density that <code>provideDensity()</code> reflects onto <code>&lt;html&gt;</code> (comfortable here unless you change it in the accessibility panel). The right panel carries <code>cngxDensity</code>, so <code>density-tokens.css</code> re-scales the scale for that subtree only: compact is 2 / 4 / 8 / 12 / 16 px, comfortable 4 / 8 / 16 / 24 / 32 px, spacious 6 / 12 / 20 / 28 / 40 px. Comfortable is a real block rather than a fallback, so a comfortable island also resets cleanly inside a compact ancestor. The directive is the escape hatch for one region, not a per-component input; an unset or bare <code>cngxDensity</code> leaves the attribute off and the section inherits again.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['visual-variants', 'behavior'],
  apiComponents: ['CngxDensity', 'injectDensity'],
  moduleImports: [
    "import { CngxDensity, injectDensity, type CngxDensityValue } from '@cngx/core';",
    "import { CngxButtonToggleGroup, CngxButtonToggle, CngxCheckbox, CngxRadioGroup, CngxRadio } from '@cngx/common/interactive';",
  ],
  imports: [
    'CngxDensity',
    'CngxButtonToggleGroup',
    'CngxButtonToggle',
    'CngxCheckbox',
    'CngxRadioGroup',
    'CngxRadio',
  ],
  setup: `
  protected readonly sectionDensity = signal<CngxDensityValue>('compact');
  protected readonly rootAlerts = signal(true);
  protected readonly rootDigest = signal(false);
  protected readonly rootChannel = signal<'mail' | 'push' | undefined>('mail');
  protected readonly scopedAlerts = signal(true);
  protected readonly scopedDigest = signal(false);
  protected readonly scopedChannel = signal<'mail' | 'push' | undefined>('mail');`,
  template: `
  <div class="demo-scope-compare">
    <section class="demo-scope-panel" aria-labelledby="density-root-h">
      <h3 id="density-root-h">Root density</h3>
      <p>No directive - inherits the document density.</p>
      <cngx-checkbox [(value)]="rootAlerts">Security alerts</cngx-checkbox>
      <cngx-checkbox [(value)]="rootDigest">Weekly digest</cngx-checkbox>
      <cngx-radio-group [(value)]="rootChannel" name="density-root-channel" label="Channel">
        <cngx-radio value="mail">Mail</cngx-radio>
        <cngx-radio value="push">Push</cngx-radio>
      </cngx-radio-group>
    </section>

    <section class="demo-scope-panel" [cngxDensity]="sectionDensity()" aria-labelledby="density-scoped-h">
      <h3 id="density-scoped-h">Scoped density</h3>
      <p>Carries cngxDensity - re-scales spacing for this subtree only.</p>
      <cngx-checkbox [(value)]="scopedAlerts">Security alerts</cngx-checkbox>
      <cngx-checkbox [(value)]="scopedDigest">Weekly digest</cngx-checkbox>
      <cngx-radio-group [(value)]="scopedChannel" name="density-scoped-channel" label="Channel">
        <cngx-radio value="mail">Mail</cngx-radio>
        <cngx-radio value="push">Push</cngx-radio>
      </cngx-radio-group>
    </section>
  </div>`,
  templateChromeBefore: `
  <div class="cngx-ex-chrome" style="margin-bottom:12px">
    Pick a rung for the right-hand section and compare its padding and gaps
    with the unscoped panel on the left.
  </div>
  <div style="margin-bottom:20px">
    <cngx-button-toggle-group label="Section density" [(value)]="sectionDensity">
      <button type="button" cngxButtonToggle value="compact">Compact</button>
      <button type="button" cngxButtonToggle value="comfortable">Comfortable</button>
      <button type="button" cngxButtonToggle value="spacious">Spacious</button>
    </cngx-button-toggle-group>
  </div>`,
  setupChrome: `
  protected readonly rootDensity = injectDensity();
  protected readonly scope = viewChild(CngxDensity);`,
  templateChrome: `
  <div class="event-grid">
    <div class="event-row">
      <span class="event-label">injectDensity() (root)</span>
      <span class="event-value">{{ rootDensity() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">CngxDensity.density() (section)</span>
      <span class="event-value">{{ scope()?.density() ?? 'unset' }}</span>
    </div>
  </div>`,
};
