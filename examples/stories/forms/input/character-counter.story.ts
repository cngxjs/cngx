import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxInput: character counter',
  subtitle: '<code>CngxCharCount</code> shows a live counter. Supports <code>[max]</code> input and custom templates.',
  description: 'Smart input directives with ARIA projection, autocomplete inference, password toggle, and character counter.',
  level: 'molecule',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['behavior', 'composition'],
  apiComponents: [
    'CngxInput',
    'CngxCharCount',
  ],
  moduleImports: [
    'import { form, schema, required, minLength, maxLength, FormField } from \'@angular/forms/signals\';',
    'import { CngxFormField, CngxLabel, CngxHint, CngxFieldErrors } from \'@cngx/forms/field\';',
    'import { CngxInput, CngxCharCount } from \'@cngx/forms/input\';',
  ],
  imports: ['CngxFormField', 'CngxLabel', 'CngxInput', 'CngxHint', 'CngxFieldErrors', 'CngxCharCount', 'FormField'],
  setup: `private readonly bioModel = signal({ bio: '' });
  private readonly bioSchema = schema<{ bio: string }>(root => {
    required(root.bio);
    minLength(root.bio, 10);
    maxLength(root.bio, 140);
  });
  protected readonly bioForm = form(this.bioModel, this.bioSchema);
  protected readonly bioField = this.bioForm.bio;
  private readonly bio2Model = signal({ bio: '' });
  private readonly bio2Schema = schema<{ bio: string }>(root => {
    maxLength(root.bio, 140);
  });
  protected readonly bio2Form = form(this.bio2Model, this.bio2Schema);
  protected readonly bio2Field = this.bio2Form.bio;`,
  template: `
  <div class="demo-form">
    <div class="demo-field">
      <cngx-form-field [field]="bioField">
        <label cngxLabel>Bio (default)</label>
        <textarea cngxInput [formField]="bioField" placeholder="Tell us about yourself..." rows="3"
          style="resize:vertical"></textarea>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span cngxHint>10-140 characters</span>
          <cngx-char-count [max]="140" />
        </div>
        <cngx-field-errors />
      </cngx-form-field>
    </div>

    <div class="demo-field">
      <cngx-form-field [field]="bio2Field">
        <label cngxLabel>Bio (custom template)</label>
        <textarea cngxInput [formField]="bio2Field" placeholder="Same field, custom counter..." rows="3"
          style="resize:vertical"></textarea>
        <cngx-char-count [max]="140">
          <ng-template let-current="current" let-remaining="remaining" let-over="over">
            <span class="demo-counter" [class.demo-counter--warn]="over">
              @if (over) { {{ -remaining! }} characters over limit }
              @else { {{ remaining }} characters remaining }
            </span>
          </ng-template>
        </cngx-char-count>
      </cngx-form-field>
    </div>
  </div>`,
};
