import { describe, expect, it } from 'vitest';

import { TmplAstElement, TmplAstTemplate } from '@angular/compiler';

import { readFixture } from '../../testing/run-schematic';
import { appendElements, hasElement, insertBeforeElement, parseTemplateContent, walkNodes } from './template-edit';

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

  it('reaches every @switch case and the @default branch', () => {
    const template =
      '@switch (mode) { @case (1) { <button>A</button> } @case (2) { <button>B</button> } @default { <button>C</button> } }';
    const buttons = walkNodes(parseTemplateContent(template)).filter(
      (node): node is TmplAstElement => node instanceof TmplAstElement && node.name === 'button',
    );

    expect(buttons.map((button) => button.children.map((child) => ('value' in child ? child.value : '')).join(''))).toEqual([
      'A',
      'B',
      'C',
    ]);
  });

  it('returns an empty list for no nodes', () => {
    expect(walkNodes([])).toEqual([]);
  });
});

describe('hasElement', () => {
  it('finds an element at any depth, inside control-flow blocks too', () => {
    expect(hasElement(TEMPLATE, 'span')).toBe(true);
    expect(hasElement('@if (ready) { <main><router-outlet /></main> }', 'router-outlet')).toBe(true);
    expect(hasElement(TEMPLATE, 'router-outlet')).toBe(false);
  });

  it('never counts a tag name inside a comment or text', () => {
    expect(hasElement('<!-- <cngx-toast-outlet /> --><p>cngx-toast-outlet</p>', 'cngx-toast-outlet')).toBe(false);
  });

  it('throws on a template that does not parse', () => {
    expect(() => hasElement('<div>@if (</div>', 'div')).toThrow(/Cannot parse/);
  });
});

describe('insertBeforeElement', () => {
  it('puts the markup on its own line above the element, with its indent', () => {
    expect(insertBeforeElement('<main>\n  <router-outlet />\n</main>\n', 'router-outlet', '<cngx-banner-outlet />')).toBe(
      '<main>\n  <cngx-banner-outlet />\n  <router-outlet />\n</main>\n',
    );
  });

  it('puts the markup right before an element that shares its line', () => {
    expect(insertBeforeElement('<main><router-outlet /></main>', 'router-outlet', '<cngx-banner-outlet />')).toBe(
      '<main><cngx-banner-outlet /> <router-outlet /></main>',
    );
  });

  it('lands after the End of Placeholder marker of the stock template', () => {
    const stock = readFixture('scaffold-21')['src/app/app.html'];
    const edited = insertBeforeElement(stock, 'router-outlet', '<cngx-banner-outlet />');

    expect(edited.indexOf('<cngx-banner-outlet />')).toBeGreaterThan(edited.indexOf('End of Placeholder'));
    expect(edited.endsWith('<cngx-banner-outlet />\n<router-outlet />\n')).toBe(true);
  });

  it('keeps CRLF line endings', () => {
    expect(insertBeforeElement('<p></p>\r\n<router-outlet />\r\n', 'router-outlet', '<x-a />')).toBe(
      '<p></p>\r\n<x-a />\r\n<router-outlet />\r\n',
    );
  });

  it('leaves a template without the element unchanged', () => {
    expect(insertBeforeElement('<p></p>\n', 'router-outlet', '<x-a />')).toBe('<p></p>\n');
  });
});

describe('appendElements', () => {
  it('appends each element on its own line into an empty template', () => {
    expect(appendElements('', ['<x-a />', '<x-b />'])).toBe('<x-a />\n<x-b />\n');
  });

  it('appends after a trailing comment and adds a missing final newline', () => {
    expect(appendElements('<p></p>\n<!-- end -->', ['<x-a />'])).toBe('<p></p>\n<!-- end -->\n<x-a />\n');
  });

  it('lands after the End of Placeholder marker of the stock template without routing', () => {
    const stock = readFixture('scaffold-21-routing-off')['src/app/app.html'];
    const edited = appendElements(stock, ['<cngx-toast-outlet />']);

    expect(edited.startsWith(stock)).toBe(true);
    expect(edited.indexOf('<cngx-toast-outlet />')).toBeGreaterThan(edited.indexOf('End of Placeholder'));
  });

  it('keeps CRLF line endings', () => {
    expect(appendElements('<p></p>\r\n', ['<x-a />'])).toBe('<p></p>\r\n<x-a />\r\n');
  });
});
