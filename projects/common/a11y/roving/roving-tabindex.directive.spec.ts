import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { provideDirection } from '@cngx/core';

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

  describe('consumeNavigationKey() (#135)', () => {
    it('reads true after a navigation key moved focus, then resets to false', () => {
      const { container, dir } = setup();
      container.triggerEventHandler('keydown', new KeyboardEvent('keydown', { key: 'ArrowRight' }));
      expect(dir.consumeNavigationKey()).toBe(true);
      expect(dir.consumeNavigationKey()).toBe(false);
    });

    it('stays false when no navigation key has fired', () => {
      const { dir } = setup();
      expect(dir.consumeNavigationKey()).toBe(false);
    });

    it('stays false when a navigation key did not move the active index', () => {
      // ArrowLeft at index 0 with loop=false: nextIndex === current, no focus move.
      const { container, dir, fixture } = setup();
      fixture.componentInstance.loop.set(false);
      fixture.detectChanges();
      container.triggerEventHandler('keydown', new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
      expect(dir.consumeNavigationKey()).toBe(false);
    });
  });
});

@Component({
  template: `
    <div
      cngxRovingTabindex
      orientation="vertical"
      [virtualCount]="virtualCount()"
      #rv="cngxRovingTabindex"
    >
      @for (item of renderedItems(); track item.index) {
        <button cngxRovingItem [attr.data-cngx-recycle-index]="item.index">
          Item {{ item.index }}
        </button>
      }
    </div>
  `,
  imports: [CngxRovingTabindex, CngxRovingItem],
})
class VirtualTestHost {
  readonly virtualCount = signal(100);
  readonly renderedItems = signal(Array.from({ length: 10 }, (_, i) => ({ index: i })));
}

