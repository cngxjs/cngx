import { Component, signal, type Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxOption } from './option.directive';
import {
  CNGX_OPTION_INTERACTION_HOST,
  type CngxOptionInteractionHost,
} from './option-interaction-host';

class FakeInteractionHost implements CngxOptionInteractionHost {
  readonly activeIdSignal = signal<string | null>(null);
  readonly activeId: Signal<string | null> = this.activeIdSignal.asReadonly();
  readonly activateSpy = vi.fn<(value: unknown) => void>();
  readonly highlightSpy = vi.fn<(value: unknown) => void>();

  activate(value: unknown): void {
    this.activateSpy(value);
  }
  highlight(value: unknown): void {
    this.highlightSpy(value);
  }
}

@Component({
  template: `
    <div cngxOption value="a">A</div>
    <div cngxOption value="b">B</div>
    <div cngxOption value="c">C</div>
  `,
  imports: [CngxOption],
})
class ProjectedHost {}

describe('CNGX_OPTION_INTERACTION_HOST', () => {
  let host: FakeInteractionHost;

  beforeEach(() => {
    host = new FakeInteractionHost();
    TestBed.configureTestingModule({
      providers: [{ provide: CNGX_OPTION_INTERACTION_HOST, useValue: host }],
    });
  });

  function setup(): {
    fixture: ReturnType<typeof TestBed.createComponent<ProjectedHost>>;
    options: CngxOption[];
    elements: HTMLElement[];
  } {
    const fixture = TestBed.createComponent(ProjectedHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const debugEls = fixture.debugElement.queryAll(By.directive(CngxOption));
    return {
      fixture,
      options: debugEls.map((d) => d.injector.get(CngxOption)),
      elements: debugEls.map((d) => d.nativeElement as HTMLElement),
    };
  }

  it('isHighlighted reflects host.activeId when no AD is in scope', () => {
    const { fixture, options } = setup();

    expect(options[0].isHighlighted()).toBe(false);
    expect(options[1].isHighlighted()).toBe(false);

    host.activeIdSignal.set(options[1].id);
    TestBed.flushEffects();
    fixture.detectChanges();

    expect(options[0].isHighlighted()).toBe(false);
    expect(options[1].isHighlighted()).toBe(true);
  });

  it('host class .cngx-option--highlighted toggles via the host activeId', () => {
    const { fixture, options, elements } = setup();

    expect(elements[2].classList.contains('cngx-option--highlighted')).toBe(false);

    host.activeIdSignal.set(options[2].id);
    TestBed.flushEffects();
    fixture.detectChanges();

    expect(elements[2].classList.contains('cngx-option--highlighted')).toBe(true);
    expect(elements[0].classList.contains('cngx-option--highlighted')).toBe(false);
  });

  it('click calls host.activate with the option value', () => {
    const { elements } = setup();

    elements[1].click();

    expect(host.activateSpy).toHaveBeenCalledTimes(1);
    expect(host.activateSpy).toHaveBeenCalledWith('b');
    expect(host.highlightSpy).not.toHaveBeenCalled();
  });

  it('pointerenter calls host.highlight with the option value', () => {
    const { elements } = setup();

    elements[2].dispatchEvent(new Event('pointerenter', { bubbles: true }));

    expect(host.highlightSpy).toHaveBeenCalledTimes(1);
    expect(host.highlightSpy).toHaveBeenCalledWith('c');
    expect(host.activateSpy).not.toHaveBeenCalled();
  });
});
