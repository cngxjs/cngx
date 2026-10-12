import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxInputMask: config phone, IBAN and zip patterns',
  subtitle:
    "One <code>provideInputConfigAt(...)</code> teaches every mask in a subtree what the built-in tables lack: <code>withPhonePatterns</code>, <code>withIbanPatterns</code> and <code>withZipPatterns</code> add Liechtenstein, <code>withCustomTokens</code> registers an <code>H</code> hex-digit token, <code>withMaskPlaceholder('·')</code> swaps the slot character and <code>withMaskGuide</code> switches the slot guide.",
  description:
    'Both panes render the same four masked inputs; only the right pane sits under the scoped config. Liechtenstein (<code>LI</code>) is not in the built-in tables, so on the left <code>phone:LI</code>, <code>iban:LI</code> and <code>zip:LI</code> fall back to the generic patterns, and <code>#HHHHHH</code> is all literals because <code>H</code> is no built-in token, so the colour field accepts nothing. The readout mirrors the <code>aria-placeholder</code> of each input, the empty mask as assistive technology hears it. Focus a field to see the guide: underscores on the left, middle dots on the right. Untick the guide below and the right pane shows only what you typed and its separators. Consumer patterns merge per key onto the built-ins and a per-input <code>[placeholder]</code>, <code>[guide]</code> or <code>[customTokens]</code> still wins. Left out here: <code>withPhoneDefaultRegion</code>, which picks the preselected country of <code>CngxPhoneInput</code> and does not touch the mask. A <code>viewProviders</code> entry would reach both panes, so the demo builds the scope with <code>Injector.create</code> and hands it to <code>ngTemplateOutlet</code>.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['composition', 'behavior'],
  framework: 'template-only',
  apiComponents: ['CngxInputMask'],
  moduleImports: [
    "import { NgTemplateOutlet } from '@angular/common';",
    "import { CngxInputMask, provideInputConfigAt, withCustomTokens, withIbanPatterns, withMaskGuide, withMaskPlaceholder, withPhonePatterns, withZipPatterns } from '@cngx/forms/input';",
  ],
  imports: ['NgTemplateOutlet', 'CngxInputMask'],
  setup: `private readonly injector = inject(Injector);
  protected readonly guide = signal(true);

  protected readonly maskScope = computed(() =>
    Injector.create({
      parent: this.injector,
      providers: provideInputConfigAt(
        withPhonePatterns({ LI: '+000 000 00 00' }),
        withIbanPatterns({ LI: 'AA00 0000 0000 0000 0000 0' }),
        withZipPatterns({ LI: '0000' }),
        withCustomTokens({ H: { pattern: /[0-9a-fA-F]/, transform: (c) => c.toUpperCase() } }),
        withMaskPlaceholder('·'),
        withMaskGuide(this.guide()),
      ),
    }),
  );`,
  template: `  <ng-template #masks let-side>
    <div class="demo-form">
      <div class="demo-field">
        <label class="demo-label" [for]="'cfg-phone-' + side">Phone (Liechtenstein)</label>
        <input [id]="'cfg-phone-' + side" class="demo-input" cngxInputMask="phone:LI" />
      </div>
      <div class="demo-field">
        <label class="demo-label" [for]="'cfg-iban-' + side">IBAN (Liechtenstein)</label>
        <input [id]="'cfg-iban-' + side" class="demo-input" cngxInputMask="iban:LI" />
      </div>
      <div class="demo-field">
        <label class="demo-label" [for]="'cfg-zip-' + side">Postcode (Liechtenstein)</label>
        <input [id]="'cfg-zip-' + side" class="demo-input" cngxInputMask="zip:LI" />
      </div>
      <div class="demo-field">
        <label class="demo-label" [for]="'cfg-hex-' + side">Colour (hex)</label>
        <input [id]="'cfg-hex-' + side" class="demo-input" cngxInputMask="#HHHHHH" />
      </div>
    </div>
  </ng-template>

  <div class="demo-config-compare">
    <div class="demo-config-compare-pane">
      <h3 class="demo-config-compare-heading">Library defaults</h3>
      <ng-container *ngTemplateOutlet="masks; context: { $implicit: 'default' }" />
    </div>
    <div class="demo-config-compare-pane">
      <h3 class="demo-config-compare-heading">Scoped config</h3>
      <ng-container *ngTemplateOutlet="masks; context: { $implicit: 'scoped' }; injector: maskScope()" />
    </div>
  </div>`,
  setupChrome: `private readonly hostEl: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly fieldNames = ['Phone', 'IBAN', 'Postcode', 'Colour'];
  protected readonly placeholderRows = signal<readonly { name: string; defaults: string; scoped: string }[]>([]);

  private readonly observer = new MutationObserver(() => this.readPlaceholders());
  private readonly startObserving = afterNextRender(() => {
    this.readPlaceholders();
    this.observer.observe(this.hostEl.nativeElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['aria-placeholder'] });
  });
  private readonly stopObserving = inject(DestroyRef).onDestroy(() => this.observer.disconnect());

  private readPlaceholders(): void {
    const inputs = Array.from(this.hostEl.nativeElement.querySelectorAll('.demo-config-compare input[aria-placeholder]'));
    const count = this.fieldNames.length;
    const rows = this.fieldNames.map((name, i) => ({
      name,
      defaults: inputs[i]?.getAttribute('aria-placeholder') ?? '-',
      scoped: inputs[i + count]?.getAttribute('aria-placeholder') ?? '-',
    }));
    const same = rows.every((row, i) => row.defaults === this.placeholderRows()[i]?.defaults && row.scoped === this.placeholderRows()[i]?.scoped);
    if (!same) {
      this.placeholderRows.set(rows);
    }
  }`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <label>
      <input type="checkbox" [checked]="guide()" (change)="guide.set(!guide())" />
      Scoped guide on (withMaskGuide)
    </label>
  </div>
  <div class="event-grid">
    @for (row of placeholderRows(); track row.name) {
      <div class="event-row">
        <span class="event-label">{{ row.name }} aria-placeholder</span>
        <span class="event-value">defaults {{ row.defaults }} | scoped {{ row.scoped }}</span>
      </div>
    }
  </div>`,
};
