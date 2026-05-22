import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTag: link mode',
  subtitle: 'Native <code>&lt;a cngxTag&gt;</code> preserves anchor semantics: focus, keyboard activation, navigation.',
  description: 'The directive selector targets both <code>[cngxTag]</code> and <code>&lt;cngx-tag&gt;</code>, so the same visual contract drops onto a real anchor without a wrapper. The example app strips the default underline via a helper class; the directive itself never touches text-decoration.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern'],
  apiComponents: ['CngxTag'],
  moduleImports: ["import { CngxTag } from '@cngx/common/display';"],
  imports: ['CngxTag'],
  references: [
    {
      label: 'HTML Living Standard: the a element',
      href: 'https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-a-element',
    },
  ],
  template: `
  <div class="demo-tag-row">
    <a cngxTag color="info" href="#category/frontend" class="demo-tag-link">frontend</a>
    <a cngxTag color="success" href="#category/cleared" class="demo-tag-link">cleared</a>
    <a cngxTag color="warning" href="#category/pending" class="demo-tag-link">pending</a>
  </div>`,
};