describe('CngxRovingTabindex - virtual mode', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [VirtualTestHost] }));

  function setupVirtual() {
    const fixture = TestBed.createComponent(VirtualTestHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const container = fixture.debugElement.query(By.directive(CngxRovingTabindex));
    const dir = container.injector.get(CngxRovingTabindex);
    const buttons = () => fixture.debugElement.queryAll(By.css('button'));
    return { fixture, container, dir, buttons };
  }

  function tabindex(el: { nativeElement: HTMLElement }): string {
    return el.nativeElement.getAttribute('tabindex') ?? '';
  }

  it('sets tabindex by data-cngx-recycle-index, not array position', () => {
    const { buttons } = setupVirtual();
    // First item has data-cngx-recycle-index="0" and activeIndex defaults to 0
    expect(tabindex(buttons()[0])).toBe('0');
    expect(tabindex(buttons()[1])).toBe('-1');
  });

  it('navigates with ArrowDown using virtualCount bounds', () => {
    const { container, dir, fixture } = setupVirtual();
    container.triggerEventHandler('keydown', new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(dir.activeIndex()).toBe(1);
  });

  it('Home jumps to index 0 in virtual mode', () => {
    const { container, dir, fixture } = setupVirtual();
    dir.activeIndex.set(50);
    TestBed.flushEffects();
    fixture.detectChanges();
    container.triggerEventHandler('keydown', new KeyboardEvent('keydown', { key: 'Home' }));
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(dir.activeIndex()).toBe(0);
  });

  it('End jumps to virtualCount - 1 in virtual mode', () => {
    const { container, dir, fixture } = setupVirtual();
    container.triggerEventHandler('keydown', new KeyboardEvent('keydown', { key: 'End' }));
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(dir.activeIndex()).toBe(99);
  });

  it('sets pendingFocus when target is not in the DOM', () => {
    const { container, dir, fixture } = setupVirtual();
    // Navigate to index 9 (last rendered item)
    dir.activeIndex.set(9);
    TestBed.flushEffects();
    fixture.detectChanges();
    // Arrow down → index 10, which is NOT in the DOM
    container.triggerEventHandler('keydown', new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(dir.activeIndex()).toBe(10);
    expect(dir.pendingFocus()).toBe(10);
  });

  it('does not set pendingFocus when target is in the DOM', () => {
    const { container, dir, fixture } = setupVirtual();
    container.triggerEventHandler('keydown', new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(dir.activeIndex()).toBe(1);
    expect(dir.pendingFocus()).toBeNull();
  });

  it('clears pendingFocus via clearPendingFocus()', () => {
    const { container, dir, fixture } = setupVirtual();
    dir.activeIndex.set(9);
    TestBed.flushEffects();
    fixture.detectChanges();
    container.triggerEventHandler('keydown', new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    TestBed.flushEffects();
    expect(dir.pendingFocus()).toBe(10);
    dir.clearPendingFocus();
    expect(dir.pendingFocus()).toBeNull();
  });

  it('does not clamp activeIndex to contentChildren length in virtual mode', () => {
    const { dir, fixture } = setupVirtual();
    // 10 items in DOM, but virtualCount is 100 - activeIndex 50 should not be clamped
    dir.activeIndex.set(50);
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(dir.activeIndex()).toBe(50);
  });

  it('loops in virtual mode when loop=true', () => {
    const { container, dir, fixture } = setupVirtual();
    dir.activeIndex.set(99);
    TestBed.flushEffects();
    fixture.detectChanges();
    container.triggerEventHandler('keydown', new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(dir.activeIndex()).toBe(0);
  });
});

describe('CngxRovingTabindex under dir=rtl', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [provideDirection('rtl')],
    }),
  );

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

  it('moves focus backward on ArrowRight (horizontal reading order is reversed)', () => {
    const { container, dir, buttons, fixture } = setup();
    dir.activeIndex.set(2);
    TestBed.flushEffects();
    fixture.detectChanges();
    container.triggerEventHandler('keydown', new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(tabindex(buttons[1])).toBe('0');
  });

  it('moves focus forward on ArrowLeft (horizontal reading order is reversed)', () => {
    const { container, buttons, fixture } = setup();
    container.triggerEventHandler('keydown', new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(tabindex(buttons[0])).toBe('-1');
    expect(tabindex(buttons[1])).toBe('0');
  });

  it('leaves the vertical axis direction-invariant (ArrowDown still advances)', () => {
    const { container, buttons, fixture } = setup();
    fixture.componentInstance.orientation.set('vertical');
    fixture.detectChanges();
    container.triggerEventHandler('keydown', new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(tabindex(buttons[1])).toBe('0');
  });
});

/* --- Keyboard hygiene: modifiers, focusin, clamps ------------------------ */

@Component({
  template: `
    <div cngxRovingTabindex orientation="horizontal" #rv="cngxRovingTabindex">
      @for (item of items(); track item.label) {
        <button cngxRovingItem [cngxRovingItemDisabled]="item.disabled">
          {{ item.label }}
        </button>
      }
    </div>
  `,
  imports: [CngxRovingTabindex, CngxRovingItem],
})
class DynamicHost {
  readonly items = signal<Array<{ label: string; disabled: boolean }>>([
    { label: 'One', disabled: false },
    { label: 'Two', disabled: false },
    { label: 'Three', disabled: false },
  ]);
}

describe('CngxRovingTabindex - keyboard hygiene', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [DynamicHost] }));

  function setup() {
    const fixture = TestBed.createComponent(DynamicHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const container = fixture.debugElement.query(By.directive(CngxRovingTabindex));
    const dir = container.injector.get(CngxRovingTabindex);
    const buttons = () => fixture.debugElement.queryAll(By.css('button'));
    return { fixture, container, dir, buttons };
  }

  function tabindex(el: { nativeElement: HTMLElement }): string {
    return el.nativeElement.getAttribute('tabindex') ?? '';
  }

  it('ignores arrow keys with ctrl/meta/alt held (browser shortcuts pass through)', () => {
    const { container, dir } = setup();
    for (const modifier of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }]) {
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight', ...modifier });
      container.triggerEventHandler('keydown', event);
      TestBed.flushEffects();
      expect(dir.activeIndex()).toBe(0);
      expect(event.defaultPrevented).toBe(false);
    }
  });

  it('follows real focus via focusin (pointer click moves the tab stop)', () => {
    const { fixture, dir, buttons } = setup();
    buttons()[2].nativeElement.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(dir.activeIndex()).toBe(2);
    expect(tabindex(buttons()[2])).toBe('0');
    expect(tabindex(buttons()[0])).toBe('-1');
  });

  it('falls back to the first enabled item when the initial target is disabled', () => {
    const { fixture, dir, buttons } = setup();
    fixture.componentInstance.items.set([
      { label: 'One', disabled: true },
      { label: 'Two', disabled: false },
      { label: 'Three', disabled: false },
    ]);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(tabindex(buttons()[0])).toBe('-1');
    expect(tabindex(buttons()[1])).toBe('0');
    expect(dir.activeIndex()).toBe(1);
  });

  it('clamps the activeIndex model when the item list shrinks below it', () => {
    const { fixture, dir, buttons } = setup();
    dir.activeIndex.set(2);
    TestBed.flushEffects();
    fixture.detectChanges();
    fixture.componentInstance.items.set([
      { label: 'One', disabled: false },
      { label: 'Two', disabled: false },
    ]);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(dir.activeIndex()).toBe(1);
    expect(tabindex(buttons()[1])).toBe('0');
  });

  it('keeps the activeIndex model untouched while the list is empty', () => {
    const { fixture, dir } = setup();
    dir.activeIndex.set(2);
    TestBed.flushEffects();
    fixture.detectChanges();
    fixture.componentInstance.items.set([]);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(dir.activeIndex()).toBe(2);
  });
});

