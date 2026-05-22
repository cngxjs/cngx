import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTreeController: Provide tree config defaults',
  subtitle: '<code>provideTreeConfig(withDefaultNodeIdFn(...), withDefaultLabelFn(...))</code> in app or component providers; per-options always wins over the ambient default.',
  description: 'App-wide defaults for the tree controller factory. The resolution order is fixed: per-call options on <code>createTreeController({...})</code> beat <code>provideTreeConfigAt</code> in component <code>viewProviders</code>, which beats <code>provideTreeConfig</code> in root providers, which beats library hard-coded fallback. Feature flags (<code>withDefaultNodeIdFn</code>, <code>withDefaultLabelFn</code>, <code>withDefaultKeyFn</code>, <code>withTreeCacheLimit</code>, <code>withDefaultInitiallyExpanded</code>) compose by passing as varargs to either provider call. The provider returns a <code>Provider[]</code>, not <code>EnvironmentProviders</code>, so it works in route configs and component decorators without restriction. This demo is isolated from a real bootstrap, so it calls <code>createTreeController</code> with explicit options that the global config would otherwise supply; the description below the artifact shows the equivalent <code>bootstrapApplication</code> wiring.',
  level: 'molecule',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior', 'composition'],
  apiComponents: [
    'provideTreeConfig',
    'withDefaultNodeIdFn',
    'withDefaultLabelFn',
    'withDefaultInitiallyExpanded',
    'createTreeController',
  ],
  moduleImports: [
    'import { createTreeController } from \'@cngx/common/interactive\';',
    'import type { CngxTreeNode } from \'@cngx/utils\';',
  ],
  imports: [],
  setup: `
  protected readonly nodes = signal<readonly CngxTreeNode<{ uuid: string; name: string }>[]>([
    {
      value: { uuid: 'team-a', name: 'Team A' },
      children: [
        { value: { uuid: 'm-1', name: 'Ada' } },
        { value: { uuid: 'm-2', name: 'Grace' } },
      ],
    },
    {
      value: { uuid: 'team-b', name: 'Team B' },
      children: [
        { value: { uuid: 'm-3', name: 'Margaret' } },
        { value: { uuid: 'm-4', name: 'Hedy' } },
      ],
    },
  ]);

  protected readonly ctrl = createTreeController<{ uuid: string; name: string }>({
    nodes: this.nodes,
    // These three would normally come from provideTreeConfig at the root:
    nodeIdFn: (v) => v.uuid,
    labelFn: (v) => v.name,
    initiallyExpanded: 'all',
  });`,
  template: `
  <ul role="list" style="display:flex; flex-direction:column; gap:2px; max-width:24rem; list-style:none; padding:0; margin:0">
    @for (node of ctrl.visibleNodes(); track node.id) {
      <li
        [style.padding-inline-start.rem]="node.depth * 1.5"
        style="display:flex; align-items:center; gap:6px"
      >
        @if (node.hasChildren) {
          <button
            type="button"
            [attr.aria-label]="(ctrl.isExpanded(node.id)() ? 'Collapse ' : 'Expand ') + node.label"
            (click)="ctrl.toggle(node.id)"
          >{{ ctrl.isExpanded(node.id)() ? '▾' : '▸' }}</button>
        } @else {
          <span aria-hidden="true" style="display:inline-block; width:1.5em">·</span>
        }
        <span>{{ node.label }}</span>
      </li>
    }
  </ul>`,
  templateChromeBefore: `
  <p style="margin-bottom:12px">In a real app the <code>nodeIdFn</code> / <code>labelFn</code> / <code>initiallyExpanded</code> defaults would come from <code>provideTreeConfig(withDefaultNodeIdFn((v) =&gt; v.uuid), withDefaultLabelFn((v) =&gt; v.name), withDefaultInitiallyExpanded('all'))</code> in the root providers. This story is isolated from bootstrap, so the same values are passed inline.</p>`,
  templateChrome: `
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">visibleNodes()</span>
      <span class="event-value">{{ ctrl.visibleNodes().length }} of {{ ctrl.flatNodes().length }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">initiallyExpanded</span>
      <span class="event-value">all</span>
    </div>
  </div>`,
};
