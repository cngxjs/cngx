import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'focusFirstError: submit focuses first invalid',
  subtitle:
    "<code>focusFirstError(tree)</code> walks the root field's <code>errorSummary()</code> and moves focus to the first invalid field that has a bound control. Call it when <code>submit()</code> resolves <code>false</code>, so keyboard and screen-reader users land on the problem instead of the submit button.",
  description:
    'Submit the empty form: <code>submit()</code> marks every field touched and resolves <code>false</code>, the errors appear, and focus jumps to Full name. Fill in Full name and submit again: focus moves to Email, the next invalid field in form order. A field only counts when Signal Forms knows its control through <code>[formField]</code>; a group-level error without one is skipped, and when only such errors remain the first one is focused anyway, which does nothing visible but still returns <code>true</code>. The function returns <code>false</code> only when the form has no errors at all. The readout shows the return value and tracks which element holds focus.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'error-handling'],
  framework: 'signal-forms',
  apiComponents: ['CngxFormField', 'CngxFieldErrors'],
  references: [
    {
      label: 'WCAG 3.3.1 Error Identification',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/error-identification.html',
    },
    {
      label: 'WCAG 2.4.3 Focus Order',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/focus-order.html',
    },
  ],
  moduleImports: [
    "import { email, form, FormField, min, required, schema, submit } from '@angular/forms/signals';",
    "import { CngxFieldErrors, CngxFormField, CngxLabel, focusFirstError } from '@cngx/forms/field';",
    "import { CngxInput } from '@cngx/forms/input';",
  ],
  imports: ['FormField', 'CngxFormField', 'CngxLabel', 'CngxInput', 'CngxFieldErrors'],
  setup: `protected readonly model = signal({ fullName: '', email: '', seats: 0 });
  protected readonly booking = form(this.model, schema<{ fullName: string; email: string; seats: number }>((root) => {
    required(root.fullName, { message: 'Full name is required' });
    required(root.email, { message: 'Email is required' });
    email(root.email, { message: 'Enter a valid email address' });
    min(root.seats, 1, { message: 'Book at least one seat' });
  }));
  protected readonly focused = signal<boolean | null>(null);

  protected async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();
    const saved = await submit(this.booking, async () => undefined);
    this.focused.set(saved ? null : focusFirstError(this.booking));
  }`,
  template: `  <form class="demo-form" novalidate (submit)="handleSubmit($event)">
    <cngx-form-field [field]="booking.fullName">
      <label cngxLabel>Full name</label>
      <input cngxInput [formField]="booking.fullName" />
      <cngx-field-errors />
    </cngx-form-field>
    <cngx-form-field [field]="booking.email">
      <label cngxLabel>Email</label>
      <input cngxInput type="email" [formField]="booking.email" />
      <cngx-field-errors />
    </cngx-form-field>
    <cngx-form-field [field]="booking.seats">
      <label cngxLabel>Seats</label>
      <input cngxInput type="number" [formField]="booking.seats" />
      <cngx-field-errors />
    </cngx-form-field>
    <button type="submit" class="chip">Book</button>
  </form>`,
  setupChrome: `private readonly hostEl: ElementRef<HTMLElement> = inject(ElementRef);
  protected readonly focusTarget = signal('-');

  private readonly trackFocus = this.hostEl.nativeElement.addEventListener('focusin', (event: FocusEvent) => {
    const target = event.target;
    const label = target instanceof HTMLInputElement ? target.labels?.[0]?.textContent?.trim() : undefined;
    this.focusTarget.set(label ?? (target instanceof HTMLElement ? target.textContent?.trim() || target.tagName.toLowerCase() : '-'));
  });`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">focusFirstError returned</span><span class="event-value">{{ focused() ?? 'not called' }}</span></div>
    <div class="event-row"><span class="event-label">Focus is on (live)</span><span class="event-value">{{ focusTarget() }}</span></div>
    <div class="event-row"><span class="event-label">Form valid</span><span class="event-value">{{ booking().valid() }}</span></div>
  </div>`,
};
