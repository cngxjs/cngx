import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxErrorRegistry: Provider and reveal features',
  subtitle: '<code>provideErrorRegistry(withGlobalRevealOnSubmit(), withRevealOnNavigate())</code> wires ambient reveal triggers at the application root.',
  description: 'The registry itself is an <code>@Injectable()</code>, not <code>providedIn: \'root\'</code> - consumers opt in via <code>provideErrorRegistry(...features)</code> in <code>bootstrapApplication</code> providers (or in a lazy-loaded route\'s <code>providers</code>). Without features the call only registers the registry class; pair with feature flags to install ambient reveal behaviour. <code>withGlobalRevealOnSubmit()</code> attaches a capture-phase document listener that calls <code>registry.revealAll()</code> on any submit event, anywhere in the document. <code>withRevealOnNavigate()</code> subscribes to <code>Router.NavigationStart</code> and calls <code>revealAll()</code> on every navigation attempt; no-ops when <code>Router</code> is not provided. The bootstrap snippet below shows the canonical setup; the live area below it renders a banner gating on a named scope so you can see the contract surface that the registry hands back. The reveal-triggers themselves only fire in a fully bootstrapped app, not in this isolated demo.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'integration'],
  apiComponents: [
    'provideErrorRegistry',
    'withGlobalRevealOnSubmit',
    'withRevealOnNavigate',
    'injectErrorScope',
  ],
  moduleImports: [
    'import { injectErrorScope } from \'@cngx/common/interactive\';',
  ],
  imports: [],
  setup: `
  protected readonly checkoutScope = injectErrorScope('checkout');

  protected handleManualReveal(): void {
    this.checkoutScope.reveal();
  }

  protected handleManualReset(): void {
    this.checkoutScope.reset();
  }`,
  template: `
  <section role="region" aria-labelledby="prv-heading" style="display:flex; flex-direction:column; gap:8px; max-width:32rem">
    <h2 id="prv-heading" style="margin:0; font-size:1em">Checkout flow</h2>
    @if (checkoutScope.showErrors()) {
      <p role="alert" style="margin:0">Validate the cart before continuing.</p>
    } @else {
      <p style="margin:0">No errors visible yet.</p>
    }
    <div style="display:flex; gap:8px; align-self:flex-start">
      <button type="button" (click)="handleManualReveal()">Manual reveal</button>
      <button type="button" (click)="handleManualReset()">Manual reset</button>
    </div>
  </section>`,
  templateChromeBefore: `
  <p style="margin-bottom:12px">In a real app the registry's reveal features fire automatically. This demo is isolated from the bootstrap, so the buttons below invoke <code>checkoutScope.reveal()</code> by hand to show the contract surface.</p>`,
  templateChrome: `
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">scope.showErrors()</span>
      <span class="event-value">{{ checkoutScope.showErrors() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">scope.scopeName()</span>
      <span class="event-value">{{ checkoutScope.scopeName() ?? '—' }}</span>
    </div>
  </div>`,
};
