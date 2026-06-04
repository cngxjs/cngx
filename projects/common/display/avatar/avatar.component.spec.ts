import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxAvatar } from './avatar.component';

@Component({
  template: `
    <cngx-avatar
      [src]="src()"
      [alt]="alt()"
      [initials]="initials()"
      [size]="size()"
      [shape]="shape()"
      [status]="status()"
    ></cngx-avatar>
  `,
  imports: [CngxAvatar],
})
class AvatarHost {
  readonly src = signal<string | undefined>(undefined);
  readonly alt = signal<string | undefined>(undefined);
  readonly initials = signal<string | undefined>(undefined);
  readonly size = signal<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('md');
  readonly shape = signal<'circle' | 'square'>('circle');
  readonly status = signal<'online' | 'offline' | 'busy' | 'away' | undefined>(undefined);
}

describe('CngxAvatar', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [AvatarHost] }));

  function setup(): {
    fixture: ReturnType<typeof TestBed.createComponent<AvatarHost>>;
    hostEl: HTMLElement;
    dir: CngxAvatar;
  } {
    const fixture = TestBed.createComponent(AvatarHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const debugEl = fixture.debugElement.query(By.directive(CngxAvatar));
    return {
      fixture,
      hostEl: debugEl.nativeElement as HTMLElement,
      dir: debugEl.injector.get(CngxAvatar),
    };
  }

  it('shows initials when no src is set', () => {
    const { fixture, hostEl } = setup();
    fixture.componentInstance.initials.set('JD');
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(hostEl.textContent).toContain('JD');
  });

  it('shows an img when src is set', () => {
    const { fixture, hostEl } = setup();
    fixture.componentInstance.src.set('https://example.com/avatar.jpg');
    fixture.componentInstance.alt.set('Jane');
    fixture.detectChanges();
    TestBed.flushEffects();
    const img = hostEl.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toBe('https://example.com/avatar.jpg');
    expect(img?.getAttribute('alt')).toBe('Jane');
  });

  it('falls back to initials when the image errors', () => {
    const { fixture, hostEl, dir } = setup();
    fixture.componentInstance.src.set('https://example.com/broken.jpg');
    fixture.componentInstance.initials.set('JD');
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const img = hostEl.querySelector('img');
    img?.dispatchEvent(new Event('error'));
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(dir.showFallback()).toBe(true);
    expect(hostEl.textContent).toContain('JD');
  });

  it('applies size and shape modifier classes', () => {
    const { fixture, hostEl } = setup();
    fixture.componentInstance.size.set('lg');
    fixture.componentInstance.shape.set('square');
    fixture.detectChanges();
    expect(hostEl.classList.contains('cngx-avatar--lg')).toBe(true);
    expect(hostEl.classList.contains('cngx-avatar--square')).toBe(true);
  });

  it('renders a status dot with aria-label when status is set', () => {
    const { fixture, hostEl } = setup();
    fixture.componentInstance.status.set('online');
    fixture.detectChanges();
    TestBed.flushEffects();
    const dot = hostEl.querySelector('.cngx-avatar__status');
    expect(dot).not.toBeNull();
    expect(dot?.getAttribute('aria-label')).toBe('online');
    expect(dot?.classList.contains('cngx-avatar__status--online')).toBe(true);
  });

  it('does not render a status dot when status is undefined', () => {
    const { hostEl } = setup();
    const dot = hostEl.querySelector('.cngx-avatar__status');
    expect(dot).toBeNull();
  });
});