describe('CngxRovingTabindex - item identity', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [DynamicHost] }));

  function setup() {
    const fixture = TestBed.createComponent(DynamicHost);
    fixture.componentInstance.items.set(
      ['One', 'Two', 'Three', 'Four'].map((label) => ({ label, disabled: false })),
    );
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const container = fixture.debugElement.query(By.directive(CngxRovingTabindex));
    const dir = container.injector.get(CngxRovingTabindex);
    const buttons = () => fixture.debugElement.queryAll(By.css('button'));
    const settle = (): void => {
      fixture.detectChanges();
      TestBed.flushEffects();
      fixture.detectChanges();
    };
    return { fixture, container, dir, buttons, settle };
  }

  function label(el: { nativeElement: HTMLElement }): string {
    return el.nativeElement.textContent?.trim() ?? '';
  }

  it('keeps the tab stop on the active item when an item before it is removed', () => {
    const { fixture, container, dir, buttons, settle } = setup();
    dir.activeIndex.set(2);
    settle();
    fixture.componentInstance.items.update((items) => items.filter((i) => i.label !== 'One'));
    settle();

    expect(dir.activeIndex()).toBe(1);
    const stop = buttons().find((b) => b.nativeElement.getAttribute('tabindex') === '0');
    expect(stop && label(stop)).toBe('Three');

    container.triggerEventHandler(
      'keydown',
      new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true }),
    );
    settle();
    expect(label(buttons()[dir.activeIndex()])).toBe('Four');
  });

  it('follows the active item through a reorder', () => {
    const { fixture, dir, buttons, settle } = setup();
    dir.activeIndex.set(0);
    settle();
    fixture.componentInstance.items.update((items) => [...items].reverse());
    settle();

    expect(dir.activeIndex()).toBe(3);
    expect(label(buttons()[3])).toBe('One');
    expect(buttons()[3].nativeElement.getAttribute('tabindex')).toBe('0');
  });
});

describe('CngxRovingTabindex - disabled items', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [DynamicHost] }));

  function setup(disabled: string[]) {
    const fixture = TestBed.createComponent(DynamicHost);
    fixture.componentInstance.items.set(
      ['One', 'Two', 'Three', 'Four'].map((label) => ({
        label,
        disabled: disabled.includes(label),
      })),
    );
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const container = fixture.debugElement.query(By.directive(CngxRovingTabindex));
    const dir = container.injector.get(CngxRovingTabindex);
    const key = (k: string): void => {
      container.triggerEventHandler('keydown', new KeyboardEvent('keydown', { key: k }));
      TestBed.flushEffects();
      fixture.detectChanges();
    };
    return { dir, key };
  }

  it('skips a disabled item with the arrows in both directions', () => {
    const { dir, key } = setup(['Two']);
    key('ArrowRight');
    expect(dir.activeIndex()).toBe(2);
    key('ArrowLeft');
    expect(dir.activeIndex()).toBe(0);
  });

  it('lands Home and End on the first and last enabled item', () => {
    const { dir, key } = setup(['One', 'Four']);
    expect(dir.activeIndex()).toBe(1);
    key('End');
    expect(dir.activeIndex()).toBe(2);
    key('Home');
    expect(dir.activeIndex()).toBe(1);
  });

  it('wraps past disabled items at the ends when loop is on', () => {
    const { dir, key } = setup(['One']);
    dir.activeIndex.set(3);
    key('ArrowRight');
    expect(dir.activeIndex()).toBe(1);
  });
});

