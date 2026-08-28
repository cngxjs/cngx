import { Component, Directive, computed, inject, input, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CNGX_AD_ITEM, type ActiveDescendantItem, type CngxAdItemHandle } from './ad-item.token';
import { CngxActiveDescendant } from './active-descendant.directive';

/* --- Item harness: emits its own handle via CNGX_AD_ITEM ---------------- */

let itemCounter = 0;

@Directive({
  selector: '[testAdItem]',
  standalone: true,
  providers: [{ provide: CNGX_AD_ITEM, useExisting: TestAdItem }],
  host: {
    '[id]': 'id',
    '[class.active]': 'isActive()',
  },
})
class TestAdItem implements CngxAdItemHandle {
  readonly id = `test-ad-item-${itemCounter++}`;
  readonly value = input<unknown>(undefined);
  readonly label = input<string>('');
  readonly disabled = input<boolean>(false);
  private readonly ad = inject(CngxActiveDescendant, { optional: true });
  readonly isActive = () => this.ad?.activeId() === this.id;
}

@Component({
  template: `
    <div
      cngxActiveDescendant
      [orientation]="orientation()"
      [loop]="loop()"
      [typeahead]="typeahead()"
      [typeaheadDebounce]="typeaheadDebounce()"
      [autoHighlightFirst]="autoHighlightFirst()"
      [skipDisabled]="skipDisabled()"
      #ad="cngxActiveDescendant"
      tabindex="0"
    >
      @for (opt of options(); track opt.value) {
        <div
          testAdItem
          [value]="opt.value"
          [label]="opt.label"
          [disabled]="opt.disabled ?? false"
        >
          {{ opt.label }}
        </div>
      }
    </div>
  `,
  imports: [CngxActiveDescendant, TestAdItem],
})
class TestHost {
  readonly orientation = signal<'vertical' | 'horizontal'>('vertical');
  readonly loop = signal(true);
  readonly typeahead = signal(true);
  readonly typeaheadDebounce = signal(300);
  readonly autoHighlightFirst = signal(false);
  readonly skipDisabled = signal(true);
  readonly options = signal<Array<{ value: string; label: string; disabled?: boolean }>>([
    { value: 'a', label: 'Apple' },
    { value: 'b', label: 'Banana' },
    { value: 'c', label: 'Cherry' },
  ]);
}

function setup(): {
  fixture: ReturnType<typeof TestBed.createComponent<TestHost>>;
  host: HTMLElement;
  dir: CngxActiveDescendant;
  key: (k: string) => void;
} {
  const fixture = TestBed.createComponent(TestHost);
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
  const container = fixture.debugElement.query(By.directive(CngxActiveDescendant));
  const dir = container.injector.get(CngxActiveDescendant);
  const host = container.nativeElement as HTMLElement;
  const key = (k: string): void => {
    container.triggerEventHandler('keydown', new KeyboardEvent('keydown', { key: k }));
    TestBed.flushEffects();
    fixture.detectChanges();
  };
  return { fixture, host, dir, key };
}

describe('CngxActiveDescendant - registration & activeId', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TestHost] });
  });

  it('exposes no activeId by default', () => {
    const { dir } = setup();
    expect(dir.activeId()).toBeNull();
    expect(dir.activeItem()).toBeNull();
  });

  it('auto-highlights first when autoHighlightFirst=true', () => {
    TestBed.overrideComponent(TestHost, { set: { template: '' } });
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.autoHighlightFirst.set(true);
    // Reuse default template via forceReset path:
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [TestHost] });
    const fx = TestBed.createComponent(TestHost);
    fx.componentInstance.autoHighlightFirst.set(true);
    fx.detectChanges();
    TestBed.flushEffects();
    fx.detectChanges();
    const container = fx.debugElement.query(By.directive(CngxActiveDescendant));
    const dir = container.injector.get(CngxActiveDescendant);
    expect(dir.activeId()).not.toBeNull();
    expect(dir.activeItem()?.value).toBe('a');
  });

  it('reflects activeId on host via aria-activedescendant', () => {
    const { host, dir } = setup();
    dir.highlightFirst();
    TestBed.flushEffects();
    expect(host.getAttribute('aria-activedescendant')).toBe(dir.activeId());
  });
});

