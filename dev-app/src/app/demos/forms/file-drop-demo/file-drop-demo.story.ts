import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'File Drop',
  navLabel: 'File Drop',
  navCategory: 'input',
  description:
    'Headless drag-and-drop file behavior with MIME/size validation, programmatic file picker, and rejection feedback.',
  apiComponents: ['CngxFileDrop'],
  overview:
    '<p><code>CngxFileDrop</code> adds drag-and-drop file handling to any element. ' +
    'Validates files against <code>accept</code> (MIME types) and <code>maxSize</code>. ' +
    'Provides <code>browse()</code> for programmatic file picker access.</p>' +
    '<p>Purely behavioral — the consumer renders all UI. CSS classes ' +
    '<code>.cngx-file-drop--dragging</code> and <code>.cngx-file-drop--has-files</code> are applied automatically.</p>',
  moduleImports: [
    "import { CngxFileDrop } from '@cngx/forms/input';",
  ],
  sections: [
    {
      title: 'Image Upload',
      subtitle:
        'Accepts images up to 5 MB. Drag a file over the zone or click Browse. ' +
        'Rejected files show in the rejection list.',
      imports: ['CngxFileDrop'],
      template: `
  <div class="demo-form">
    <div cngxFileDrop [accept]="['image/*']" [maxSize]="5_000_000" [multiple]="true"
      #drop="cngxFileDrop"
      style="border:2px dashed var(--border-color,#ccc);border-radius:8px;padding:32px;text-align:center;transition:border-color 0.2s"
      [style.borderColor]="drop.dragging() ? 'var(--interactive,#1976d2)' : 'var(--border-color,#ccc)'"
      [style.background]="drop.dragging() ? 'var(--interactive-subtle-bg,#e3f2fd)' : 'transparent'"
    >
      @if (drop.dragging()) {
        <p style="margin:0;font-weight:500">Drop images here</p>
      } @else if (drop.files().length) {
        <p style="margin:0">{{ drop.files().length }} file(s) selected</p>
      } @else {
        <p style="margin:0">Drag images here or
          <button class="chip" (click)="drop.browse()">Browse</button>
        </p>
        <p style="margin:4px 0 0;font-size:0.75rem;color:var(--text-muted,#666)">Max 5 MB per file</p>
      }
    </div>

    @if (drop.files().length) {
      <div class="status-row" style="margin-top:8px">
        @for (file of drop.files(); track file.name) {
          <span class="status-badge">{{ file.name }} ({{ (file.size / 1024).toFixed(1) }} KB)</span>
        }
      </div>
      <button class="chip" (click)="drop.clear()" style="margin-top:4px">Clear</button>
    }

    @if (drop.rejected().length) {
      <div style="margin-top:8px;color:var(--cngx-field-error-color,#d32f2f);font-size:0.75rem">
        @for (r of drop.rejected(); track r.file.name) {
          <div>Rejected: {{ r.file.name }} ({{ r.reason }})</div>
        }
      </div>
    }
  </div>`,
    },
  ],
};
