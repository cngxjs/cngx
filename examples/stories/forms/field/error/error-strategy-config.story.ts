import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxFormField: error strategy config',
  subtitle:
    "<code>provideFormFieldAt(withErrorStrategy(...))</code> decides when every <code>cngx-form-field</code> in a subtree reveals its errors. The built-in names are <code>'onTouched'</code>, <code>'onDirty'</code>, <code>'onSubmit'</code>, <code>'onTouchedOrSubmit'</code> and <code>'always'</code>; a function receives <code>{ touched, dirty, submitted, invalid }</code> instead.",
  description:
    "Pick a strategy, then interact with the field: type a character, blur, submit. The field state survives a strategy switch, so the same touched, dirty and submitted flags are judged by each rule in turn. Without a strategy the field shows errors once it is touched or the surrounding <code>cngxErrorScope</code> was revealed. A configured strategy replaces that gate completely: <code>'onDirty'</code> stays quiet after a blur without typing, <code>'onSubmit'</code> ignores touch until the scope reveals, <code>'always'</code> shows the error before any interaction. <code>submitted</code> is the nearest <code>cngxErrorScope</code>'s <code>showErrors</code>, which the submit handler flips with <code>reveal()</code>. The demo builds the scope with <code>Injector.create</code> and hands it to <code>ngTemplateOutlet</code>, so a strategy switch rebuilds only the field. The template is declared inside the form on purpose: an embedded view resolves element injectors from where its <code>ng-template</code> is declared, so a template declared outside the form would not see <code>cngxErrorScope</code>.",
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'error-handling'],
  framework: 'signal-forms',
  apiComponents: ['CngxFormField', 'CngxFieldErrors', 'CngxErrorScope'],
  references: [
    {
      label: 'WCAG 3.3.1 Error Identification',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/error-identification.html',
    },
  ],
  moduleImports: [
    "import { NgTemplateOutlet } from '@angular/common';",
    "import { email, form, FormField, required, schema } from '@angular/forms/signals';",
    "import { CngxErrorScope } from '@cngx/common/interactive';",
    "import { CngxFieldErrors, CngxFormField, CngxLabel, provideFormFieldAt, withErrorStrategy, type ErrorStrategyName } from '@cngx/forms/field';",
    "import { CngxInput } from '@cngx/forms/input';",
  ],
  imports: [
    'NgTemplateOutlet',
    'FormField',
    'CngxErrorScope',
    'CngxFormField',
    'CngxLabel',
    'CngxInput',
    'CngxFieldErrors',
  ],
  setup: `private readonly injector = inject(Injector);
  protected readonly strategy = signal<ErrorStrategyName | 'default'>('onSubmit');

  protected readonly fieldScope = computed(() => {
    const strategy = this.strategy();
    if (strategy === 'default') {
      return this.injector;
    }
    return Injector.create({
      parent: this.injector,
      providers: provideFormFieldAt(withErrorStrategy(strategy)),
    });
  });

  protected readonly model = signal({ email: '' });
  protected readonly signup = form(this.model, schema<{ email: string }>((root) => {
    required(root.email, { message: 'Email is required' });
    email(root.email, { message: 'Enter a valid email address' });
  }));`,
  template: `  <form class="demo-form" novalidate cngxErrorScope #scope="cngxErrorScope" (submit)="$event.preventDefault(); scope.reveal()">
    <ng-template #emailField>
      <cngx-form-field [field]="signup.email">
        <label cngxLabel>Email</label>
        <input cngxInput type="email" [formField]="signup.email" />
        <cngx-field-errors />
      </cngx-form-field>
    </ng-template>
    <ng-container *ngTemplateOutlet="emailField; injector: fieldScope()" />
    <button type="submit" class="chip">Submit</button>
  </form>`,
  setupChrome: `private readonly errorScope = viewChild.required(CngxErrorScope);
  private readonly hostEl: ElementRef<HTMLElement> = inject(ElementRef);
  protected readonly strategyOptions: readonly (ErrorStrategyName | 'default')[] = [
    'default',
    'onTouched',
    'onDirty',
    'onSubmit',
    'onTouchedOrSubmit',
    'always',
  ];
  protected readonly submitted = computed(() => this.errorScope().showErrors());
  protected readonly errorShown = signal(false);

  private readonly observer = new MutationObserver(() => this.readErrorShown());
  private readonly startObserving = afterNextRender(() => {
    this.readErrorShown();
    this.observer.observe(this.hostEl.nativeElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['role'] });
  });
  private readonly stopObserving = inject(DestroyRef).onDestroy(() => this.observer.disconnect());

  private readErrorShown(): void {
    this.errorShown.set(this.hostEl.nativeElement.querySelector('cngx-field-errors')?.getAttribute('role') === 'alert');
  }

  protected handleReset(): void {
    this.signup().reset({ email: '' });
    this.errorScope().reset();
  }`,
  templateChrome: `<fieldset class="demo-strategy-picker">
    <legend>Error strategy</legend>
    @for (option of strategyOptions; track option) {
      <label>
        <input type="radio" name="error-strategy" [value]="option" [checked]="strategy() === option" (change)="strategy.set(option)" />
        {{ option === 'default' ? 'Library default (touched or revealed)' : option }}
      </label>
    }
  </fieldset>
  <div class="button-row">
    <button type="button" class="chip" (click)="handleReset()">Reset field and scope</button>
  </div>
  <div class="event-grid">
    <div class="event-row"><span class="event-label">touched</span><span class="event-value">{{ signup.email().touched() }}</span></div>
    <div class="event-row"><span class="event-label">dirty</span><span class="event-value">{{ signup.email().dirty() }}</span></div>
    <div class="event-row"><span class="event-label">submitted (scope revealed)</span><span class="event-value">{{ submitted() }}</span></div>
    <div class="event-row"><span class="event-label">invalid</span><span class="event-value">{{ signup.email().invalid() }}</span></div>
    <div class="event-row"><span class="event-label">Error shown (role="alert")</span><span class="event-value">{{ errorShown() ? 'yes' : 'no' }}</span></div>
  </div>`,
};
