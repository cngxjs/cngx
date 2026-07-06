import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBreadcrumbBar: variant skins',
  subtitle:
    'The <code>variant</code> input maps to a <code>cngx-breadcrumb--{variant}</code> host class, not a set of boolean flags. <code>plain</code>, <code>contained</code>, and <code>pill</code> each retint the same leaf tokens the structural rules already read, so the structure stays variant-agnostic (Pillar 3).',
  description:
    'Every thematic value resolves from a <code>--cngx-breadcrumb-*</code> custom property with a fallback, so a consumer retheme is a token override - no fork of the template. Add your own variant by defining <code>.cngx-breadcrumb--brand</code> against those same tokens.',
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
    <cngx-breadcrumb [items]="crumbs" variant="plain" label="Plain breadcrumb" />
    <cngx-breadcrumb [items]="crumbs" variant="contained" label="Contained breadcrumb" />
    <cngx-breadcrumb [items]="crumbs" variant="pill" label="Pill breadcrumb" />
  </div>`,
};
