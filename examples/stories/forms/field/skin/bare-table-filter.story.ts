import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxFieldSkinHost: bare skin in a table filter row',
  subtitle: 'A filter row under the column headers, built from plain <code>&lt;input cngxFieldSkin="bare"&gt;</code> with no <code>&lt;cngx-form-field&gt;</code>. The table cell owns the boundary; the input paints nothing at rest and shows only the focus ring.',
  description: 'Each filter takes its accessible name from the column header through <code>aria-labelledby</code>, so the header text is announced as the label without a second string to translate. When no visible header exists, use <code>aria-label</code> instead; a placeholder is not a label. Outside a field there is no label, hint or error to wire, so the inputs carry only <code>CngxFieldSkinHost</code> through the explicit <code>cngxFieldSkin</code> attribute; the same attribute composes with any input directive, here <code>input[cngxSearch]</code> in the location column. The consumer rule <code>td:has([data-skin=\'bare\']) { padding: 0 }</code> hands the whole cell to the input as its hit area; the input keeps its own padding and touch-target floor.',
  level: 'atom',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'building-block',
  focus: ['visual-variants', 'a11y-pattern'],
  apiComponents: ['CngxFieldSkinHost', 'CngxSearch'],
  moduleImports: [
    'import { CngxFieldSkinHost } from \'@cngx/forms/field\';',
    'import { CngxSearch } from \'@cngx/common/interactive\';',
    'import { PEOPLE } from \'../../../../fixtures\';',
  ],
  imports: ['CngxFieldSkinHost', 'CngxSearch'],
  references: [
    { label: 'WCAG 1.3.1 Info and Relationships', href: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html' },
    { label: 'WCAG 4.1.2 Name, Role, Value', href: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html' },
  ],
  css: `/* The cell becomes the input's hit area. */
td:has([data-skin='bare']) {
  padding: 0;
}`,
  setup: `protected readonly nameFilter = signal('');
  protected readonly roleFilter = signal('');
  protected readonly locationFilter = signal('');
  protected readonly rows = computed(() => {
    const name = this.nameFilter().toLowerCase();
    const role = this.roleFilter().toLowerCase();
    const location = this.locationFilter().toLowerCase();
    return PEOPLE.filter(
      (p) =>
        p.name.toLowerCase().includes(name) &&
        p.role.toLowerCase().includes(role) &&
        p.location.toLowerCase().includes(location),
    );
  });`,
  template: `  <table class="demo-skin-table">
    <thead>
      <tr>
        <th scope="col" id="col-name">Name</th>
        <th scope="col" id="col-role">Role</th>
        <th scope="col" id="col-location">Location</th>
      </tr>
      <tr>
        <td>
          <input cngxFieldSkin="bare" aria-labelledby="col-name"
            (input)="nameFilter.set($any($event.target).value)" />
        </td>
        <td>
          <input cngxFieldSkin="bare" aria-labelledby="col-role"
            (input)="roleFilter.set($any($event.target).value)" />
        </td>
        <td>
          <input cngxSearch cngxFieldSkin="bare" type="search" aria-labelledby="col-location"
            (searchChange)="locationFilter.set($event)" />
        </td>
      </tr>
    </thead>
    <tbody>
      @for (person of rows(); track person.name) {
        <tr>
          <td>{{ person.name }}</td>
          <td>{{ person.role }}</td>
          <td>{{ person.location }}</td>
        </tr>
      } @empty {
        <tr>
          <td colspan="3">No people match the filters.</td>
        </tr>
      }
    </tbody>
  </table>`,
  templateChrome: `<div class="status-row">
      <span class="status-badge">Matching rows: {{ rows().length }}</span>
    </div>`,
};
