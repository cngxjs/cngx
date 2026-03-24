import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';
import { CngxFormField } from './form-field.component';
import { CngxLabel } from './label.directive';
import { CngxRequired } from './required.component';
import { createMockField, type MockFieldRef } from './testing/mock-field';
import type { CngxFieldAccessor } from './models';

@Component({
  template: `
    <cngx-form-field [field]="field()">
      <label cngxLabel>Name
        <cngx-required>
          <ng-template><span class="custom-dot" style="display:inline-block;width:6px;height:6px;background:red;border-radius:50%"></span></ng-template>
        </cngx-required>
      </label>
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxLabel, CngxRequired],
})
class CustomTplHost {
  field = signal<CngxFieldAccessor>(createMockField({ name: 'name' }).accessor);
}

@Component({
  template: `
    <cngx-form-field [field]="field()">
      <label cngxLabel>Name <cngx-required /></label>
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxLabel, CngxRequired],
})
class DefaultHost {
  field = signal<CngxFieldAccessor>(createMockField({ name: 'name' }).accessor);
}

@Component({
  template: `
    <cngx-form-field [field]="field()">
      <label cngxLabel>Name <cngx-required marker="(Pflichtfeld)" /></label>
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxLabel, CngxRequired],
})
class CustomMarkerHost {
  field = signal<CngxFieldAccessor>(createMockField({ name: 'name', required: true }).accessor);
}

describe('CngxRequired', () => {
  describe('default marker', () => {
    let fixture: ReturnType<typeof TestBed.createComponent<DefaultHost>>;
    let ref: MockFieldRef;
    let requiredEl: HTMLElement;

    beforeEach(() => {
      const mock = createMockField({ name: 'name' });
      ref = mock.ref;

      TestBed.configureTestingModule({ imports: [DefaultHost] });
      fixture = TestBed.createComponent(DefaultHost);
      fixture.componentInstance.field.set(mock.accessor);
      fixture.detectChanges();
      TestBed.flushEffects();

      requiredEl = fixture.debugElement.query(By.directive(CngxRequired)).nativeElement;
    });

    it('has aria-hidden=true', () => {
      expect(requiredEl.getAttribute('aria-hidden')).toBe('true');
    });

    it('does not render marker when not required', () => {
      expect(requiredEl.textContent?.trim()).toBe('');
    });

    it('renders * when required', () => {
      ref.required.set(true);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(requiredEl.textContent?.trim()).toBe('*');
    });

    it('hides marker when required becomes false', () => {
      ref.required.set(true);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(requiredEl.textContent?.trim()).toBe('*');

      ref.required.set(false);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(requiredEl.textContent?.trim()).toBe('');
    });
  });

  describe('custom marker', () => {
    it('renders custom marker text', () => {
      const mock = createMockField({ name: 'name', required: true });

      TestBed.configureTestingModule({ imports: [CustomMarkerHost] });
      const fixture = TestBed.createComponent(CustomMarkerHost);
      fixture.componentInstance.field.set(mock.accessor);
      fixture.detectChanges();
      TestBed.flushEffects();

      const el = fixture.debugElement.query(By.directive(CngxRequired)).nativeElement as HTMLElement;
      expect(el.textContent?.trim()).toBe('(Pflichtfeld)');
      expect(el.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('custom template', () => {
    it('renders custom template instead of text marker', () => {
      const mock = createMockField({ name: 'name', required: true });

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ imports: [CustomTplHost] });
      const fixture = TestBed.createComponent(CustomTplHost);
      fixture.componentInstance.field.set(mock.accessor);
      fixture.detectChanges();
      TestBed.flushEffects();

      const el = fixture.debugElement.query(By.directive(CngxRequired)).nativeElement as HTMLElement;
      expect(el.querySelector('.custom-dot')).not.toBeNull();
      // The default text marker (*) should not be present — only the custom template
      expect(el.textContent).not.toContain('*');
    });

    it('hides custom template when not required', () => {
      const mock = createMockField({ name: 'name', required: false });

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ imports: [CustomTplHost] });
      const fixture = TestBed.createComponent(CustomTplHost);
      fixture.componentInstance.field.set(mock.accessor);
      fixture.detectChanges();
      TestBed.flushEffects();

      const el = fixture.debugElement.query(By.directive(CngxRequired)).nativeElement as HTMLElement;
      expect(el.querySelector('.custom-dot')).toBeNull();
    });
  });
});
