import { Component, signal, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CngxFormField, type CngxFieldAccessor, type CngxFieldSkin } from '@cngx/forms/field';

/**
 * Shared spec for the `CngxFieldSkinHost` composition on a select-family
 * trigger. Every variant hosts the directive under the short `skin` alias,
 * so the same three cases hold everywhere: the default emits no attribute,
 * a surrounding field's skin reaches the trigger through
 * `CNGX_FORM_FIELD_HOST`, and the trigger's own `skin` input wins.
 *
 * Each variant's spec calls this in its own `describe` block with its
 * component class, element name, and a field factory. The factory is
 * passed in rather than built here because `@cngx/forms/field/testing` is
 * a spec-only path alias - `projects/forms/tsconfig.lib.json` overrides
 * `paths` without it, and this helper is not a spec file.
 *
 * @internal
 */
export function describeFieldSkinHost(
  variantName: string,
  component: Type<unknown>,
  elementSelector: string,
  makeField: () => CngxFieldAccessor,
): void {
  describe(`field-skin host (${variantName})`, () => {
    @Component({
      template: `
        <cngx-form-field [field]="field()" [skin]="fieldSkin()">
          <ng-container #slot />
        </cngx-form-field>
      `,
      imports: [CngxFormField],
    })
    class FieldHost {
      readonly field = signal<CngxFieldAccessor>(makeField());
      readonly fieldSkin = signal<CngxFieldSkin | undefined>(undefined);
    }

    // The variant is mounted through a dynamically built template rather
    // than a static one so this helper stays component-agnostic.
    function mount(fieldSkin?: CngxFieldSkin, ownSkin?: CngxFieldSkin): HTMLElement {
      const own = ownSkin === undefined ? '' : ` skin="${ownSkin}"`;
      TestBed.overrideComponent(FieldHost, {
        set: {
          template: `
            <cngx-form-field [field]="field()" [skin]="fieldSkin()">
              <${elementSelector}${own} />
            </cngx-form-field>
          `,
          imports: [CngxFormField, component],
        },
      });
      const fixture = TestBed.createComponent(FieldHost);
      if (fieldSkin !== undefined) {
        fixture.componentInstance.fieldSkin.set(fieldSkin);
      }
      fixture.detectChanges();
      const el = (fixture.nativeElement as HTMLElement).querySelector(elementSelector);
      if (!el) {
        throw new Error(`${elementSelector} did not render`);
      }
      return el as HTMLElement;
    }

    it('emits no data-skin by default', () => {
      expect(mount().getAttribute('data-skin')).toBeNull();
    });

    it('reads the surrounding field skin', () => {
      expect(mount('fill').getAttribute('data-skin')).toBe('fill');
    });

    it('lets the trigger own skin win over the field', () => {
      expect(mount('fill', 'bare').getAttribute('data-skin')).toBe('bare');
    });
  });
}
