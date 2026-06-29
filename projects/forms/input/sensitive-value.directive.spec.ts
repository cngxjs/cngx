import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { CngxLiveAnnouncer } from '@cngx/common/a11y';
import { CngxSensitiveValue, type SensitiveRevealAudit } from './sensitive-value.directive';
import { provideInputConfig, withInputAriaLabels } from './input-config';

@Component({
  template: `<input cngxSensitiveValue #sv="cngxSensitiveValue" (audit)="onAudit($event)" />`,
  imports: [CngxSensitiveValue],
})
class Host {
  readonly directive = viewChild.required(CngxSensitiveValue);
  readonly audits: SensitiveRevealAudit[] = [];
  onAudit(event: SensitiveRevealAudit): void {
    this.audits.push(event);
  }
}

function spyAnnouncer() {
  const announcer = TestBed.inject(CngxLiveAnnouncer);
  return vi.spyOn(announcer, 'announce').mockImplementation(() => {});
}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
  const host = fixture.componentInstance;
  return { fixture, input, host, directive: host.directive() };
}

describe('CngxSensitiveValue', () => {
  it('masks by default via type="password"', () => {
    spyAnnouncer();
    const { input, directive } = setup();
    expect(directive.revealed()).toBe(false);
    expect(input.getAttribute('type')).toBe('password');
  });

  it('reveals on toggle, switching type and emitting an audit event', () => {
    const announce = spyAnnouncer();
    const { fixture, input, host, directive } = setup();
    directive.toggle();
    fixture.detectChanges();
    expect(directive.revealed()).toBe(true);
    expect(input.getAttribute('type')).toBe('text');
    expect(host.audits).toHaveLength(1);
    expect(host.audits[0].revealed).toBe(true);
    expect(typeof host.audits[0].at).toBe('number');
    expect(announce).toHaveBeenCalledWith('Value revealed');
  });

  it('emits an audit for both transitions and announces each', () => {
    const announce = spyAnnouncer();
    const { fixture, host, directive } = setup();
    directive.toggle(); // reveal
    directive.toggle(); // hide
    fixture.detectChanges();
    expect(host.audits.map((a) => a.revealed)).toEqual([true, false]);
    expect(announce).toHaveBeenNthCalledWith(1, 'Value revealed');
    expect(announce).toHaveBeenNthCalledWith(2, 'Value hidden');
  });

  it('does not re-emit when the state is unchanged', () => {
    spyAnnouncer();
    const { host, directive } = setup();
    directive.hide(); // already hidden
    expect(host.audits).toHaveLength(0);
  });

  it('announces the configured override strings', () => {
    TestBed.configureTestingModule({
      providers: [
        provideInputConfig(
          withInputAriaLabels({ sensitiveReveal: 'Sichtbar', sensitiveHide: 'Verborgen' }),
        ),
      ],
    });
    const announce = spyAnnouncer();
    const { directive } = setup();
    directive.toggle();
    expect(announce).toHaveBeenCalledWith('Sichtbar');
  });
});
