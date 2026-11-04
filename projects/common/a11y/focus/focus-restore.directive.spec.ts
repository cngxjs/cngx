import { Component, Directive, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';
import { CNGX_FOCUS_RESTORE_DRIVER, CngxFocusRestore } from './focus-restore.directive';

@Component({
  template: `
    <button class="trigger">Trigger</button>
    @if (showPanel()) {
      <div cngxFocusRestore>Panel content</div>
    }
  `,
  imports: [CngxFocusRestore],
})
class TestHost {
  readonly showPanel = signal(false);
}

@Component({
  template: `
    <button class="trigger">Trigger</button>
    <button class="fallback" #fb>Fallback</button>
    @if (showPanel()) {
      <div cngxFocusRestore [fallback]="fb">Panel content</div>
    }
  `,
  imports: [CngxFocusRestore],
})
class FallbackHost {
  readonly showPanel = signal(false);
}

@Component({
  template: `
    <button class="trigger">Trigger</button>
    <button class="elsewhere">Elsewhere</button>
    @if (mounted()) {
      <div cngxFocusRestore [cngxFocusRestoreWhile]="open()">
        <button class="inside">Inside</button>
      </div>
    }
  `,
  imports: [CngxFocusRestore],
})
class WhileHost {
  readonly open = signal(false);
  readonly mounted = signal(true);
}

const driverActive = signal(false);

@Directive({
  selector: '[testRestoreDriver]',
  hostDirectives: [{ directive: CngxFocusRestore, inputs: ['cngxFocusRestoreWhile'] }],
  providers: [{ provide: CNGX_FOCUS_RESTORE_DRIVER, useExisting: TestRestoreDriver }],
})
class TestRestoreDriver {
  readonly focusRestoreActive = driverActive.asReadonly();
}

@Component({
  template: `
    <button class="trigger">Trigger</button>
    <button class="elsewhere">Elsewhere</button>
    <div testRestoreDriver [cngxFocusRestoreWhile]="inputOpen()">
      <button class="inside">Inside</button>
    </div>
  `,
  imports: [TestRestoreDriver],
})
class DriverHost {
  readonly inputOpen = signal(false);
}

describe('CngxFocusRestore', () => {
  describe('basic restore', () => {
    beforeEach(() => TestBed.configureTestingModule({ imports: [TestHost] }));

    it('restores focus to the previously focused element on destroy', () => {
      const fixture = TestBed.createComponent(TestHost);
      fixture.detectChanges();

      const trigger = fixture.debugElement.query(By.css('.trigger')).nativeElement as HTMLElement;
      trigger.focus();
      expect(document.activeElement).toBe(trigger);

      fixture.componentInstance.showPanel.set(true);
      fixture.detectChanges();

      const dir = fixture.debugElement.query(By.directive(CngxFocusRestore));
      expect(dir).toBeTruthy();

      fixture.componentInstance.showPanel.set(false);
      fixture.detectChanges();

      expect(document.activeElement).toBe(trigger);
    });
  });

  describe('fallback', () => {
    beforeEach(() => TestBed.configureTestingModule({ imports: [FallbackHost] }));

    it('focuses fallback when stored element is removed', () => {
      const fixture = TestBed.createComponent(FallbackHost);
      fixture.detectChanges();

      // No specific element focused - activeElement is body or fixture root
      fixture.componentInstance.showPanel.set(true);
      fixture.detectChanges();

      fixture.componentInstance.showPanel.set(false);
      fixture.detectChanges();

      const fallback = fixture.debugElement.query(By.css('.fallback')).nativeElement as HTMLElement;
      expect(document.activeElement).toBe(fallback);
    });
  });

  describe('cngxFocusRestoreWhile', () => {
    beforeEach(() => TestBed.configureTestingModule({ imports: [WhileHost] }));

    function setup() {
      const fixture = TestBed.createComponent(WhileHost);
      document.body.appendChild(fixture.nativeElement as HTMLElement);
      fixture.detectChanges();
      const q = (sel: string) =>
        fixture.debugElement.query(By.css(sel)).nativeElement as HTMLElement;
      return {
        fixture,
        q,
        set: (open: boolean) => {
          fixture.componentInstance.open.set(open);
          fixture.detectChanges();
        },
      };
    }

    it('restores to the element focused at the rising edge when focus is inside', () => {
      const { q, set } = setup();
      q('.trigger').focus();
      set(true);
      q('.inside').focus();

      set(false);

      expect(document.activeElement).toBe(q('.trigger'));
    });

    it('restores when focus dropped to body', () => {
      const { q, set } = setup();
      q('.trigger').focus();
      set(true);
      q('.inside').focus();
      q('.inside').blur();
      expect(document.activeElement).toBe(document.body);

      set(false);

      expect(document.activeElement).toBe(q('.trigger'));
    });

    it('keeps focus the user moved elsewhere', () => {
      const { q, set } = setup();
      q('.trigger').focus();
      set(true);
      q('.elsewhere').focus();

      set(false);

      expect(document.activeElement).toBe(q('.elsewhere'));
    });

    it('does not capture an element inside the host on the rising edge', () => {
      const { q, set } = setup();
      q('.trigger').focus();
      set(true);
      set(false);
      q('.inside').focus();
      set(true);
      set(false);

      expect(document.activeElement).toBe(q('.trigger'));
    });

    it('does not restore when destroyed while closed', () => {
      const { fixture, q, set } = setup();
      q('.trigger').focus();
      set(true);
      set(false);
      q('.elsewhere').focus();

      fixture.componentInstance.mounted.set(false);
      fixture.detectChanges();

      expect(document.activeElement).toBe(q('.elsewhere'));
    });

    it('restores when destroyed while open', () => {
      const { fixture, q, set } = setup();
      q('.trigger').focus();
      set(true);
      q('.inside').focus();

      fixture.componentInstance.mounted.set(false);
      fixture.detectChanges();

      expect(document.activeElement).toBe(q('.trigger'));
    });
  });

  describe('driver', () => {
    beforeEach(() => {
      driverActive.set(false);
      TestBed.configureTestingModule({ imports: [DriverHost] });
    });

    it('follows the driver edges', () => {
      const fixture = TestBed.createComponent(DriverHost);
      document.body.appendChild(fixture.nativeElement as HTMLElement);
      fixture.detectChanges();
      const trigger = fixture.debugElement.query(By.css('.trigger')).nativeElement as HTMLElement;
      const inside = fixture.debugElement.query(By.css('.inside')).nativeElement as HTMLElement;

      trigger.focus();
      driverActive.set(true);
      fixture.detectChanges();
      inside.focus();
      driverActive.set(false);
      fixture.detectChanges();

      expect(document.activeElement).toBe(trigger);
    });

    it('wins over the cngxFocusRestoreWhile input', () => {
      const fixture = TestBed.createComponent(DriverHost);
      fixture.detectChanges();
      const q = (sel: string) =>
        fixture.debugElement.query(By.css(sel)).nativeElement as HTMLElement;

      q('.trigger').focus();
      fixture.componentInstance.inputOpen.set(true);
      fixture.detectChanges();
      q('.inside').focus();
      fixture.componentInstance.inputOpen.set(false);
      fixture.detectChanges();

      expect(document.activeElement).toBe(q('.inside'));
    });
  });
});
