import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxRating: star rating',
  subtitle:
    'Arrow-key navigable star rating that drops into <code>cngx-form-field</code> and announces its value.',
  description:
    'Positional rating value control composed from the roving-tabindex keyboard engine; the per-star glyph is a consumer slot.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['behavior', 'a11y-pattern'],
  framework: 'signal-forms',
  apiComponents: ['CngxRating', 'CngxRatingItem'],
  moduleImports: [
    "import { form, schema, required, FormField } from '@angular/forms/signals';",
    "import { CngxFormField, CngxLabel, CngxHint } from '@cngx/forms/field';",
    "import { CngxRating, CngxRatingItem } from '@cngx/forms/input';",
  ],
  imports: ['CngxFormField', 'CngxLabel', 'CngxHint', 'CngxRating', 'CngxRatingItem', 'FormField'],
  setup: `private readonly ratingModel = signal({ score: 0 });
  private readonly ratingSchema = schema<{ score: number }>((root) => {
    required(root.score);
  });
  protected readonly ratingForm = form(this.ratingModel, this.ratingSchema);
  protected readonly scoreField = this.ratingForm.score;`,
  template: `
  <div class="demo-form">
    <div class="demo-field">
      <cngx-form-field [field]="scoreField">
        <label cngxLabel>Rate your experience</label>
        <cngx-rating [max]="5">
          <ng-template cngxRatingItem let-filled="filled">
            <span style="font-size:1.75rem;line-height:1">{{ filled ? '★' : '☆' }}</span>
          </ng-template>
        </cngx-rating>
        <span cngxHint>Use the arrow keys or click a star</span>
      </cngx-form-field>
    </div>
  </div>`,
  templateChrome: `<div class="status-row">
        <span class="status-badge">Score: {{ scoreField().value() }} / 5</span>
      </div>`,
};
