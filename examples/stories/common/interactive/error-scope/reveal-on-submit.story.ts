import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxErrorScope: Reveal on submit',
  subtitle: 'Wrap a form in <code>[cngxErrorScope]</code> and call <code>scope.reveal()</code> from the submit handler. Descendant error elements gate their visibility on <code>scope.showErrors()</code>.',
  description: 'The scope directive marks a DOM subtree as an error-visibility region. <code>showErrors()</code> starts <code>false</code> so validation messages stay hidden during typing, then flips to <code>true</code> when the consumer calls <code>reveal()</code>. Any descendant template can opt in via <code>@if (scope.showErrors())</code>, or downstream cngx primitives (<code>CngxErrorAggregator</code>, <code>CngxErrorState</code>, the form-field presenter) consume the same <code>CNGX_ERROR_SCOPE</code> injection token automatically. Pair <code>reveal()</code> with a <code>(submit)</code> handler, a route guard, or an HTTP interceptor reveal-on-422 flow. The scope is idempotent: a second <code>reveal()</code> stays revealed; <code>reset()</code> flips back to hidden.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'a11y-pattern'],
  apiComponents: [
    'CngxErrorScope',
  ],
  moduleImports: [
    'import { CngxErrorScope } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxErrorScope'],
  references: [
    { label: 'WCAG 2.1 SC 3.3.1 Error Identification', href: 'https://www.w3.org/WAI/WCAG21/Understanding/error-identification.html' },
    { label: 'WCAG 2.1 SC 3.3.3 Error Suggestion', href: 'https://www.w3.org/WAI/WCAG21/Understanding/error-suggestion.html' },
  ],
  setup: `
  protected readonly email = signal<string>('');
  protected readonly emailInvalid = computed<boolean>(() => {
    const value = this.email().trim();
    if (value.length === 0) return true;
    return !value.includes('@');
  });

  protected handleInput(event: Event): void {
    this.email.set((event.target as HTMLInputElement).value);
  }`,
  template: `
  <form
    cngxErrorScope
    #scope="cngxErrorScope"
    (submit)="$event.preventDefault(); scope.reveal()"
    style="display:flex; flex-direction:column; gap:8px; max-width:24rem"
  >
    <label for="es-email">Email</label>
    <input
      id="es-email"
      type="text"
      [value]="email()"
      (input)="handleInput($event)"
      [attr.aria-invalid]="scope.showErrors() && emailInvalid() ? 'true' : null"
    />
    @if (scope.showErrors() && emailInvalid()) {
      <span role="alert" style="font-size:0.875em">Email is required and must contain @.</span>
    }
    <div style="display:flex; gap:8px; align-self:flex-start">
      <button type="submit">Submit</button>
      <button type="button" (click)="scope.reset()">Reset scope</button>
    </div>
  </form>`,
  templateChrome: `
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">showErrors()</span>
      <span class="event-value">{{ scope.showErrors() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">emailInvalid()</span>
      <span class="event-value">{{ emailInvalid() }}</span>
    </div>
  </div>`,
};