@Component({
  template: `
    <div cngxRovingTabindex orientation="horizontal" data-testid="toolbar">
      <button cngxRovingItem data-testid="bold">Bold</button>
      <input cngxRovingItem type="text" data-testid="text" />
      <input cngxRovingItem type="date" data-testid="date" />
      <div cngxRovingItem tabindex="-1" data-testid="group">
        <input type="range" data-testid="range" />
        <span role="slider" tabindex="0" aria-valuenow="1" data-testid="slider">Zoom</span>
      </div>
      <button cngxRovingItem data-testid="italic">Italic</button>
    </div>
  `,
  imports: [CngxRovingTabindex, CngxRovingItem],
})
class EditableToolbarHost {}

describe('CngxRovingTabindex - fields and nested widgets', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [EditableToolbarHost] }));

  function setup() {
    const fixture = TestBed.createComponent(EditableToolbarHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const container = fixture.debugElement.query(By.directive(CngxRovingTabindex));
    const dir = container.injector.get(CngxRovingTabindex);
    const root = fixture.nativeElement as HTMLElement;
    const byTestId = (id: string): HTMLElement =>
      root.querySelector(`[data-testid="${id}"]`) as HTMLElement;
    const press = (el: HTMLElement, key: string, init: KeyboardEventInit = {}): KeyboardEvent => {
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
      el.dispatchEvent(event);
      TestBed.flushEffects();
      fixture.detectChanges();
      return event;
    };
    return { dir, byTestId, press };
  }

  for (const field of ['text', 'date']) {
    it(`leaves the caret keys of a ${field} input item to the field`, () => {
      const { dir, byTestId, press } = setup();
      const index = field === 'text' ? 1 : 2;
      dir.activeIndex.set(index);
      for (const key of ['ArrowLeft', 'ArrowRight', 'Home', 'End']) {
        expect(press(byTestId(field), key).defaultPrevented, key).toBe(false);
        expect(dir.activeIndex(), key).toBe(index);
      }
    });
  }

  for (const widget of ['range', 'slider']) {
    it(`leaves the arrows of a nested ${widget} to it`, () => {
      const { dir, byTestId, press } = setup();
      dir.activeIndex.set(3);
      expect(press(byTestId(widget), 'ArrowRight').defaultPrevented).toBe(false);
      expect(dir.activeIndex()).toBe(3);
    });
  }

  it('ignores the keys of an IME composition', () => {
    const { dir, byTestId, press } = setup();
    expect(press(byTestId('bold'), 'ArrowRight', { isComposing: true }).defaultPrevented).toBe(
      false,
    );
    expect(dir.activeIndex()).toBe(0);
  });

  it('leaves a key a nested composite already handled alone', () => {
    const { dir, byTestId } = setup();
    const event = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true,
    });
    event.preventDefault();
    byTestId('bold').dispatchEvent(event);
    TestBed.flushEffects();
    expect(dir.activeIndex()).toBe(0);
  });

  it('still navigates from a plain button item', () => {
    const { dir, byTestId, press } = setup();
    expect(press(byTestId('bold'), 'ArrowRight').defaultPrevented).toBe(true);
    expect(dir.activeIndex()).toBe(1);
  });
});

describe('CngxRovingTabindex - server render', () => {
  beforeEach(() => {
    // afterNextRender reads the ngServerMode global, not PLATFORM_ID.
    vi.stubGlobal('ngServerMode', true);
    TestBed.configureTestingModule({ imports: [TestHost] });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('writes the tab stops without waiting for a browser render', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const buttons = fixture.debugElement.queryAll(By.css('button'));
    expect(buttons.map((b) => b.nativeElement.getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);
  });
});

describe('CngxRovingTabindex - virtual tab stop', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [VirtualTestHost] }));

  it('keeps one rendered item in the tab order while the active index is outside the window', () => {
    const fixture = TestBed.createComponent(VirtualTestHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const dir = fixture.debugElement
      .query(By.directive(CngxRovingTabindex))
      .injector.get(CngxRovingTabindex);
    dir.activeIndex.set(50);
    TestBed.flushEffects();
    fixture.detectChanges();

    const stops = fixture.debugElement
      .queryAll(By.css('button'))
      .filter((b) => b.nativeElement.getAttribute('tabindex') === '0');
    expect(stops.length).toBe(1);
    expect(stops[0].nativeElement.getAttribute('data-cngx-recycle-index')).toBe('9');
    expect(dir.activeIndex()).toBe(50);
  });
});
