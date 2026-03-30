import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';
import { CngxRovingItem, CngxRovingTabindex } from './roving-tabindex.directive';

@Component({
  template: `
    <div cngxRovingTabindex [orientation]="orientation()" [loop]="loop()" #rv="cngxRovingTabindex">
      <button cngxRovingItem>One</button>
      <button cngxRovingItem>Two</button>
      <button cngxRovingItem>Three</button>
    </div>
  `,
  imports: [CngxRovingTabindex, CngxRovingItem],
})
class TestHost {
  readonly orientation = signal<'horizontal' | 'vertical' | 'both'>('horizontal');
  readonly loop = signal(true);
}

describe('CngxRovingTabindex', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [TestHost] }));

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const container = fixture.debugElement.query(By.directive(CngxRovingTabindex));
    const dir = container.injector.get(CngxRovingTabindex);
    const buttons = fixture.debugElement.queryAll(By.css('button'));
    return { fixture, container, dir, buttons };
  }

  function tabindex(el: { nativeElement: HTMLElement }): string {
    return el.nativeElement.getAttribute('tabindex') ?? '';
  }

  it('sets tabindex="0" on first item and "-1" on others', () => {
    const { buttons } = setup();
    expect(tabindex(buttons[0])).toBe('0');
    expect(tabindex(buttons[1])).toBe('-1');
    expect(tabindex(buttons[2])).toBe('-1');
  });

  it('moves focus forward on ArrowRight (horizontal)', () => {
    const { container, buttons, fixture } = setup();
    container.triggerEventHandler('keydown', new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(tabindex(buttons[0])).toBe('-1');
    expect(tabindex(buttons[1])).toBe('0');
  });

  it('moves focus backward on ArrowLeft (horizontal)', () => {
    const { container, dir, buttons, fixture } = setup();
    dir.activeIndex.set(2);
    TestBed.flushEffects();
    fixture.detectChanges();
    container.triggerEventHandler('keydown', new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(tabindex(buttons[1])).toBe('0');
  });

  it('loops from last to first when loop=true', () => {
    const { container, dir, buttons, fixture } = setup();
    dir.activeIndex.set(2);
    TestBed.flushEffects();
    fixture.detectChanges();
    container.triggerEventHandler('keydown', new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(tabindex(buttons[0])).toBe('0');
  });

  it('does not loop when loop=false', () => {
    const { container, dir, buttons, fixture } = setup();
    fixture.componentInstance.loop.set(false);
    dir.activeIndex.set(2);
    TestBed.flushEffects();
    fixture.detectChanges();
    container.triggerEventHandler('keydown', new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(tabindex(buttons[2])).toBe('0');
  });

  it('Home jumps to first item', () => {
    const { container, dir, buttons, fixture } = setup();
    dir.activeIndex.set(2);
    TestBed.flushEffects();
    fixture.detectChanges();
    container.triggerEventHandler('keydown', new KeyboardEvent('keydown', { key: 'Home' }));
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(tabindex(buttons[0])).toBe('0');
  });

  it('End jumps to last item', () => {
    const { container, buttons, fixture } = setup();
    container.triggerEventHandler('keydown', new KeyboardEvent('keydown', { key: 'End' }));
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(tabindex(buttons[2])).toBe('0');
  });

  it('ignores ArrowDown/ArrowUp in horizontal mode', () => {
    const { container, buttons, fixture } = setup();
    container.triggerEventHandler('keydown', new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(tabindex(buttons[0])).toBe('0');
  });

  it('responds to ArrowDown/ArrowUp in vertical mode', () => {
    const { container, buttons, fixture } = setup();
    fixture.componentInstance.orientation.set('vertical');
    fixture.detectChanges();
    container.triggerEventHandler('keydown', new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(tabindex(buttons[1])).toBe('0');
  });

  it('responds to all arrows in both mode', () => {
    const { container, buttons, fixture } = setup();
    fixture.componentInstance.orientation.set('both');
    fixture.detectChanges();
    container.triggerEventHandler('keydown', new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(tabindex(buttons[1])).toBe('0');
    container.triggerEventHandler('keydown', new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(tabindex(buttons[0])).toBe('0');
  });
});
