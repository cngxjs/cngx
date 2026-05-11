import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxAlerter } from './alerter.service';
import { CngxAlertStack } from './alert-stack';

@Component({
  template: `<cngx-alert-stack [scope]="'test'" [maxVisible]="3" />`,
  imports: [CngxAlertStack],
})
class TestHost {
  readonly stack = viewChild.required(CngxAlertStack);
}

describe('CngxAlertStack', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TestHost] });
  });

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const stackEl: HTMLElement = fixture.nativeElement.querySelector('cngx-alert-stack');
    // Get the CngxAlerter from the stack's view injector
    const alerter = fixture.componentInstance.stack()['alerter'] as CngxAlerter;
    return { fixture, stackEl, alerter };
  }

  it('renders as role="log" with aria-live="polite"', () => {
    const { stackEl } = setup();
    expect(stackEl.getAttribute('role')).toBe('log');
    expect(stackEl.getAttribute('aria-live')).toBe('polite');
  });

  it('provides CngxAlerter via viewProviders', () => {
    const { alerter } = setup();
    expect(alerter).toBeInstanceOf(CngxAlerter);
  });

  it('renders alerts from the scoped alerter', () => {
    const { fixture, stackEl, alerter } = setup();
    alerter.show({ message: 'Error 1', severity: 'error', scope: 'test' });
    alerter.show({ message: 'Error 2', severity: 'error', scope: 'test' });
    fixture.detectChanges();

    const items = stackEl.querySelectorAll('.cngx-alert-stack__item');
    expect(items.length).toBe(2);
  });

  it('limits visible alerts to maxVisible', () => {
    const { fixture, stackEl, alerter } = setup();
    for (let i = 0; i < 5; i++) {
      alerter.show({ message: `Alert ${i}`, severity: 'error', scope: 'test' });
    }
    fixture.detectChanges();

    const items = stackEl.querySelectorAll('.cngx-alert-stack__item');
    expect(items.length).toBe(3);
  });

  it('shows overflow button when alerts exceed maxVisible', () => {
    const { fixture, stackEl, alerter } = setup();
    for (let i = 0; i < 5; i++) {
      alerter.show({ message: `Alert ${i}`, severity: 'error', scope: 'test' });
    }
    fixture.detectChanges();

    const overflow = stackEl.querySelector('.cngx-alert-stack__overflow');
    expect(overflow).toBeTruthy();
    expect(overflow?.textContent).toContain('2 more');
  });

  it('expands all alerts when overflow button is clicked', () => {
    const { fixture, stackEl, alerter } = setup();
    for (let i = 0; i < 5; i++) {
      alerter.show({ message: `Alert ${i}`, severity: 'error', scope: 'test' });
    }
    fixture.detectChanges();

    const overflow = stackEl.querySelector('.cngx-alert-stack__overflow') as HTMLElement;
    overflow.click();
    fixture.detectChanges();

    const items = stackEl.querySelectorAll('.cngx-alert-stack__item');
    expect(items.length).toBe(5);
    expect(stackEl.querySelector('.cngx-alert-stack__overflow')).toBeNull();
  });

  it('dismiss button removes the alert', () => {
    const { fixture, stackEl, alerter } = setup();
    alerter.show({ message: 'Dismissable', severity: 'error', scope: 'test' });
    fixture.detectChanges();

    const dismiss = stackEl.querySelector('cngx-close-button') as HTMLElement;
    expect(dismiss).toBeTruthy();
    dismiss.click();
    fixture.detectChanges();

    expect(stackEl.querySelectorAll('.cngx-alert-stack__item').length).toBe(0);
  });

  it('applies severity classes to items', () => {
    const { fixture, stackEl, alerter } = setup();
    alerter.show({ message: 'Error', severity: 'error', scope: 'test' });
    fixture.detectChanges();

    const item = stackEl.querySelector('.cngx-alert-stack__item');
    expect(item?.classList.contains('cngx-alert-stack__item--error')).toBe(true);
  });

  it('uses role="alert" for error items', () => {
    const { fixture, stackEl, alerter } = setup();
    alerter.show({ message: 'Error', severity: 'error', scope: 'test' });
    fixture.detectChanges();

    const item = stackEl.querySelector('.cngx-alert-stack__item');
    expect(item?.getAttribute('role')).toBe('alert');
  });

  it('uses role="status" for info items', () => {
    const { fixture, stackEl, alerter } = setup();
    alerter.show({ message: 'Info', severity: 'info', scope: 'test' });
    fixture.detectChanges();

    const item = stackEl.querySelector('.cngx-alert-stack__item');
    expect(item?.getAttribute('role')).toBe('status');
  });

  it('filters alerts by scope', () => {
    const { fixture, stackEl, alerter } = setup();
    alerter.show({ message: 'Wrong scope', scope: 'other' });
    alerter.show({ message: 'Right scope', scope: 'test' });
    fixture.detectChanges();

    const items = stackEl.querySelectorAll('.cngx-alert-stack__item');
    expect(items.length).toBe(1);
  });
});
