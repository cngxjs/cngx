import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Data-grid accordion: Density',
  subtitle:
    'The <code>[skin]="\'density\'"</code> skin frames a task list and transitions its row padding, so density is a token concern rather than a structural mode. The consumer drives <code>--cngx-dga-row-py</code> and <code>--cngx-dga-fs</code>; compact, standard, and spacious are just three sets of those two values.',
  description:
    'Density is not a component input. The row block padding and cell type read the <code>--cngx-dga-row-py</code> / <code>--cngx-dga-fs</code> hooks, which the demo sets from a <code>density</code> signal via <code>[style.*]</code> on the grid; the skin only transitions the padding so a switch animates. The status cell is a <code>&lt;cngx-tag&gt;</code>, not hand-written pill CSS. Column widths come from <code>col</code> (<code>grow</code> for the task, <code>md</code> for the assignee, <code>fit</code> for the status tag). On narrow screens the grid scrolls sideways with every column intact instead of dropping one.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['visual-variants'],
  apiComponents: ['CngxDataGridAccordion', 'CngxDataGridRow', 'CngxDgCell'],
  imports: [
    'CngxDataGridAccordion',
    'CngxDataGridRow',
    'CngxDataGridHeader',
    'CngxDataGridFooter',
    'CngxDgCell',
    'CngxTag',
  ],
  references: [
    {
      label: 'WAI-ARIA APG: Accordion pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/accordion/',
    },
  ],
  setup: `protected readonly density = signal<'compact' | 'standard' | 'spacious'>('standard');
  protected readonly densityPy = computed(() =>
    this.density() === 'compact' ? '0.3rem' : this.density() === 'spacious' ? '1rem' : '0.6rem',
  );
  protected readonly densityFs = computed(() =>
    this.density() === 'compact' ? '0.75rem' : this.density() === 'spacious' ? '1rem' : '0.875rem',
  );`,
  template: `  <div style="max-width:600px">
    <cngx-data-grid-accordion
      [skin]="'density'"
      [multi]="true"
      [headingLevel]="3"
      [style.--cngx-dga-row-py]="densityPy()"
      [style.--cngx-dga-fs]="densityFs()"
    >
      <cngx-data-grid-header>
        <span cngxDgCell col="grow">Task</span>
        <span cngxDgCell col="md">Assignee</span>
        <span cngxDgCell col="fit">Status</span>
      </cngx-data-grid-header>

      <cngx-data-grid-row panelId="t-812">
        <span cngxDgCell primary>Migrate auth guards to signals</span>
        <span cngxDgCell>a.khan</span>
        <span cngxDgCell>
          <cngx-tag color="info" variant="subtle" size="sm">Running</cngx-tag>
        </span>
        Blocked on the token refresh flow; PR up for review, targeting this sprint.
      </cngx-data-grid-row>

      <cngx-data-grid-row panelId="t-815">
        <span cngxDgCell primary>Stabilise flaky checkout e2e</span>
        <span cngxDgCell>m.oren</span>
        <span cngxDgCell>
          <cngx-tag color="warning" variant="subtle" size="sm">Waiting</cngx-tag>
        </span>
        Waiting on a staging fixture reset; retries masked a real race in the cart total.
      </cngx-data-grid-row>

      <cngx-data-grid-row panelId="t-818">
        <span cngxDgCell primary>Write the density skin docs</span>
        <span cngxDgCell>c.weiss</span>
        <span cngxDgCell>
          <cngx-tag color="success" variant="subtle" size="sm">Done</cngx-tag>
        </span>
        Shipped with the report skin; screenshots verified in light and dark.
      </cngx-data-grid-row>

      <cngx-data-grid-row panelId="t-820">
        <span cngxDgCell primary>Audit tag colour tokens</span>
        <span cngxDgCell>l.park</span>
        <span cngxDgCell>
          <cngx-tag color="info" variant="subtle" size="sm">Running</cngx-tag>
        </span>
        Cross-checking every semantic colour against the dark scheme contrast floor.
      </cngx-data-grid-row>

      <cngx-data-grid-footer>
        <span>4 tasks</span>
        <span>1 done / 2 running / 1 waiting</span>
      </cngx-data-grid-footer>
    </cngx-data-grid-accordion>
  </div>`,
  templateChrome: `  <fieldset class="button-row" style="border:0;padding:0;margin:0 0 1rem;display:flex;gap:1rem;align-items:center;flex-wrap:wrap">
    <legend style="padding:0;font-weight:600">Row density</legend>
    <label><input type="radio" name="dga-density" value="compact" [checked]="density() === 'compact'" (change)="density.set('compact')" /> Compact</label>
    <label><input type="radio" name="dga-density" value="standard" [checked]="density() === 'standard'" (change)="density.set('standard')" /> Standard</label>
    <label><input type="radio" name="dga-density" value="spacious" [checked]="density() === 'spacious'" (change)="density.set('spacious')" /> Spacious</label>
  </fieldset>`,
};
