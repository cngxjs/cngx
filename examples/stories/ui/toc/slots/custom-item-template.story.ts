import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxToc: custom item template',
  subtitle:
    'Project an <code>&lt;ng-template cngxTocItem&gt;</code> to replace the built-in label. The context exposes the item, its <code>active</code> state, and its <code>depth</code>, so a slot can weight the active link and badge a section with a child count. Resolution is three-stage: instance slot, then <code>CNGX_TOC_CONFIG.templates.item</code>, then the built-in label.',
  description:
    'The slot customises the label only - the anchor, aria-current and scroll behaviour stay owned by the organism. Here a CngxBadge shows the child count and the active item renders bold.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['composition'],
  apiComponents: ['CngxToc', 'CngxTocItemSlot'],
  moduleImports: [
    "import { CngxToc, CngxTocItemSlot, type CngxTocItem } from '@cngx/ui/toc';",
    "import { CngxBadge } from '@cngx/common/display';",
  ],
  imports: ['CngxToc', 'CngxTocItemSlot', 'CngxBadge'],
  setup: `protected readonly toc: CngxTocItem[] = [
    { id: 'doc-intro', label: 'Introduction' },
    {
      id: 'doc-guides',
      label: 'Guides',
      children: [
        { id: 'doc-guides-forms', label: 'Forms' },
        { id: 'doc-guides-theming', label: 'Theming' },
      ],
    },
    { id: 'doc-api', label: 'API reference' },
  ];
  protected readonly sections = [
    { id: 'doc-intro', label: 'Introduction' },
    { id: 'doc-guides', label: 'Guides' },
    { id: 'doc-guides-forms', label: 'Forms' },
    { id: 'doc-guides-theming', label: 'Theming' },
    { id: 'doc-api', label: 'API reference' },
  ];`,
  template: `  <div style="display:flex; gap:24px; max-width:680px">
    <cngx-toc [items]="toc"
              contentRoot=".toc-article-slots"
              style="position:sticky; top:0; align-self:flex-start; min-width:180px">
      <ng-template cngxTocItem let-item let-active="active">
        <span [style.font-weight]="active ? '600' : '400'"
              [cngxBadge]="item.children?.length ?? 0"
              color="neutral"
              position="inline">{{ item.label }}</span>
      </ng-template>
    </cngx-toc>
    <div class="toc-article-slots" style="height:320px; overflow-y:auto; flex:1; padding-inline-end:8px">
      @for (s of sections; track s.id) {
        <section [id]="s.id" style="min-height:220px">
          <h3 style="margin-top:0">{{ s.label }}</h3>
          <p>Parent sections show a child-count badge in the rail; the active
             link renders bold via the slot's active context value.</p>
        </section>
      }
    </div>
  </div>`,
};