describe('CngxActiveDescendant - primitives', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TestHost] });
  });

  it('highlightNext moves forward', () => {
    const { dir } = setup();
    dir.highlightFirst();
    TestBed.flushEffects();
    dir.highlightNext();
    TestBed.flushEffects();
    expect(dir.activeItem()?.value).toBe('b');
  });

  it('highlightPrev moves backward', () => {
    const { dir } = setup();
    dir.highlightByIndex(2);
    TestBed.flushEffects();
    dir.highlightPrev();
    TestBed.flushEffects();
    expect(dir.activeItem()?.value).toBe('b');
  });

  it('highlightLast jumps to last', () => {
    const { dir } = setup();
    dir.highlightLast();
    TestBed.flushEffects();
    expect(dir.activeItem()?.value).toBe('c');
  });

  it('highlightByValue highlights matching item', () => {
    const { dir } = setup();
    dir.highlightByValue('c');
    TestBed.flushEffects();
    expect(dir.activeItem()?.value).toBe('c');
  });

  it('resetHighlight clears activeId', () => {
    const { dir } = setup();
    dir.highlightFirst();
    TestBed.flushEffects();
    dir.resetHighlight();
    TestBed.flushEffects();
    expect(dir.activeId()).toBeNull();
  });

  it('activateCurrent emits activated with the current value', () => {
    const { dir } = setup();
    const spy = vi.fn<(v: unknown) => void>();
    dir.activated.subscribe(spy);
    dir.highlightByValue('b');
    TestBed.flushEffects();
    dir.activateCurrent();
    expect(spy).toHaveBeenCalledWith('b');
  });

  it('activateCurrent is a no-op when no active item', () => {
    const { dir } = setup();
    const spy = vi.fn<(v: unknown) => void>();
    dir.activated.subscribe(spy);
    dir.activateCurrent();
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('CngxActiveDescendant - skipDisabled', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TestHost] });
  });

  it('skips disabled items on highlightNext', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.options.set([
      { value: 'a', label: 'Apple' },
      { value: 'b', label: 'Banana', disabled: true },
      { value: 'c', label: 'Cherry' },
    ]);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const dir = fixture.debugElement
      .query(By.directive(CngxActiveDescendant))
      .injector.get(CngxActiveDescendant);
    dir.highlightFirst();
    TestBed.flushEffects();
    dir.highlightNext();
    TestBed.flushEffects();
    expect(dir.activeItem()?.value).toBe('c');
  });

  it('highlightByValue on disabled item is rejected when skipDisabled=true', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.options.set([
      { value: 'a', label: 'Apple' },
      { value: 'b', label: 'Banana', disabled: true },
    ]);
    fixture.componentInstance.skipDisabled.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const dir = fixture.debugElement
      .query(By.directive(CngxActiveDescendant))
      .injector.get(CngxActiveDescendant);
    dir.highlightByValue('b');
    TestBed.flushEffects();
    expect(dir.activeItem()).toBeNull();
  });
});

describe('CngxActiveDescendant - keyboard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TestHost] });
  });

  it('ArrowDown moves next in vertical', () => {
    const { dir, key } = setup();
    dir.highlightFirst();
    TestBed.flushEffects();
    key('ArrowDown');
    expect(dir.activeItem()?.value).toBe('b');
  });

  it('ArrowUp moves prev in vertical', () => {
    const { dir, key } = setup();
    dir.highlightByIndex(2);
    TestBed.flushEffects();
    key('ArrowUp');
    expect(dir.activeItem()?.value).toBe('b');
  });

  it('Home jumps to first', () => {
    const { dir, key } = setup();
    dir.highlightLast();
    TestBed.flushEffects();
    key('Home');
    expect(dir.activeItem()?.value).toBe('a');
  });

  it('End jumps to last', () => {
    const { dir, key } = setup();
    dir.highlightFirst();
    TestBed.flushEffects();
    key('End');
    expect(dir.activeItem()?.value).toBe('c');
  });

  it('Enter activates current', () => {
    const { dir, key } = setup();
    const spy = vi.fn<(v: unknown) => void>();
    dir.activated.subscribe(spy);
    dir.highlightByValue('b');
    TestBed.flushEffects();
    key('Enter');
    expect(spy).toHaveBeenCalledWith('b');
  });

  it('loops from last to first when loop=true', () => {
    const { dir, key } = setup();
    dir.highlightLast();
    TestBed.flushEffects();
    key('ArrowDown');
    expect(dir.activeItem()?.value).toBe('a');
  });

  it('does not loop when loop=false', () => {
    const { fixture, dir, key } = setup();
    fixture.componentInstance.loop.set(false);
    fixture.detectChanges();
    dir.highlightLast();
    TestBed.flushEffects();
    key('ArrowDown');
    expect(dir.activeItem()?.value).toBe('c');
  });

  it('ignores vertical arrows in horizontal mode, handles horizontal', () => {
    const { fixture, dir, key } = setup();
    fixture.componentInstance.orientation.set('horizontal');
    fixture.detectChanges();
    dir.highlightFirst();
    TestBed.flushEffects();
    key('ArrowDown');
    expect(dir.activeItem()?.value).toBe('a');
    key('ArrowRight');
    expect(dir.activeItem()?.value).toBe('b');
  });
});

