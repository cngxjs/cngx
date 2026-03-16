import { Component, signal } from '@angular/core';
import { CngxTreetable, CngxMaterialTreetable } from '@cngx/data-display/treetable';
import type { FlatNode, Node } from '@cngx/data-display/treetable';

interface Employee {
  name: string;
  role: string;
  location: string;
}

const ORG_TREE: Node<Employee> = {
  value: { name: 'Sarah Chen', role: 'CEO', location: 'San Francisco' },
  children: [
    {
      value: { name: 'Marcus Vogel', role: 'CTO', location: 'Berlin' },
      children: [
        {
          value: { name: 'Lena Kovač', role: 'Engineering Lead', location: 'Berlin' },
          children: [
            { value: { name: 'Tom Fischer', role: 'Senior Dev', location: 'Berlin' } },
            { value: { name: 'Priya Nair', role: 'Senior Dev', location: 'Remote' } },
          ],
        },
        { value: { name: 'Diego Ruiz', role: 'DevOps Lead', location: 'Madrid' } },
      ],
    },
    {
      value: { name: 'Aisha Okonkwo', role: 'CFO', location: 'London' },
      children: [
        { value: { name: 'James Park', role: 'Controller', location: 'London' } },
        { value: { name: 'Nina Braun', role: 'Finance Analyst', location: 'Vienna' } },
      ],
    },
    {
      value: { name: 'Rafael Costa', role: 'CMO', location: 'São Paulo' },
      children: [
        { value: { name: 'Yuki Tanaka', role: 'Brand Lead', location: 'Tokyo' } },
      ],
    },
  ],
};

@Component({
  selector: 'app-treetable-demo',
  standalone: true,
  imports: [CngxTreetable, CngxMaterialTreetable],
  templateUrl: './treetable-demo.component.html',
  styleUrl: './treetable-demo.component.scss',
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
