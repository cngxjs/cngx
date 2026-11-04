import { Component, signal } from '@angular/core';
import { form } from '@angular/forms/signals';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CngxFormField, CngxLabel } from '@cngx/forms/field';

import { KINDS, NODES, OPTIONS, cleanupRoots, mount, polyfillPopover } from './__test-helpers/review-probe-host';

afterEach(() => {
  cleanupRoots();
  vi.restoreAllMocks();
});

// H6: without a bound id the host renders no id attribute (id="" is invalid).
describe('H6: no id attribute without a bound id', () => {
  for (const key of ['select', 'multi', 'reorder', 'shell', 'tree'] as const) {
    it.fails(`${KINDS[key].name} renders no id attribute`, () => {
      const m = mount(KINDS[key]);
      expect(m.el.hasAttribute('id')).toBe(false);
    });
  }
});

// aria-label inside a cngx-form-field: an explicit [aria-label] is the
// accessible name (and suppresses aria-labelledby); a consumer aria-labelledby
// still wins over both.
describe('explicit aria-label inside a form field', () => {
  const roots: HTMLElement[] = [];
  afterEach(() => roots.splice(0).forEach((el) => el.remove()));

  function mountInField(key: string, extra: string): HTMLElement {
    polyfillPopover();
    const kind = KINDS[key];
    const inputsExpr = kind.inputs.replace('[options]="options"', '[options]="options()"');
    @Component({ template: '', imports: [] })
    class Host {
      readonly options = signal<unknown[]>(OPTIONS);
      readonly nodes = NODES;
      readonly idFn = (v: unknown): string => String(v);
      readonly labelFn = (v: unknown): string => String(v);
      readonly model = signal<{ pick: unknown }>({ pick: kind.model === 'value' ? undefined : [] });
      readonly f = form(this.model);
    }
    TestBed.overrideComponent(Host, {
      set: {
        template: `
          <cngx-form-field [field]="f.pick">
            <label cngxLabel>Pick</label>
            <${kind.selector} ${inputsExpr} ${extra}>${kind.content ?? ''}</${kind.selector}>
          </cngx-form-field>
        `,
        imports: [CngxFormField, CngxLabel, kind.component, ...(kind.contentImports ?? [])],
      },
    });
    const fixture = TestBed.createComponent(Host);
    const root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    roots.push(root);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const host = fixture.debugElement.query(By.directive(kind.component)).nativeElement as HTMLElement;
    const combobox = host.querySelector<HTMLElement>('[role="combobox"]');
    expect(combobox, `${kind.selector} renders no role="combobox"`).not.toBeNull();
    return combobox!;
  }

  // The scalar composites still let the field label override a consumer
  // aria-labelledby; the decision gives the consumer precedence. The array
  // composites already honour it.
  const NEEDS_LABEL_FIX = new Set(['select', 'typeahead', 'actionSelect', 'shell']);

  for (const key of ['select', 'multi', 'combobox', 'typeahead', 'actionSelect', 'actionMulti', 'reorder', 'tree', 'shell'] as const) {
    it.fails(`${KINDS[key].name}: an explicit [aria-label] names the trigger and drops aria-labelledby`, () => {
      const el = mountInField(key, `[aria-label]="'Pick colour'"`);
      expect(el.getAttribute('aria-label')).toBe('Pick colour');
      expect(el.getAttribute('aria-labelledby')).toBeNull();
    });

    const consumerWins = NEEDS_LABEL_FIX.has(key) ? it.fails : it;
    consumerWins(`${KINDS[key].name}: a consumer aria-labelledby wins over both`, () => {
      const el = mountInField(key, `[aria-label]="'Pick colour'" aria-labelledby="ext-label"`);
      expect(el.getAttribute('aria-labelledby')).toBe('ext-label');
    });
  }
});