describe('CngxActiveDescendant - typeahead', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ imports: [TestHost] });
  });

  it('jumps to first label starting with typed character', () => {
    const { dir, key } = setup();
    key('b');
    expect(dir.activeItem()?.value).toBe('b');
  });

  it('chains characters within debounce window', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.options.set([
      { value: 'ca', label: 'Cabbage' },
      { value: 'ch', label: 'Cherry' },
    ]);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const container = fixture.debugElement.query(By.directive(CngxActiveDescendant));
    const dir = container.injector.get(CngxActiveDescendant);
    const press = (k: string): void => {
      container.triggerEventHandler('keydown', new KeyboardEvent('keydown', { key: k }));
      TestBed.flushEffects();
    };
    press('c');
    expect(dir.activeItem()?.value).toBe('ca');
    press('h');
    expect(dir.activeItem()?.value).toBe('ch');
  });

  it('clears buffer after debounce expires', () => {
    const { dir, key } = setup();
    key('c');
    expect(dir.activeItem()?.value).toBe('c');
    vi.advanceTimersByTime(400);
    // Next key starts a fresh buffer
    key('a');
    expect(dir.activeItem()?.value).toBe('a');
  });

  it('skips typeahead when typeahead=false', () => {
    const { fixture, dir, key } = setup();
    fixture.componentInstance.typeahead.set(false);
    fixture.detectChanges();
    key('b');
    expect(dir.activeItem()).toBeNull();
  });

  it('cycles through matches on repeated same-letter presses (APG)', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.options.set([
      { value: 'ap', label: 'Apple' },
      { value: 'av', label: 'Avocado' },
      { value: 'al', label: 'Almond' },
    ]);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const container = fixture.debugElement.query(By.directive(CngxActiveDescendant));
    const dir = container.injector.get(CngxActiveDescendant);
    const press = (k: string): void => {
      container.triggerEventHandler('keydown', new KeyboardEvent('keydown', { key: k }));
      TestBed.flushEffects();
    };
    press('a');
    expect(dir.activeItem()?.value).toBe('ap');
    press('a');
    expect(dir.activeItem()?.value).toBe('av');
    press('a');
    expect(dir.activeItem()?.value).toBe('al');
    press('a');
    expect(dir.activeItem()?.value).toBe('ap');
  });

  it('single character searches after the active item, wrapping past it', () => {
    const { dir, key } = setup();
    dir.highlightByValue('b');
    TestBed.flushEffects();
    // Active is Banana; 'a' must not stick on a match before the wrap point.
    key('a');
    expect(dir.activeItem()?.value).toBe('a');
  });
});

/* --- Virtual mode -------------------------------------------------------- */

@Component({
  template: `
    <div cngxActiveDescendant [virtualCount]="virtualCount()" tabindex="0">
      @for (it of rendered(); track it.id) {
        <div testAdItem [value]="it.id" [label]="it.label">
          {{ it.label }}
        </div>
      }
    </div>
  `,
  imports: [CngxActiveDescendant, TestAdItem],
})
class VirtualHost {
  readonly virtualCount = signal(100);
  readonly rendered = signal(
    Array.from({ length: 10 }, (_, i) => ({ id: i, label: `Item ${i}` })),
  );
}

