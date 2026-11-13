import { Component, Directive, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CNGX_CLICK_OUTSIDE_DRIVER, CngxClickOutside } from './click-outside.directive';

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

@Component({
  template: `
    <div [id]="hostId()" cngxClickOutside (clickOutside)="onOutside($event)">
      <span class="inside"></span>
    </div>
    <button class="single" aria-controls="panel"><span class="icon"></span></button>
    <button class="multi" aria-controls="other panel"></button>
    <button class="unrelated" aria-controls="other"></button>
  `,
  imports: [CngxClickOutside],
})
class ControllerHost {
  readonly hostId = signal<string | null>('panel');
  onOutside = vi.fn();
}

const driverEnabled = signal(false);

@Directive({
  selector: '[testOutsideDriver]',
  hostDirectives: [{ directive: CngxClickOutside, inputs: ['enabled'], outputs: ['clickOutside'] }],
  providers: [{ provide: CNGX_CLICK_OUTSIDE_DRIVER, useExisting: TestOutsideDriver }],
})
class TestOutsideDriver {
  readonly clickOutsideEnabled = driverEnabled.asReadonly();
}

@Component({
  template: `
    <div testOutsideDriver [enabled]="true" (clickOutside)="onOutside()"></div>
    <button class="outside"></button>
  `,
  imports: [TestOutsideDriver],
})
class DriverHost {
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

  describe('aria-controls owner', () => {
    beforeEach(() => TestBed.configureTestingModule({ imports: [ControllerHost] }));

    function setupController() {
      const fixture = TestBed.createComponent(ControllerHost);
      fixture.detectChanges();
      const q = (sel: string) => fixture.debugElement.query(By.css(sel)).nativeElement as Element;
      return { fixture, host: fixture.componentInstance, q };
    }

    it('ignores a press on the element whose aria-controls names the host', () => {
      const { host, q } = setupController();
      dispatch(q('.single'));
      expect(host.onOutside).not.toHaveBeenCalled();
    });

    it('ignores a press inside the controller', () => {
      const { host, q } = setupController();
      dispatch(q('.icon'));
      expect(host.onOutside).not.toHaveBeenCalled();
    });

    it('matches the host id in a space-separated aria-controls list', () => {
      const { host, q } = setupController();
      dispatch(q('.multi'));
      expect(host.onOutside).not.toHaveBeenCalled();
    });

    it('emits for a controller of another element', () => {
      const { host, q } = setupController();
      dispatch(q('.unrelated'));
      expect(host.onOutside).toHaveBeenCalledTimes(1);
    });

    it('gives a host without an id no exemption', () => {
      const { fixture, host, q } = setupController();
      host.hostId.set(null);
      fixture.detectChanges();
      dispatch(q('.single'));
      expect(host.onOutside).toHaveBeenCalledTimes(1);
    });
  });

  describe('driver', () => {
    beforeEach(() => {
      driverEnabled.set(false);
      TestBed.configureTestingModule({ imports: [DriverHost] });
    });

    it('wins over [enabled]', () => {
      const fixture = TestBed.createComponent(DriverHost);
      fixture.detectChanges();
      const outside = fixture.debugElement.query(By.css('.outside')).nativeElement as Element;

      dispatch(outside);
      expect(fixture.componentInstance.onOutside).not.toHaveBeenCalled();

      driverEnabled.set(true);
      dispatch(outside);
      expect(fixture.componentInstance.onOutside).toHaveBeenCalledTimes(1);
    });
  });
});
