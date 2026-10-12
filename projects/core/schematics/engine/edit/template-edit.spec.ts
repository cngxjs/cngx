import { describe, expect, it } from 'vitest';

import { TmplAstElement, TmplAstTemplate } from '@angular/compiler';

import { findElements, insertAttribute, parseTemplateContent, walkNodes } from './template-edit';

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

    expect(findElements(nodes, (element) => element.name === 'section')).toHaveLength(1);
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

describe('findElements', () => {
  it('finds matches inside elements, control flow, ng-template and @empty', () => {
    const buttons = findElements(parseTemplateContent(TEMPLATE), (element) => element.name === 'button');

    expect(buttons.map((button) => button.children.map((child) => ('value' in child ? child.value : '')).join(''))).toEqual([
      'Save',
      'Close',
      'Later',
      'Add',
    ]);
  });

  it('finds matches in every @switch case and @default', () => {
    const template = '@switch (mode) { @case (1) { <button>A</button> } @case (2) { <button>B</button> } @default { <button>C</button> } }';

    expect(findElements(parseTemplateContent(template), (element) => element.name === 'button')).toHaveLength(3);
  });

  it('returns nothing when no element matches', () => {
    expect(findElements(parseTemplateContent(TEMPLATE), (element) => element.name === 'cngx-select')).toEqual([]);
  });
});

describe('insertAttribute', () => {
  it('inserts the attribute after the tag name and keeps the rest byte-identical', () => {
    const content = '<p>\n  <button type="button">Save</button>\n</p>\n';
    const [button] = findElements(parseTemplateContent(content), (element) => element.name === 'button');

    expect(insertAttribute(content, button, 'cngxRipple')).toBe(
      '<p>\n  <button cngxRipple type="button">Save</button>\n</p>\n',
    );
  });

  it('works on an element without attributes', () => {
    const content = '<button>Save</button>';
    const [button] = findElements(parseTemplateContent(content), () => true);

    expect(insertAttribute(content, button, "[skin]=\"'outline'\"")).toBe("<button [skin]=\"'outline'\">Save</button>");
  });
});