describe('CngxActiveDescendant - virtual mode', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [VirtualHost] });
  });

  it('sets pendingHighlight when target is out of rendered range', () => {
    const fixture = TestBed.createComponent(VirtualHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const dir = fixture.debugElement
      .query(By.directive(CngxActiveDescendant))
      .injector.get(CngxActiveDescendant);
    dir.highlightByIndex(50);
    TestBed.flushEffects();
    expect(dir.pendingHighlight()).toBe(50);
  });

  it('clearPendingHighlight resets the signal', () => {
    const fixture = TestBed.createComponent(VirtualHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const dir = fixture.debugElement
      .query(By.directive(CngxActiveDescendant))
      .injector.get(CngxActiveDescendant);
    dir.highlightByIndex(50);
    TestBed.flushEffects();
    dir.clearPendingHighlight();
    expect(dir.pendingHighlight()).toBeNull();
  });

  it('does not set pendingHighlight when target is rendered', () => {
    const fixture = TestBed.createComponent(VirtualHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const dir = fixture.debugElement
      .query(By.directive(CngxActiveDescendant))
      .injector.get(CngxActiveDescendant);
    dir.highlightByIndex(3);
    TestBed.flushEffects();
    expect(dir.pendingHighlight()).toBeNull();
  });
});

/* --- Virtual window offset (recycler start > 0) -------------------------- */

@Component({
  template: `
    <div
      cngxActiveDescendant
      [items]="windowItems()"
      [virtualCount]="100"
      [windowStart]="start()"
      tabindex="0"
    ></div>
  `,
  imports: [CngxActiveDescendant],
})
class WindowHost {
  readonly start = signal(40);
  readonly windowItems = computed<ActiveDescendantItem[]>(() =>
    Array.from({ length: 10 }, (_, i) => {
      const abs = this.start() + i;
      return { id: `opt-${abs}`, value: abs, label: `Item ${abs}`, disabled: abs === 42 };
    }),
  );
}

describe('CngxActiveDescendant - virtual window offset', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [WindowHost] });
  });

  function setupWindow() {
    const fixture = TestBed.createComponent(WindowHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const container = fixture.debugElement.query(By.directive(CngxActiveDescendant));
    return {
      fixture,
      host: container.nativeElement as HTMLElement,
      dir: container.injector.get(CngxActiveDescendant),
    };
  }

  it('resolves absolute indices inside a shifted window to the right item id', () => {
    const { host, dir } = setupWindow();
    dir.highlightByIndex(45);
    TestBed.flushEffects();
    expect(dir.activeIndex()).toBe(45);
    expect(dir.activeId()).toBe('opt-45');
    expect(dir.pendingHighlight()).toBeNull();
    expect(host.getAttribute('aria-activedescendant')).toBe('opt-45');
  });

  it('treats absolute indices before the window as unrendered (pendingHighlight)', () => {
    const { dir } = setupWindow();
    dir.highlightByIndex(10);
    TestBed.flushEffects();
    expect(dir.activeIndex()).toBe(10);
    expect(dir.activeId()).toBeNull();
    expect(dir.pendingHighlight()).toBe(10);
  });

  it('rejects disabled items by absolute index inside the window', () => {
    const { dir } = setupWindow();
    dir.highlightByIndex(42);
    TestBed.flushEffects();
    expect(dir.activeIndex()).toBe(-1);
  });

  it('skips a disabled window item during arrow navigation', () => {
    const { dir } = setupWindow();
    dir.highlightByIndex(41);
    TestBed.flushEffects();
    dir.highlightNext();
    TestBed.flushEffects();
    expect(dir.activeIndex()).toBe(43);
  });

  it('highlightByValue maps the rendered match back to its absolute index', () => {
    const { dir } = setupWindow();
    dir.highlightByValue(47);
    TestBed.flushEffects();
    expect(dir.activeIndex()).toBe(47);
    expect(dir.activeId()).toBe('opt-47');
  });

  it('End targets virtualCount - 1 beyond the rendered window', () => {
    const { dir } = setupWindow();
    dir.highlightLast();
    TestBed.flushEffects();
    expect(dir.activeIndex()).toBe(99);
    expect(dir.pendingHighlight()).toBe(99);
  });

  it('clears pendingHighlight once the window scrolls the target into range', () => {
    const { fixture, host, dir } = setupWindow();
    dir.highlightLast();
    TestBed.flushEffects();
    expect(dir.pendingHighlight()).toBe(99);

    fixture.componentInstance.start.set(90);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(dir.pendingHighlight()).toBeNull();
    expect(dir.activeId()).toBe('opt-99');
    expect(host.getAttribute('aria-activedescendant')).toBe('opt-99');
  });

  it('typeahead matches rendered labels and sets the absolute index', () => {
    const { fixture } = setupWindow();
    const container = fixture.debugElement.query(By.directive(CngxActiveDescendant));
    const dir = container.injector.get(CngxActiveDescendant);
    container.triggerEventHandler(
      'keydown',
      new KeyboardEvent('keydown', { key: 'i' }),
    );
    TestBed.flushEffects();
    expect(dir.activeIndex()).toBe(40);
    expect(dir.activeId()).toBe('opt-40');
  });
});

