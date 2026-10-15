import { describe, expect, it } from 'vitest';

import { TmplAstElement, TmplAstTemplate } from '@angular/compiler';

import { parseTemplateContent, walkNodes } from './template-edit';

const TEMPLATE = `<section>
  <button type="button">Save</button>
  @if (open) {
    <button class="close">Close</button>
  } @else {
    <ng-template><button>Later</button></ng-template>
  }
  @for (item of items; track item) {
    <span>{{ item }}</span>
  } @empty {
    <button>Add</button>
  }
</section>
`;

describe('parseTemplateContent', () => {
  it('returns the root nodes', () => {
    const nodes = parseTemplateContent(TEMPLATE);

    expect(nodes.filter((node) => node instanceof TmplAstElement).map((node) => node.name)).toEqual(['section']);
  });

  it('throws on a template that does not parse', () => {
    expect(() => parseTemplateContent('<div>@if (</div>', 'broken.html')).toThrow(/Cannot parse broken.html/);
  });
});

describe('walkNodes', () => {
  it('visits nested nodes in document order, templates included', () => {
    const nodes = walkNodes(parseTemplateContent(TEMPLATE));

    expect(nodes.filter((node) => node instanceof TmplAstTemplate)).toHaveLength(1);
    expect(nodes.filter((node) => node instanceof TmplAstElement && node.name === 'button')).toHaveLength(4);
  });

  it('returns an empty list for no nodes', () => {
    expect(walkNodes([])).toEqual([]);
  });
});
