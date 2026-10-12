import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'provideA11yPreferences: persist choices across reloads',
  subtitle:
    '<code>provideA11yPreferences(withDensity(...), withTextScale(...), withPersistence(key))</code> installs all four preference axes in one call and stores explicit picks under <code>key</code>, so a reload rehydrates them instead of the initials.',
  description:
    'In an app the call sits once in <code>bootstrapApplication</code> providers. This examples app already installs the four axis reflectors at its root, so the demo hands the providers to <code>createIsolatedRoot()</code>, a demo fixture that builds a child environment injector with <code>DOCUMENT</code> pointed at a detached document: the reflectors stamp its <code>&lt;html&gt;</code>, not the live page. <code>CNGX_A11Y_STORAGE</code> points at <code>sessionStorage</code> instead of the default <code>localStorage</code>. <code>injectA11yPreferences()</code> returns the four writable axis signals the toggles bind to. The initials are compact density and large text; motion and contrast stay <code>auto</code>, which removes their attributes so the OS queries stay in charge. Persistence writes only on a change, so the untouched initials are never stored. Pick a value, reload the page, and the pick comes back: a stored value overrides an axis only when it is a valid member of that axis. Clear the stored choices and reload to get the initials again.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['integration', 'a11y-pattern'],
  apiComponents: [
    'provideA11yPreferences',
    'withPersistence',
    'CNGX_A11Y_STORAGE',
    'injectA11yPreferences',
  ],
  moduleImports: [
    "import { createIsolatedRoot } from '../../../../fixtures';",
    "import { provideA11yPreferences, withDensity, withTextScale, withPersistence, CNGX_A11Y_STORAGE, injectA11yPreferences } from '@cngx/core';",
    "import { CngxButtonToggleGroup, CngxButtonToggle } from '@cngx/common/interactive';",
  ],
  imports: ['CngxButtonToggleGroup', 'CngxButtonToggle'],
  setup: `
  // In an app this list goes into bootstrapApplication providers.
  private readonly root = createIsolatedRoot([
    { provide: CNGX_A11Y_STORAGE, useFactory: () => sessionStorage },
    provideA11yPreferences(
      withDensity('compact'),
      withTextScale('lg'),
      withPersistence('cngx-a11y-demo'),
    ),
  ]);
  protected readonly prefs = this.root.run(injectA11yPreferences);
  protected readonly density = this.prefs.density;
  protected readonly textScale = this.prefs.textScale;
  protected readonly motion = this.prefs.motion;
  protected readonly contrast = this.prefs.contrast;`,
  template: `
  <div style="display:flex; flex-direction:column; gap:16px; align-items:flex-start">
    <cngx-button-toggle-group label="Density" [(value)]="density">
      <button type="button" cngxButtonToggle value="compact">Compact</button>
      <button type="button" cngxButtonToggle value="comfortable">Comfortable</button>
      <button type="button" cngxButtonToggle value="spacious">Spacious</button>
    </cngx-button-toggle-group>
    <cngx-button-toggle-group label="Text size" [(value)]="textScale">
      <button type="button" cngxButtonToggle value="sm">S</button>
      <button type="button" cngxButtonToggle value="md">M</button>
      <button type="button" cngxButtonToggle value="lg">L</button>
    </cngx-button-toggle-group>
    <cngx-button-toggle-group label="Motion" [(value)]="motion">
      <button type="button" cngxButtonToggle value="full">Full</button>
      <button type="button" cngxButtonToggle value="reduced">Reduced</button>
      <button type="button" cngxButtonToggle value="auto">Auto</button>
    </cngx-button-toggle-group>
    <cngx-button-toggle-group label="Contrast" [(value)]="contrast">
      <button type="button" cngxButtonToggle value="normal">Normal</button>
      <button type="button" cngxButtonToggle value="more">More</button>
      <button type="button" cngxButtonToggle value="auto">Auto</button>
    </cngx-button-toggle-group>
  </div>`,
  setupChrome: `
  protected readonly stampedAttributes = signal('-');
  protected readonly storedChoices = signal('-');
  protected readonly readout = effect(() => {
    this.density();
    this.textScale();
    this.motion();
    this.contrast();
    const html = this.root.document.documentElement;
    this.stampedAttributes.set(
      ['data-density', 'data-text-size', 'data-motion', 'data-contrast']
        .map((name) => name + '=' + (html.getAttribute(name) ?? '(absent)'))
        .join(', '),
    );
    this.storedChoices.set(sessionStorage.getItem('cngx-a11y-demo') ?? '(nothing stored)');
  });

  protected handleClearStorage(): void {
    sessionStorage.removeItem('cngx-a11y-demo');
    this.storedChoices.set('(nothing stored)');
  }`,
  templateChrome: `
  <div class="button-row" style="margin-top:16px">
    <button type="button" (click)="handleClearStorage()">Clear stored choices</button>
  </div>
  <div class="event-grid">
    <div class="event-row">
      <span class="event-label">Isolated root &lt;html&gt; attributes</span>
      <span class="event-value">{{ stampedAttributes() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">sessionStorage['cngx-a11y-demo']</span>
      <span class="event-value">{{ storedChoices() }}</span>
    </div>
  </div>`,
};
