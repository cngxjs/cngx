import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'injectErrorScope: Programmatic scope from a service',
  subtitle: '<code>injectErrorScope(name?)</code> returns a DOM-free <code>CngxErrorScopeContract</code> for services, route guards, or interceptors. Auto-registers with the ambient <code>CngxErrorRegistry</code> when a name is supplied.',
  description: 'The directive form <code>[cngxErrorScope]</code> needs a DOM host; the function form does not. Use <code>injectErrorScope()</code> from a service, an HTTP interceptor, or a route guard when error visibility must exist without a template host. The returned contract carries the same <code>showErrors()</code> signal plus <code>reveal()</code> / <code>reset()</code> calls. Pass an optional <code>name</code> to opt in to programmatic lookup via <code>registry.getScope(name)</code> / <code>registry.reveal(name)</code> from anywhere else in the app; without a registry in scope the contract still works, registration is a no-op. Must be called in an injection context (constructor, field init, <code>runInInjectionContext</code>).',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior', 'composition'],
  apiComponents: [
    'injectErrorScope',
  ],
  moduleImports: [
    'import { injectErrorScope } from \'@cngx/common/interactive\';',
  ],
  imports: [],
  setup: `
  protected readonly scope = injectErrorScope('async-flow');

  protected readonly email = signal<string>('');
  protected readonly emailInvalid = computed<boolean>(() => !this.email().includes('@'));

  protected handleInput(event: Event): void {
    this.email.set((event.target as HTMLInputElement).value);
  }

  protected handleSubmit(): void {
    this.scope.reveal();
  }

  protected handleReset(): void {
    this.scope.reset();
    this.email.set('');
  }`,
  template: `
  <div style="display:flex; flex-direction:column; gap:8px; max-width:24rem">
    <label for="ies-email">Email</label>
    <input
      id="ies-email"
      type="text"
      [value]="email()"
      (input)="handleInput($event)"
    />
    @if (scope.showErrors() && emailInvalid()) {
      <span role="alert" style="font-size:0.875em">Email must contain @.</span>
    }
    <div style="display:flex; gap:8px; align-self:flex-start">
      <button type="button" (click)="handleSubmit()">Validate</button>
      <button type="button" (click)="handleReset()">Reset</button>
    </div>
  </div>`,
  templateChrome: `
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">scope.scopeName()</span>
      <span class="event-value">{{ scope.scopeName() ?? '-' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">scope.showErrors()</span>
      <span class="event-value">{{ scope.showErrors() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">emailInvalid()</span>
      <span class="event-value">{{ emailInvalid() }}</span>
    </div>
  </div>`,
};
