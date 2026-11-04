import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Select family: readonly fields',
  subtitle:
    'A <code>readonly</code> Signal Forms field puts <code>&lt;cngx-select&gt;</code>, <code>&lt;cngx-typeahead&gt;</code> and <code>&lt;cngx-combobox&gt;</code> into read-only mode. The panel still opens for browsing and the value stays visible, but every write path refuses, and the trigger carries <code>aria-readonly="true"</code>. Readonly is a field concern, not a per-component input: apply <code>readonly()</code> in the schema and all three follow.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['behavior', 'a11y-pattern', 'integration'],
  framework: 'signal-forms',
  apiComponents: ['CngxSelect', 'CngxTypeahead', 'CngxCombobox'],
  moduleImports: [
    "import { form, schema, readonly } from '@angular/forms/signals';",
    "import { CngxFormField, CngxLabel } from '@cngx/forms/field';",
    "import { CngxCombobox, CngxSelect, CngxTypeahead, type CngxSelectOptionDef } from '@cngx/forms/select';",
  ],
  imports: ['CngxFormField', 'CngxLabel', 'CngxSelect', 'CngxTypeahead', 'CngxCombobox'],
  setup: `protected readonly colors: CngxSelectOptionDef<string>[] = [
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
    { value: 'blue', label: 'Blue' },
  ];
  protected readonly tags: CngxSelectOptionDef<string>[] = [
    { value: 'design', label: 'Design' },
    { value: 'development', label: 'Development' },
    { value: 'qa', label: 'QA' },
    { value: 'docs', label: 'Docs' },
  ];
  private readonly model = signal<{ colour: string; fruit: string; tags: string[] }>({
    colour: 'green',
    fruit: 'blue',
    tags: ['design', 'qa'],
  });
  private readonly editSchema = schema<{ colour: string; fruit: string; tags: string[] }>((root) => {
    readonly(root.colour, () => this.locked());
    readonly(root.fruit, () => this.locked());
    readonly(root.tags, () => this.locked());
  });
  protected readonly editForm = form(this.model, this.editSchema);`,
  setupChrome: `protected readonly locked = signal(true);`,
  templateChromeBefore: `<p class="demo-hint">All three fields are read-only: open a panel to browse, but no pick sticks. Toggle below to unlock.</p>`,
  template: `<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:1rem">
  <cngx-form-field [field]="editForm.colour">
    <label cngxLabel>Colour</label>
    <cngx-select [label]="'Colour'" [options]="colors" />
  </cngx-form-field>
  <cngx-form-field [field]="editForm.fruit">
    <label cngxLabel>Favourite</label>
    <cngx-typeahead [label]="'Favourite'" [options]="colors" placeholder="Search…" />
  </cngx-form-field>
  <cngx-form-field [field]="editForm.tags">
    <label cngxLabel>Tags</label>
    <cngx-combobox [label]="'Tags'" [options]="tags" placeholder="Filter…" />
  </cngx-form-field>
</div>`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <button type="button" class="chip" (click)="locked.set(!locked())">
      {{ locked() ? 'Read-only: ON' : 'Read-only: off' }}
    </button>
  </div>
  <div class="event-grid" style="margin-top:8px">
    <div class="event-row"><span class="event-label">Colour</span><span class="event-value">{{ editForm.colour().value() || '-' }}</span></div>
    <div class="event-row"><span class="event-label">Favourite</span><span class="event-value">{{ editForm.fruit().value() || '-' }}</span></div>
    <div class="event-row"><span class="event-label">Tags</span><span class="event-value">{{ editForm.tags().value().join(', ') || '-' }}</span></div>
  </div>`,
};
