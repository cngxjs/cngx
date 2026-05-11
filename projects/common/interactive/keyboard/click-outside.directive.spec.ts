import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxClickOutside } from './click-outside.directive';

@Component({
  template: `
    <div cngxClickOutside [enabled]="enabled()" (clickOutside)="onOutside($event)">
      <span class="inside"></span>
    </div>
    <button class="outside"></button>
  `,
  imports: [CngxClickOutside],
})
class TestHost {
  enabled = signal(true);
  onOutside = vi.fn();
}

describe('CngxClickOutside', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [TestHost] }));

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    return { fixture, host };
  }

  function dispatch(target: Element, type = 'pointerdown') {
    target.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true }));
  }

  it('does not emit when clicking the host element', () => {
    const { fixture, host } = setup();
    const hostEl = fixture.debugElement.query(By.css('div')).nativeElement;
    dispatch(hostEl);
    expect(host.onOutside).not.toHaveBeenCalled();
  });

  it('does not emit when clicking a descendant', () => {
    const { fixture, host } = setup();
    const inside = fixture.debugElement.query(By.css('.inside')).nativeElement;
    dispatch(inside);
    expect(host.onOutside).not.toHaveBeenCalled();
  });

  it('emits when clicking outside the host', () => {
    const { fixture, host } = setup();
    const outside = fixture.debugElement.query(By.css('.outside')).nativeElement;
    dispatch(outside);
    expect(host.onOutside).toHaveBeenCalledTimes(1);
  });

  it('does not emit when enabled is false', () => {
    const { fixture, host } = setup();
    host.enabled.set(false);
    fixture.detectChanges();
    const outside = fixture.debugElement.query(By.css('.outside')).nativeElement;
    dispatch(outside);
    expect(host.onOutside).not.toHaveBeenCalled();
  });

  it('does not emit after the component is destroyed', () => {
    const { fixture, host } = setup();
    const outside = fixture.debugElement.query(By.css('.outside')).nativeElement;
    fixture.destroy();
    dispatch(outside);
    expect(host.onOutside).not.toHaveBeenCalled();
  });
});
