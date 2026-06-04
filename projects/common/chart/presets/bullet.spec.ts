import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { CngxBullet, type CngxBulletRange } from './bullet.component';

@Component({
  standalone: true,
  imports: [CngxBullet],
  template: `
    <cngx-bullet
      [actual]="actual()"
      [target]="target()"
      [max]="max()"
      [ranges]="ranges()"
      data-testid="bullet"
    />
  `,
})
class TestHost {
  actual = signal<number>(70);
  target = signal<number | null>(80);
  max = signal<number | null>(100);
  ranges = signal<readonly CngxBulletRange[]>([
    { from: 0, to: 50, label: 'poor' },
    { from: 50, to: 80, label: 'fair' },
    { from: 80, to: 100, label: 'good' },
  ]);
}

describe('CngxBullet', () => {
  function setup(): {
    fixture: ReturnType<typeof TestBed.createComponent<TestHost>>;
    host: HTMLElement;
  } {
    TestBed.configureTestingModule({ imports: [TestHost] });
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('[data-testid="bullet"]') as HTMLElement;
    return { fixture, host };
  }

  it('renders one range strip per [ranges] entry', () => {
    const { host } = setup();
    const strips = host.querySelectorAll('.cngx-bullet__range');
    expect(strips.length).toBe(3);
  });

  it('positions the actual fill proportional to actual/maxValue', () => {
    const { host } = setup();
    const fill = host.querySelector('.cngx-bullet__actual') as HTMLElement;
    expect(fill.style.width).toBe('70%');
  });

  it('positions the target marker proportional to target/maxValue', () => {
    const { host } = setup();
    const marker = host.querySelector('.cngx-bullet__target') as HTMLElement;
    expect(marker.style.left).toBe('80%');
  });

  it('falls back to deriving max from ranges + target when [max] is null', () => {
    const { fixture, host } = setup();
    fixture.componentInstance.max.set(null);
    fixture.detectChanges();
    const fill = host.querySelector('.cngx-bullet__actual') as HTMLElement;
    expect(fill.style.width).toBe('70%');
  });

  it('exposes role="meter" with the resolved max as aria-valuemax', () => {
    const { host } = setup();
    expect(host.getAttribute('role')).toBe('meter');
    expect(host.getAttribute('aria-valuenow')).toBe('70');
    expect(host.getAttribute('aria-valuemax')).toBe('100');
  });
});
