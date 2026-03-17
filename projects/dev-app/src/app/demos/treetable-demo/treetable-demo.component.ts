import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

@Component({
  selector: 'app-treetable-demo',
  standalone: true,
  imports: [CngxTreetable, CngxMaterialTreetable, ExampleCardComponent],
  templateUrl: './treetable-demo.component.html',
  styleUrl: './treetable-demo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreetableDemoComponent {
  protected readonly tree = signal<Node<Employee>>(ORG_TREE);

  // ── Basic ────────────────────────────────────────────────────────────────
  protected readonly lastClickedCdk = signal<FlatNode<Employee> | null>(null);
  protected readonly lastClickedMat = signal<FlatNode<Employee> | null>(null);

  // ── Single selection (click-to-select, no checkboxes) ───────────────────
  protected readonly singleSelected = signal<readonly string[]>([]);

  // ── Multi selection (click-to-select, no checkboxes) ────────────────────
  protected readonly multiSelected = signal<readonly string[]>([]);

  // ── Single + checkboxes ──────────────────────────────────────────────────
  protected readonly singleCheckboxSelected = signal<readonly string[]>([]);

  // ── Multi + checkboxes ───────────────────────────────────────────────────
  protected readonly multiCheckboxSelected = signal<readonly string[]>([]);

  // ── Controlled selection (two-way binding via selectedIds) ───────────────
  // Pre-select "Marcus Vogel" (node id "0-0") and "Aisha Okonkwo" (id "0-1")
  protected readonly controlledIds = signal<ReadonlySet<string>>(new Set(['0-0', '0-1']));

  protected controlledIdsLabel(): string {
    return [...this.controlledIds()].join(', ') || '—';
  }

  protected selectLevel1(): void {
    this.controlledIds.set(new Set(['0', '0-0', '0-1', '0-2']));
  }

  protected clearSelection(): void {
    this.controlledIds.set(new Set());
  }
}
