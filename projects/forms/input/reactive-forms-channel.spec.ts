import { Component, Directive, ElementRef, inject } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';
import { injectFormDisabled } from './reactive-forms-channel';

@Directive({ selector: 'input[channelProbe]' })
class ChannelProbe {
  readonly formDisabled = injectFormDisabled(inject<ElementRef<HTMLInputElement>>(ElementRef));
}

@Component({
  selector: 'channel-host-1',
  template: `<input channelProbe />`,
  imports: [ChannelProbe],
})
class PlainHost {}

@Component({
  selector: 'channel-host-2',
  template: `<input channelProbe disabled />`,
  imports: [ChannelProbe],
})
class StaticDisabledHost {}

function flush(fixture: ComponentFixture<unknown>): void {
  fixture.detectChanges();
  TestBed.flushEffects();
}

function mount(host: typeof PlainHost | typeof StaticDisabledHost) {
  const fixture = TestBed.createComponent(host);
  flush(fixture);
  const debugInput = fixture.debugElement.query(By.css('input'));
  return {
    fixture,
    input: debugInput.nativeElement as HTMLInputElement,
    probe: debugInput.injector.get(ChannelProbe),
  };
}

describe('injectFormDisabled', () => {
  it('applies a changed flag to the input', () => {
    const { fixture, input, probe } = mount(PlainHost);

    probe.formDisabled.set(true);
    flush(fixture);
    expect(input.disabled).toBe(true);

    probe.formDisabled.set(false);
    flush(fixture);
    expect(input.disabled).toBe(false);
  });

  it('leaves a static disabled attribute alone until the flag changes', () => {
    const { input } = mount(StaticDisabledHost);

    expect(input.disabled).toBe(true);
  });
});
