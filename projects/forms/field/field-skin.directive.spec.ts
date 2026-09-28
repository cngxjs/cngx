import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxInput } from '@cngx/forms/input';
import { CngxSelect } from '@cngx/forms/select';
import { describe, expect, it } from 'vitest';
import { CngxFieldBox } from './field-box.directive';
import { CngxFieldSkinHost } from './field-skin.directive';
import { CngxFormField } from './form-field.component';
import { CNGX_FORM_FIELD_CONFIG, provideFormField, withFieldSkin } from './form-field.token';
import { createMockField } from './testing/mock-field';
import type { CngxFieldAccessor } from './models';

@Component({
  template: `<input cngxFieldSkin />`,
  imports: [CngxFieldSkinHost],
})
class BareDefaultHost {}

@Component({
  template: `<input cngxFieldSkin="bare" />`,
  imports: [CngxFieldSkinHost],
})
class BareExplicitHost {}

@Component({
  template: `
    <cngx-form-field [field]="field()" [skin]="fieldSkin()">
      <input [cngxFieldSkin]="ownSkin()" />
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxFieldSkinHost],
})
class InFieldHost {
  readonly field = signal<CngxFieldAccessor>(createMockField({ name: 'email' }).accessor);
  readonly fieldSkin = signal<'outline' | 'fill' | 'bare' | undefined>(undefined);
  readonly ownSkin = signal<'outline' | 'fill' | 'bare' | undefined>(undefined);
}

function skinAttrOf(fixture: { nativeElement: HTMLElement }): string | null {
  return fixture.nativeElement.querySelector('input')!.getAttribute('data-skin');
}

describe('CngxFieldSkinHost', () => {
  it('emits no data-skin for the default outline', () => {
    const fixture = TestBed.createComponent(BareDefaultHost);
    fixture.detectChanges();
    expect(skinAttrOf(fixture)).toBeNull();
  });

  it('emits the own skin on a bare control with no surrounding field', () => {
    const fixture = TestBed.createComponent(BareExplicitHost);
    fixture.detectChanges();
    expect(skinAttrOf(fixture)).toBe('bare');
  });

  it('reads the surrounding field skin through the host contract', () => {
    const fixture = TestBed.createComponent(InFieldHost);
    fixture.componentInstance.fieldSkin.set('fill');
    fixture.detectChanges();
    expect(skinAttrOf(fixture)).toBe('fill');
  });

  it('lets the own input win over the field', () => {
    const fixture = TestBed.createComponent(InFieldHost);
    fixture.componentInstance.fieldSkin.set('fill');
    fixture.componentInstance.ownSkin.set('bare');
    fixture.detectChanges();
    expect(skinAttrOf(fixture)).toBe('bare');
  });

  it('resolves outline back to no attribute even against a fill field', () => {
    const fixture = TestBed.createComponent(InFieldHost);
    fixture.componentInstance.fieldSkin.set('fill');
    fixture.componentInstance.ownSkin.set('outline');
    fixture.detectChanges();
    expect(skinAttrOf(fixture)).toBeNull();
  });

  describe('with withFieldSkin as the app-wide default', () => {
    it('applies to a control with no surrounding field', () => {
      TestBed.configureTestingModule({ providers: [provideFormField(withFieldSkin('fill'))] });
      const fixture = TestBed.createComponent(BareDefaultHost);
      fixture.detectChanges();
      expect(skinAttrOf(fixture)).toBe('fill');
    });

    it('applies inside a field whose own skin is unset', () => {
      TestBed.configureTestingModule({ providers: [provideFormField(withFieldSkin('bare'))] });
      const fixture = TestBed.createComponent(InFieldHost);
      fixture.detectChanges();
      expect(skinAttrOf(fixture)).toBe('bare');
    });

    it('loses to the field skin', () => {
      TestBed.configureTestingModule({ providers: [provideFormField(withFieldSkin('bare'))] });
      const fixture = TestBed.createComponent(InFieldHost);
      fixture.componentInstance.fieldSkin.set('fill');
      fixture.detectChanges();
      expect(skinAttrOf(fixture)).toBe('fill');
    });

    it('is the config value the directive reads', () => {
      TestBed.configureTestingModule({ providers: [provideFormField(withFieldSkin('fill'))] });
      expect(TestBed.inject(CNGX_FORM_FIELD_CONFIG).skin).toBe('fill');
    });
  });

  describe('inside a CngxFieldBox', () => {
    @Component({
      template: `
        <span cngxFieldBox class="outer" [skin]="boxSkin()">
          <input cngxInput class="direct" [skin]="ownSkin()" />
          <span><input cngxInput class="wrapped" /></span>
          <cngx-select class="select" />
          <span cngxFieldBox class="inner" skin="fill"></span>
        </span>
        <input cngxInput class="plain" />
      `,
      imports: [CngxFieldBox, CngxInput, CngxSelect],
    })
    class BoxHost {
      readonly boxSkin = signal<'outline' | 'fill' | 'bare' | undefined>('fill');
      readonly ownSkin = signal<'outline' | 'fill' | 'bare' | undefined>('fill');
    }

    function skinOf(fixture: { nativeElement: HTMLElement }, selector: string): string | null {
      return fixture.nativeElement.querySelector(selector)!.getAttribute('data-skin');
    }

    it('resolves a direct-child control to bare regardless of its own input', () => {
      const fixture = TestBed.createComponent(BoxHost);
      fixture.detectChanges();
      expect(skinOf(fixture, '.direct')).toBe('bare');
      fixture.componentInstance.ownSkin.set('outline');
      fixture.detectChanges();
      expect(skinOf(fixture, '.direct')).toBe('bare');
    });

    it('lets a control behind a wrapper element follow the cascade', () => {
      TestBed.configureTestingModule({ providers: [provideFormField(withFieldSkin('fill'))] });
      const fixture = TestBed.createComponent(BoxHost);
      fixture.detectChanges();
      expect(skinOf(fixture, '.wrapped')).toBe('fill');
    });

    it('resolves a direct-child cngx-select to bare', () => {
      const fixture = TestBed.createComponent(BoxHost);
      fixture.detectChanges();
      expect(skinOf(fixture, '.select')).toBe('bare');
    });

    it('writes outline on the box itself', () => {
      const fixture = TestBed.createComponent(BoxHost);
      fixture.componentInstance.boxSkin.set('outline');
      fixture.detectChanges();
      expect(skinOf(fixture, '.outer')).toBe('outline');
      fixture.componentInstance.boxSkin.set(undefined);
      fixture.detectChanges();
      expect(skinOf(fixture, '.outer')).toBe('outline');
    });

    it('writes nothing on a plain control outside any box', () => {
      const fixture = TestBed.createComponent(BoxHost);
      fixture.detectChanges();
      expect(skinOf(fixture, '.plain')).toBeNull();
    });

    it('keeps the own resolved skin on a box inside a box', () => {
      const fixture = TestBed.createComponent(BoxHost);
      fixture.componentInstance.boxSkin.set('bare');
      fixture.detectChanges();
      expect(skinOf(fixture, '.inner')).toBe('fill');
    });

    it('creates a cngxInput inside a box without a circular-dependency error', () => {
      @Component({
        template: `<span cngxFieldBox><input cngxInput /></span>`,
        imports: [CngxFieldBox, CngxInput],
      })
      class Host {}
      expect(() => TestBed.createComponent(Host).detectChanges()).not.toThrow();
    });
  });
});
