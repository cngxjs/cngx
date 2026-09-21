import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { createResizeObserverMock, type ResizeObserverMock } from '@cngx/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CNGX_CONTAINER_SIZE } from './container-size';
import { CngxContainer } from './container.directive';

let roMock: ResizeObserverMock;

@Component({
  standalone: true,
  imports: [CngxContainer],
  template: '<div cngxContainer></div>',
})
class TestHost {}

describe('CngxContainer', () => {
  beforeEach(() => {
    roMock = createResizeObserverMock();
    roMock.install(window);
    TestBed.configureTestingModule({ imports: [TestHost] });
  });

  afterEach(() => vi.unstubAllGlobals());

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const debugEl = fixture.debugElement.query(By.directive(CngxContainer));
    return {
      fixture,
      element: debugEl.nativeElement as HTMLElement,
      directive: debugEl.injector.get(CngxContainer),
      provided: debugEl.injector.get(CNGX_CONTAINER_SIZE),
    };
  }

  it('declares the host as an inline-size container', () => {
    const { element } = setup();
    expect(element.style.containerType).toBe('inline-size');
  });

  it('sets no container-name - the name belongs in the stylesheet', () => {
    const { element } = setup();
    expect(element.style.containerName).toBe('');
  });

  it('provides itself as CNGX_CONTAINER_SIZE', () => {
    const { directive, provided } = setup();
    expect(provided).toBe(directive);
  });

  it('exposes the observed size', () => {
    const { directive } = setup();
    expect(directive.isReady()).toBe(false);

    roMock.triggerResize({
      borderBoxSize: [{ inlineSize: 768, blockSize: 96 }],
    } as unknown as ResizeObserverEntry);

    expect(directive.inlineSize()).toBe(768);
    expect(directive.blockSize()).toBe(96);
    expect(directive.isReady()).toBe(true);
  });

  it('disconnects the observer on destroy', () => {
    const { fixture } = setup();
    const before = roMock.disconnect.mock.calls.length;
    fixture.destroy();
    expect(roMock.disconnect.mock.calls.length).toBe(before + 1);
  });
});
