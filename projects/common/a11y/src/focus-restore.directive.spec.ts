import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';
import { CngxFocusRestore } from './focus-restore.directive';

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

      // No specific element focused — activeElement is body or fixture root
      fixture.componentInstance.showPanel.set(true);
      fixture.detectChanges();

      fixture.componentInstance.showPanel.set(false);
      fixture.detectChanges();

      const fallback = fixture.debugElement.query(By.css('.fallback')).nativeElement as HTMLElement;
      expect(document.activeElement).toBe(fallback);
    });
  });
});
