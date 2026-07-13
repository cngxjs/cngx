import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBreadcrumbBar: skins',
  subtitle:
    'The typed <code>skin</code> input reflects onto a <code>[data-skin]</code> host attribute, not a set of boolean flags. <code>plain</code>, <code>contained</code>, and <code>pill</code> each paint through their own <code>@scope</code> block, retinting the same leaf tokens the structural rules already read, so the structure stays skin-agnostic (Pillar 3).',
  description:
    'Every thematic value resolves from a <code>--cngx-breadcrumb-*</code> custom property declared as a <code>@property</code> under <code>@group Skin</code>, so a consumer retheme is a token override - no fork of the template. The skin resolves through the cascade <code>input ?? config.skin ?? \'classic\'</code>; set an app-wide default with <code>withBreadcrumbSkin(...)</code>.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: ['CngxBreadcrumbBar'],
  moduleImports: ["import { CngxBreadcrumbBar } from '@cngx/ui/breadcrumb';"],
  imports: ['CngxBreadcrumbBar'],
  setup: `protected readonly crumbs = [
    { label: 'Home', href: '#/' },
    { label: 'Catalog', href: '#/catalog' },
    { label: 'Books', href: '#/catalog/books' },
    { label: 'The Hobbit' },
  ];`,
  template: `  <div style="display: flex; flex-direction: column; gap: 1rem;">
    <cngx-breadcrumb [items]="crumbs" skin="plain" label="Plain breadcrumb" />
    <cngx-breadcrumb [items]="crumbs" skin="contained" label="Contained breadcrumb" />
    <cngx-breadcrumb [items]="crumbs" skin="pill" label="Pill breadcrumb" />
  </div>`,
};
