import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxError: server injected error',
  subtitle: 'A server-supplied error rides on the same Signal Forms <code>errors()</code> stream as built-in validators. The schema reads a <code>takenEmails</code> signal inside a <code>validate()</code> step; flipping that signal after a fake server roundtrip puts a <code>taken</code> error on the field. <code>&lt;div cngxError&gt;</code> renders it next to <code>required</code> with no special wiring. Type <code>used@example.com</code>, click <strong>Check availability</strong>, blur, and watch the error appear.',
  description: 'The pattern works for any out-of-band signal: HTTP responses, WebSocket pushes, cross-field rules. Keep the failing values in a signal, feed it into the schema validator, and the field stays consistent with the rest of its state. Reset clears the set and the form together.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['error-handling', 'async-state'],
  framework: 'signal-forms',
  apiComponents: ['CngxError', 'CngxFormField', 'CngxLabel'],
  references: [
    { label: 'WCAG 3.3.1 Error Identification', href: 'https://www.w3.org/WAI/WCAG21/Understanding/error-identification.html' },
    { label: 'WCAG 4.1.3 Status Messages', href: 'https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html' },
  ],
  moduleImports: [
    'import { form, schema, required, email, validate } from \'@angular/forms/signals\';',
    'import { CngxFormField, CngxLabel, CngxError } from \'@cngx/forms/field\';',
  ],
  imports: ['CngxFormField', 'CngxLabel', 'CngxError'],
  setup: `protected readonly model = signal<{ email: string }>({ email: '' });
  protected readonly takenEmails = signal<ReadonlySet<string>>(new Set());
  protected readonly emailForm = form(this.model, schema<{ email: string }>((root) => {
    required(root.email, { message: 'Email is required' });
    email(root.email, { message: 'Enter a valid email address' });
    validate(root.email, ({ value }) => {
      const taken = this.takenEmails();
      return taken.has(value().toLowerCase())
        ? { kind: 'taken', message: 'Email already taken' }
        : undefined;
    });
  }));`,
  setupChrome: `  protected readonly checking = signal(false);
  protected readonly checkCount = signal(0);
  protected readonly forceFail = signal(false);
  protected readonly takenEmailList = computed(() => [...this.takenEmails()]);
  protected handleCheck(): void {
    const value = this.emailForm.email().value().trim().toLowerCase();
    if (!value) {
      this.emailForm.email().markAsTouched();
      return;
    }
    this.checking.set(true);
    this.checkCount.update((n) => n + 1);
    setTimeout(() => {
      const isTaken = this.forceFail() || value === 'used@example.com';
      if (isTaken) {
        this.takenEmails.update((set) => new Set(set).add(value));
      } else {
        this.takenEmails.update((set) => {
          const next = new Set(set);
          next.delete(value);
          return next;
        });
      }
      this.emailForm.email().markAsTouched();
      this.checking.set(false);
    }, 350);
  }
  protected handleReset(): void {
    this.model.set({ email: '' });
    this.takenEmails.set(new Set());
    this.checkCount.set(0);
    this.checking.set(false);
  }`,
  template: `  <div style="display:grid;gap:16px;max-width:480px">
    <cngx-form-field [field]="emailForm.email">
      <label cngxLabel for="server-email">Email address</label>
      <input
        id="server-email"
        type="email"
        autocomplete="email"
        [value]="emailForm.email().value()"
        (input)="emailForm.email().value.set($any($event.target).value)"
        (blur)="emailForm.email().markAsTouched()"
      />
      <div cngxError style="display:grid;gap:4px;margin-top:6px">
        @for (e of emailForm.email().errors(); track e.kind) {
          <p style="margin:0">
            @if (e.kind === 'taken') {
              <strong>Server:</strong>
            }
            {{ e.message }}
          </p>
        }
      </div>
    </cngx-form-field>
  </div>`,
  templateChrome: `<div class="button-row" style="margin-top:8px;display:flex;gap:8px;align-items:center">
      <button type="button" class="chip" (click)="handleCheck()" [disabled]="checking()">
        {{ checking() ? 'Checking...' : 'Check availability' }}
      </button>
      <button type="button" class="chip" (click)="handleReset()">Reset</button>
      <label style="display:flex;align-items:center;gap:6px">
        <input type="checkbox" [checked]="forceFail()" (change)="forceFail.set($any($event.target).checked)" />
        Force fail (treat any input as taken)
      </label>
    </div>
<div class="event-grid" style="margin-top:8px">
      <div class="event-row">
        <span class="event-label">Checks dispatched</span>
        <span class="event-value">{{ checkCount() }}</span>
      </div>
      <div class="event-row">
        <span class="event-label">Server says taken</span>
        <span class="event-value">{{ takenEmailList().length ? takenEmailList().join(', ') : 'none' }}</span>
      </div>
      <div class="event-row">
        <span class="event-label">Field valid</span>
        <span class="event-value">{{ emailForm.email().valid() ? 'yes' : 'no' }}</span>
      </div>
    </div>`,
};
