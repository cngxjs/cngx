import type { Node } from '@cngx/data-display/treetable';

export interface Employee {
  name: string;
  role: string;
  location: string;
}

export const ORG_TREE: Node<Employee> = {
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
      children: [{ value: { name: 'Yuki Tanaka', role: 'Brand Lead', location: 'Tokyo' } }],
    },
  ],
};
