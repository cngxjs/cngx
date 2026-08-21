import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxToc: heading auto-discovery',
  subtitle:
    'Set <code>autoDiscover</code> and the outline is derived from the headings under <code>contentRoot</code> - no hand-maintained <code>[items]</code>. Headings nest by level (<code>h2 &gt; h3</code>), and a heading with no <code>id</code> gets a slugified one written onto it so the link can target it. The scan is one-shot after the first render; call <code>refresh()</code> after you inject sections at runtime.',
  description:
    'Scroll the article - the rail tracks the active heading exactly as the explicit-items version does. This build derives Overview / Installation (npm, yarn) / Usage / API straight from the h2/h3 elements.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior', 'integration'],
  apiComponents: ['CngxToc'],
  moduleImports: ["import { CngxToc } from '@cngx/ui/toc';"],
  imports: ['CngxToc'],
  template: `  <div style="display:flex; gap:24px; max-width:680px">
    <cngx-toc autoDiscover
              contentRoot=".toc-article-auto"
              style="position:sticky; top:0; align-self:flex-start; min-width:180px"></cngx-toc>
    <div class="toc-article-auto" style="height:320px; overflow-y:auto; flex:1; padding-inline-end:8px">
      <h2>Overview</h2>
      <p style="margin:0 0 180px">The rail below was built from these headings, not a hand-written array.</p>
      <h2>Installation</h2>
      <p style="margin:0 0 32px">Pick a package manager.</p>
      <h3>Using npm</h3>
      <p style="margin:0 0 120px">Install from the npm registry.</p>
      <h3>Using yarn</h3>
      <p style="margin:0 0 180px">Or add it with yarn.</p>
      <h2>Usage</h2>
      <p style="margin:0 0 180px">Drop the component into your template.</p>
      <h2>API</h2>
      <p style="margin:0 0 180px">Inputs, outputs and slots.</p>
    </div>
  </div>`,
};
