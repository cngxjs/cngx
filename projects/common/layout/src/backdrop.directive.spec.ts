import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it, vi } from 'vitest';
import { CngxBackdrop } from './backdrop.directive';

@Component({
  template: `
    <div class="container">
      <div
        [cngxBackdrop]="visible()"
        [closeOnClick]="closeOnClick()"
        (backdropClick)="clicked()"
        class="backdrop"
      ></div>
      <div class="sibling-a">A</div>
      <div class="sibling-b">B</div>
    </div>
  `,
  imports: [CngxBackdrop],
})
class TestHost {
  visible = signal(false);
  closeOnClick = signal(true);
  clicked = vi.fn();
}

describe('CngxBackdrop', () => {
  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    const backdropEl = fixture.debugElement.query(By.directive(CngxBackdrop))
      .nativeElement as HTMLElement;
    const sibA = fixture.debugElement.query(By.css('.sibling-a')).nativeElement as HTMLElement;
    const sibB = fixture.debugElement.query(By.css('.sibling-b')).nativeElement as HTMLElement;
    return { fixture, host: fixture.componentInstance, backdropEl, sibA, sibB };
  }

  it('does not have visible class initially', () => {
    const { backdropEl } = setup();
    expect(backdropEl.classList.contains('cngx-backdrop--visible')).toBe(false);
  });

  it('adds visible class when visible', () => {
    const { fixture, host, backdropEl } = setup();
    host.visible.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(backdropEl.classList.contains('cngx-backdrop--visible')).toBe(true);
  });

  it('sets inert on siblings when visible', () => {
    const { fixture, host, sibA, sibB } = setup();
    host.visible.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(sibA.hasAttribute('inert')).toBe(true);
    expect(sibB.hasAttribute('inert')).toBe(true);
  });

  it('removes inert from siblings when hidden', () => {
    const { fixture, host, sibA, sibB } = setup();
    host.visible.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    host.visible.set(false);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(sibA.hasAttribute('inert')).toBe(false);
    expect(sibB.hasAttribute('inert')).toBe(false);
  });

  it('emits backdropClick on click when visible and closeOnClick', () => {
    const { fixture, host, backdropEl } = setup();
    host.visible.set(true);
    fixture.detectChanges();
    backdropEl.click();
    expect(host.clicked).toHaveBeenCalledOnce();
  });

  it('does not emit backdropClick when closeOnClick is false', () => {
    const { fixture, host, backdropEl } = setup();
    host.visible.set(true);
    host.closeOnClick.set(false);
    fixture.detectChanges();
    backdropEl.click();
    expect(host.clicked).not.toHaveBeenCalled();
  });

  it('does not emit backdropClick when not visible', () => {
    const { backdropEl, host } = setup();
    backdropEl.click();
    expect(host.clicked).not.toHaveBeenCalled();
  });

  it('sets aria-hidden=true when not visible', () => {
    const { backdropEl } = setup();
    expect(backdropEl.getAttribute('aria-hidden')).toBe('true');
  });
});
