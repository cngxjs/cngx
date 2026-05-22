import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxFormErrors: server error injection',
  subtitle: 'Programmatic errors from a fake API response feed back into the form via <code>submit(form, action)</code>. The action returns <code>{ fieldTree, kind: \'server\', message }</code> entries; Signal Forms attaches them to the referenced fields and <code>cngx-form-errors</code> lists them next to client-side validation errors. Toggle <strong>Force server fail</strong> to simulate the rejection path.',
  description: 'Server-side validation belongs in the same summary as client-side validation - the user does not care which side of the wire detected the problem, they care about the list of things to fix.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['error-handling'],
  framework: 'signal-forms',
  apiComponents: ['CngxFormErrors', 'CngxFormField', 'CngxLabel', 'CngxFieldErrors', 'CngxInput'],
  references: [
    { label: 'WCAG 3.3.1 Error Identification', href: 'https://www.w3.org/WAI/WCAG21/Understanding/error-identification.html' },
  ],
  moduleImports: [
    "import { form, schema, required, submit, type ValidationError } from '@angular/forms/signals';",
    "import { CngxFormField, CngxLabel, CngxFieldErrors, CngxFormErrors } from '@cngx/forms/field';",
    "import { CngxInput } from '@cngx/forms/input';",
  ],
  imports: ['CngxFormField', 'CngxLabel', 'CngxInput', 'CngxFieldErrors', 'CngxFormErrors'],
  setup: `protected readonly model = signal({ username: '', email: '' });
  protected readonly signupForm = form(this.model, schema<{ username: string; email: string }>((root) => {
    required(root.username, { message: 'Username is required' });
    required(root.email, { message: 'Email is required' });
  }));
  protected readonly showErrors = signal(false);
  protected readonly lastResult = signal<'idle' | 'ok' | 'failed'>('idle');`,
  setupChrome: `  protected readonly failNext = signal(false);
  protected async handleSave(): Promise<void> {
    this.signupForm.username().markAsTouched();
    this.signupForm.email().markAsTouched();
    this.showErrors.set(true);
    const ok = await submit(this.signupForm, async (f) => {
      // Pretend this is an HTTP round-trip.
      await new Promise((resolve) => setTimeout(resolve, 250));
      if (!this.failNext()) {
        return undefined;
      }
      const errors: ValidationError.WithFieldTree[] = [];
      if (f.username().value()) {
        errors.push({ fieldTree: f.username, kind: 'server', message: 'Username already taken' });
      }
      if (f.email().value()) {
        errors.push({ fieldTree: f.email, kind: 'server', message: 'Email already registered' });
      }
      return errors.length ? errors : undefined;
    });
    this.lastResult.set(ok ? 'ok' : 'failed');
  }
  protected handleReset(): void {
    this.model.set({ username: '', email: '' });
    this.showErrors.set(false);
    this.lastResult.set('idle');
    this.failNext.set(false);
  }`,
  template: `  <div class="demo-form" style="max-width:480px">
    <cngx-form-errors
      [fields]="[signupForm.username, signupForm.email]"
      [show]="showErrors()"
    />

    <div class="demo-field">
      <cngx-form-field [field]="signupForm.username">
        <label cngxLabel>Username</label>
        <input cngxInput />
        <cngx-field-errors />
      </cngx-form-field>
    </div>

    <div class="demo-field">
      <cngx-form-field [field]="signupForm.email">
        <label cngxLabel>Email</label>
        <input cngxInput />
        <cngx-field-errors />
      </cngx-form-field>
    </div>
  </div>`,
  templateChrome: `<div class="button-row">
      <button type="button" class="chip" (click)="handleSave()">Trigger save</button>
      <button type="button" class="chip" (click)="handleReset()">Reset</button>
      <label class="chip" style="cursor:pointer">
        <input type="checkbox" [checked]="failNext()"
               (change)="failNext.set($any($event.target).checked)"
               style="margin-right:6px" />
        Force server fail
      </label>
    </div>
<div class="event-grid">
      <div class="event-row">
        <span class="event-label">Last result</span>
        <span class="event-value">{{ lastResult() }}</span>
      </div>
      <div class="event-row">
        <span class="event-label">Username errors</span>
        <span class="event-value">
          @for (e of signupForm.username().errors(); track e.kind) {
            <span>{{ e.kind }}{{ $last ? '' : ', ' }}</span>
          } @empty { <span>none</span> }
        </span>
      </div>
      <div class="event-row">
        <span class="event-label">Email errors</span>
        <span class="event-value">
          @for (e of signupForm.email().errors(); track e.kind) {
            <span>{{ e.kind }}{{ $last ? '' : ', ' }}</span>
          } @empty { <span>none</span> }
        </span>
      </div>
    </div>`,
};