/* --- highlighted emission contract --------------------------------------- */

@Component({
  template: `
    <div
      cngxActiveDescendant
      [items]="dynamicItems()"
      (highlighted)="emissions.push($event)"
      tabindex="0"
    ></div>
  `,
  imports: [CngxActiveDescendant],
})
class EmissionHost {
  readonly emissions: (ActiveDescendantItem | null)[] = [];
  readonly dynamicItems = signal<ActiveDescendantItem[]>([
    { id: 'x-1', value: 'x', label: 'Xray' },
    { id: 'y-1', value: 'y', label: 'Yankee' },
  ]);
}

describe('CngxActiveDescendant - highlighted emissions', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [EmissionHost] });
  });

  function setupEmissions() {
    const fixture = TestBed.createComponent(EmissionHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const dir = fixture.debugElement
      .query(By.directive(CngxActiveDescendant))
      .injector.get(CngxActiveDescendant);
    return { fixture, dir, emissions: fixture.componentInstance.emissions };
  }

  it('does not emit the initial null', () => {
    const { emissions } = setupEmissions();
    expect(emissions).toEqual([]);
  });

  it('does not re-emit when a re-render produces a fresh object for the same id', () => {
    const { fixture, dir, emissions } = setupEmissions();
    dir.highlightByValue('x');
    TestBed.flushEffects();
    expect(emissions).toHaveLength(1);
    expect(emissions[0]?.id).toBe('x-1');

    fixture.componentInstance.dynamicItems.set([
      { id: 'x-1', value: 'x', label: 'Xray' },
      { id: 'y-1', value: 'y', label: 'Yankee' },
    ]);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(emissions).toHaveLength(1);
  });

  it('still emits null when the highlight is reset after a highlight', () => {
    const { dir, emissions } = setupEmissions();
    dir.highlightByValue('y');
    TestBed.flushEffects();
    dir.resetHighlight();
    TestBed.flushEffects();
    expect(emissions).toHaveLength(2);
    expect(emissions[1]).toBeNull();
  });
});

/* --- aria-owns layout: options outside the host subtree ------------------ */

@Component({
  template: `
    <div
      cngxActiveDescendant
      [items]="items"
      aria-owns="owned-a owned-b"
      tabindex="0"
    ></div>
    <div id="owned-a">Alpha</div>
    <div id="owned-b">Beta</div>
  `,
  imports: [CngxActiveDescendant],
})
class AriaOwnsHost {
  readonly items: ActiveDescendantItem[] = [
    { id: 'owned-a', value: 'a', label: 'Alpha' },
    { id: 'owned-b', value: 'b', label: 'Beta' },
  ];
}

describe('CngxActiveDescendant - aria-owns scroll', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [AriaOwnsHost] });
  });

  it('scrolls an owned option outside the host subtree into view', async () => {
    const fixture = TestBed.createComponent(AriaOwnsHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const dir = fixture.debugElement
      .query(By.directive(CngxActiveDescendant))
      .injector.get(CngxActiveDescendant);
    const owned = fixture.nativeElement.querySelector('#owned-b') as HTMLElement;
    const scrollSpy = vi.fn();
    owned.scrollIntoView = scrollSpy;

    dir.highlightByIndex(1);
    TestBed.flushEffects();
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    expect(scrollSpy).toHaveBeenCalledWith({ block: 'nearest', inline: 'nearest' });
  });
});

/* --- Items input override ------------------------------------------------ */

@Component({
  template: `
    <div
      cngxActiveDescendant
      [items]="dynamicItems()"
      tabindex="0"
    ></div>
  `,
  imports: [CngxActiveDescendant],
})
class InputItemsHost {
  readonly dynamicItems = signal<ActiveDescendantItem[]>([
    { id: 'x-1', value: 'x', label: 'Xray' },
    { id: 'y-1', value: 'y', label: 'Yankee' },
  ]);
}

describe('CngxActiveDescendant - items input', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [InputItemsHost] });
  });

  it('uses items input when provided, ignoring contentChildren', () => {
    const fixture = TestBed.createComponent(InputItemsHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const dir = fixture.debugElement
      .query(By.directive(CngxActiveDescendant))
      .injector.get(CngxActiveDescendant);
    dir.highlightByValue('y');
    TestBed.flushEffects();
    expect(dir.activeId()).toBe('y-1');
    expect(dir.activeItem()?.label).toBe('Yankee');
  });
});
