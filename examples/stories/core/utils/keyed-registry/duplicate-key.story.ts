import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'createKeyedRegistry: duplicate key',
  subtitle:
    '<code>createKeyedRegistry&lt;T&gt;()</code> keeps one holder per key in a signal map. Registering a different value under a live key is swap-is-noop: the first holder stays, and a development build logs <code>CNGX0004</code>.',
  description:
    'Two panels claim the key <code>details</code>. Whichever claims it first holds it; a claim by the other panel changes nothing and logs <code>CNGX0004</code> in the console. <code>unregister(key, value)</code> only removes the current holder, so a release by the panel that does not hold the key is a no-op too. Release the holder, then claim with the other panel for a real swap.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior', 'error-handling'],
  moduleImports: ["import { createKeyedRegistry } from '@cngx/core/utils';"],
  setup: `protected readonly panels = ['Summary panel', 'Audit panel'] as const;
  protected readonly registry = createKeyedRegistry<string>({ name: 'PanelRegistry' });
  protected readonly holder = computed(() => this.registry.get('details') ?? 'nobody');

  protected claim(panel: string): void {
    this.registry.register('details', panel);
  }

  protected release(panel: string): void {
    this.registry.unregister('details', panel);
  }`,
  template: `<p>Key "details" is held by: {{ holder() }}</p>
@for (panel of panels; track panel) {
  <div class="demo-inline-actions">
    <button type="button" (click)="claim(panel)">{{ panel }}: claim</button>
    <button type="button" (click)="release(panel)">{{ panel }}: release</button>
  </div>
}`,
};
