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
  selector: 'app-root',
  imports: [CngxTreetable, CngxMaterialTreetable],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly tree = signal<Node<Employee>>(ORG_TREE);
  protected readonly lastClickedCdk = signal<FlatNode<Employee> | null>(null);
  protected readonly lastClickedMat = signal<FlatNode<Employee> | null>(null);
}
