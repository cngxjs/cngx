import {
  Component,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  runInInjectionContext,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createResizeObserverMock, type ResizeObserverMock } from '@cngx/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxContainer } from './container.directive';
import {
  CNGX_CONTAINER_SIZE,
  type CngxContainerSize,
  createContainerSize,
  injectContainerSize,
} from './container-size';

let roMock: ResizeObserverMock;

function makeEntry(inlineSize: number, blockSize = 40): ResizeObserverEntry {
  return {
    borderBoxSize: [{ inlineSize, blockSize }],
    contentBoxSize: [{ inlineSize, blockSize }],
    devicePixelContentBoxSize: [],
    contentRect: { width: inlineSize, height: blockSize } as DOMRectReadOnly,
    target: document.createElement('div'),
  } as unknown as ResizeObserverEntry;
}

/** jsdom resolves no custom properties; stub the read the container performs. */
function stubComputedStyle(values: Record<string, string>): void {
  vi.spyOn(window, 'getComputedStyle').mockImplementation(
    () =>
      ({
        getPropertyValue: (name: string) => values[name] ?? '',
      }) as unknown as CSSStyleDeclaration,
  );
}

function makeContainerSize(element = document.createElement('div')): CngxContainerSize {
  const injector = TestBed.inject(Injector);
  return runInInjectionContext(injector, () =>
    createContainerSize(element, TestBed.inject(DestroyRef), window),
  );
}

describe('createContainerSize', () => {
  beforeEach(() => {
    roMock = createResizeObserverMock();
    roMock.install(window);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('is not ready and reports zero before the first observation', () => {
    const size = makeContainerSize();
    expect(size.isReady()).toBe(false);
    expect(size.inlineSize()).toBe(0);
    expect(size.blockSize()).toBe(0);
  });

  it('follows the border-box size of every observation', () => {
    const size = makeContainerSize();
    roMock.triggerResize(makeEntry(480, 120));
    expect(size.inlineSize()).toBe(480);
    expect(size.blockSize()).toBe(120);
    expect(size.isReady()).toBe(true);

    roMock.triggerResize(makeEntry(1024, 200));
    expect(size.inlineSize()).toBe(1024);
  });

  it('observes the border box, matching what an inline-size query measures', () => {
    const element = document.createElement('div');
    makeContainerSize(element);
    expect(roMock.observe).toHaveBeenCalledWith(element, { box: 'border-box' });
  });

  it('reads a property as the empty string until the first observation', () => {
    stubComputedStyle({ '--wide': '1' });
    const size = makeContainerSize();
    expect(size.property('--wide')()).toBe('');
    roMock.triggerResize(makeEntry(800));
    expect(size.property('--wide')()).toBe('1');
  });

  it('re-reads the property on every resize', () => {
    const values: Record<string, string> = { '--wide': '0' };
    stubComputedStyle(values);
    const size = makeContainerSize();
    const wide = size.property('--wide');

    roMock.triggerResize(makeEntry(400));
    expect(wide()).toBe('0');

    values['--wide'] = '1';
    roMock.triggerResize(makeEntry(1200));
    expect(wide()).toBe('1');
  });

  it('returns the same signal for the same name and target', () => {
    const size = makeContainerSize();
    expect(size.property('--wide')).toBe(size.property('--wide'));
  });

  it('keeps separate signals per target element', () => {
    const size = makeContainerSize();
    const child = document.createElement('span');
    expect(size.property('--wide')).not.toBe(size.property('--wide', child));
  });

  it('reads a pseudo-element of the container when asked', () => {
    const container = document.createElement('div');
    const spy = vi
      .spyOn(window, 'getComputedStyle')
      .mockReturnValue({ getPropertyValue: () => '1' } as unknown as CSSStyleDeclaration);

    const size = makeContainerSize(container);
    roMock.triggerResize(makeEntry(900));
    size.property('--narrow', container, '::after')();

    expect(spy).toHaveBeenCalledWith(container, '::after');
  });

  it('keeps separate signals for a pseudo-element and the element itself', () => {
    const size = makeContainerSize();
    expect(size.property('--narrow')).not.toBe(size.property('--narrow', undefined, '::after'));
  });

  it('returns the same signal for the same target, pseudo and name', () => {
    const size = makeContainerSize();
    expect(size.property('--narrow', undefined, '::after')).toBe(
      size.property('--narrow', undefined, '::after'),
    );
  });

  it('reads the property on the passed descendant, not on the container', () => {
    const container = document.createElement('div');
    const child = document.createElement('span');
    const spy = vi
      .spyOn(window, 'getComputedStyle')
      .mockReturnValue({ getPropertyValue: () => '1' } as unknown as CSSStyleDeclaration);

    const size = makeContainerSize(container);
    roMock.triggerResize(makeEntry(900));
    size.property('--wide', child)();

    expect(spy).toHaveBeenCalledWith(child, null);
  });
});

@Component({
  selector: 'cngx-container-consumer',
  standalone: true,
  template: '',
})
class ContainerConsumer {
  readonly size = injectContainerSize();
  readonly host = inject(ElementRef).nativeElement as Element;
}

@Component({
  standalone: true,
  imports: [CngxContainer, ContainerConsumer],
  template: '<div cngxContainer><cngx-container-consumer /></div>',
})
class WithAncestorHost {}

@Component({
  standalone: true,
  imports: [ContainerConsumer],
  template: '<cngx-container-consumer />',
})
class WithoutAncestorHost {}

describe('injectContainerSize', () => {
  beforeEach(() => {
    roMock = createResizeObserverMock();
    roMock.install(window);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('resolves the ancestor container', () => {
    const fixture = TestBed.createComponent(WithAncestorHost);
    fixture.detectChanges();

    const wrapper = fixture.nativeElement.querySelector('[cngxContainer]') as HTMLElement;
    const consumer = fixture.debugElement.children[0].children[0]
      .componentInstance as ContainerConsumer;
    const provided = fixture.debugElement.children[0].injector.get(CNGX_CONTAINER_SIZE);

    expect(consumer.size).toBe(provided);
    expect(roMock.observe).toHaveBeenCalledWith(wrapper, { box: 'border-box' });
  });

  it('falls back to the host element when no ancestor declares a container', () => {
    const fixture = TestBed.createComponent(WithoutAncestorHost);
    fixture.detectChanges();

    const consumer = fixture.debugElement.children[0].componentInstance as ContainerConsumer;
    expect(roMock.observe).toHaveBeenCalledWith(consumer.host, { box: 'border-box' });

    roMock.triggerResize(makeEntry(320));
    expect(consumer.size.inlineSize()).toBe(320);
  });
});
