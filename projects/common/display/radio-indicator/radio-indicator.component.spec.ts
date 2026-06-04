import { Component, signal, viewChild, type TemplateRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CngxRadioIndicator } from './radio-indicator.component';

@Component({
  template: `
    <cngx-radio-indicator
      [checked]="checked()"
      [disabled]="disabled()"
      [size]="size()"
    />
  `,
  imports: [CngxRadioIndicator],
})
class Host {
  readonly checked = signal<boolean>(false);
  readonly disabled = signal<boolean>(false);
  readonly size = signal<'sm' | 'md' | 'lg'>('md');
}

function flush(fixture: { detectChanges: () => void }): void {
  TestBed.flushEffects();
  fixture.detectChanges();
}

function hostEl(fixture: { nativeElement: HTMLElement }): HTMLElement {
  const el = fixture.nativeElement.querySelector('cngx-radio-indicator');
  if (!el) {
    throw new Error('cngx-radio-indicator host not found');
  }
  return el as HTMLElement;
}

describe('CngxRadioIndicator', () => {
  it('host carries .cngx-radio-indicator and aria-hidden="true"', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    const host = hostEl(fixture);
    expect(host.classList.contains('cngx-radio-indicator')).toBe(true);
    expect(host.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders the .__circle frame regardless of checked state', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    const host = hostEl(fixture);
    expect(host.querySelector('.cngx-radio-indicator__circle')).not.toBeNull();
  });

  it('checked=false → no dot glyph rendered', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    const host = hostEl(fixture);
    expect(host.classList.contains('cngx-radio-indicator--checked')).toBe(false);
    expect(host.querySelector('.cngx-radio-indicator__dot')).toBeNull();
  });

  it('checked=true renders the dot inside the circle', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.checked.set(true);
    flush(fixture);
    const host = hostEl(fixture);
    expect(host.classList.contains('cngx-radio-indicator--checked')).toBe(true);
    const circle = host.querySelector('.cngx-radio-indicator__circle');
    expect(circle?.querySelector('.cngx-radio-indicator__dot')).not.toBeNull();
  });

  it('checked state class toggles reactively as input changes', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    let host = hostEl(fixture);
    expect(host.classList.contains('cngx-radio-indicator--checked')).toBe(false);

    fixture.componentInstance.checked.set(true);
    flush(fixture);
    host = hostEl(fixture);
    expect(host.classList.contains('cngx-radio-indicator--checked')).toBe(true);

    fixture.componentInstance.checked.set(false);
    flush(fixture);
    host = hostEl(fixture);
    expect(host.classList.contains('cngx-radio-indicator--checked')).toBe(false);
    expect(host.querySelector('.cngx-radio-indicator__dot')).toBeNull();
  });

  it('disabled=true sets the --disabled host class', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.disabled.set(true);
    flush(fixture);
    const host = hostEl(fixture);
    expect(host.classList.contains('cngx-radio-indicator--disabled')).toBe(true);
  });

  it('size modifiers toggle mutually exclusively', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    let host = hostEl(fixture);
    expect(host.classList.contains('cngx-radio-indicator--md')).toBe(true);
    expect(host.classList.contains('cngx-radio-indicator--sm')).toBe(false);
    expect(host.classList.contains('cngx-radio-indicator--lg')).toBe(false);

    fixture.componentInstance.size.set('sm');
    flush(fixture);
    host = hostEl(fixture);
    expect(host.classList.contains('cngx-radio-indicator--sm')).toBe(true);
    expect(host.classList.contains('cngx-radio-indicator--md')).toBe(false);

    fixture.componentInstance.size.set('lg');
    flush(fixture);
    host = hostEl(fixture);
    expect(host.classList.contains('cngx-radio-indicator--lg')).toBe(true);
    expect(host.classList.contains('cngx-radio-indicator--sm')).toBe(false);
  });

  it('aria-hidden stays "true" regardless of input changes', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.checked.set(true);
    fixture.componentInstance.disabled.set(true);
    flush(fixture);
    const host = hostEl(fixture);
    expect(host.getAttribute('aria-hidden')).toBe('true');
  });

  it('host click is a no-op — no output emitters defined', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    const host = hostEl(fixture);
    expect(() => host.click()).not.toThrow();
  });

  describe('dotGlyph slot', () => {
    @Component({
      template: `
        <ng-template #customDot>
          <span class="custom-glyph" data-custom="dot">o</span>
        </ng-template>
        <cngx-radio-indicator
          [checked]="checked()"
          [dotGlyph]="activeDotGlyph()"
        />
      `,
      imports: [CngxRadioIndicator],
    })
    class GlyphHost {
      readonly dotTpl = viewChild.required<TemplateRef<void>>('customDot');
      readonly checked = signal<boolean>(false);
      readonly activeDotGlyph = signal<TemplateRef<void> | null>(null);
    }

    it('default (no dotGlyph input) renders the built-in .__dot glyph', () => {
      const fixture = TestBed.createComponent(GlyphHost);
      fixture.componentInstance.checked.set(true);
      flush(fixture);
      const host = hostEl(fixture);
      expect(host.querySelector('.cngx-radio-indicator__dot')).not.toBeNull();
      expect(host.querySelector('[data-custom="dot"]')).toBeNull();
    });

    it('[dotGlyph] template replaces the built-in dot when checked', () => {
      const fixture = TestBed.createComponent(GlyphHost);
      fixture.componentInstance.checked.set(true);
      fixture.componentInstance.activeDotGlyph.set(fixture.componentInstance.dotTpl());
      flush(fixture);
      const host = hostEl(fixture);
      expect(host.querySelector('.cngx-radio-indicator__dot')).toBeNull();
      const custom = host.querySelector('[data-custom="dot"]');
      expect(custom).not.toBeNull();
      expect(custom?.textContent).toBe('o');
    });

    it('custom dotGlyph still gates on checked — unchecked → nothing rendered', () => {
      const fixture = TestBed.createComponent(GlyphHost);
      fixture.componentInstance.activeDotGlyph.set(fixture.componentInstance.dotTpl());
      flush(fixture);
      const host = hostEl(fixture);
      expect(host.querySelector('.cngx-radio-indicator__dot')).toBeNull();
      expect(host.querySelector('[data-custom="dot"]')).toBeNull();
    });

    it('resetting the dotGlyph input to null restores the default glyph', () => {
      const fixture = TestBed.createComponent(GlyphHost);
      fixture.componentInstance.checked.set(true);
      fixture.componentInstance.activeDotGlyph.set(fixture.componentInstance.dotTpl());
      flush(fixture);
      let host = hostEl(fixture);
      expect(host.querySelector('[data-custom="dot"]')).not.toBeNull();

      fixture.componentInstance.activeDotGlyph.set(null);
      flush(fixture);
      host = hostEl(fixture);
      expect(host.querySelector('[data-custom="dot"]')).toBeNull();
      expect(host.querySelector('.cngx-radio-indicator__dot')).not.toBeNull();
    });
  });
});
