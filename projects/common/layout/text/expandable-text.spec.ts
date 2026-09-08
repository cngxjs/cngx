import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';
import { createResizeObserverMock } from '@cngx/testing';
import { CngxExpandableText, CngxExpandableToggle } from './expandable-text';

// Installed once at module level on purpose: every test here needs the mock, so it
// must not be unstubbed per test. The shared setup unstubs at file end, which is
// what keeps it out of the next spec file.
createResizeObserverMock().install(window);

@Component({
  template: `
    <cngx-expandable-text [lines]="2">
      Long text content.
      <ng-template cngxExpandableToggle let-expanded let-toggle="toggle">
        <button type="button" class="custom-toggle" (click)="toggle()">
          {{ expanded ? 'Less' : 'More' }}
        </button>
      </ng-template>
    </cngx-expandable-text>
  `,
  imports: [CngxExpandableText, CngxExpandableToggle],
})
class TestHost {}

describe('CngxExpandableText', () => {
  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    const debugEl = fixture.debugElement.query(By.directive(CngxExpandableText));
    const cmp = debugEl.injector.get(CngxExpandableText);
    return { fixture, debugEl, cmp };
  }

  it('renders the custom toggle template with the expanded state', () => {
    const { fixture, cmp } = setup();
    // content never overflows in the test DOM - force the toggle visible
    cmp.expanded.set(true);
    fixture.detectChanges();

    const toggle = fixture.debugElement.query(By.css('.custom-toggle'));
    expect(toggle).not.toBeNull();
    expect((toggle.nativeElement as HTMLElement).textContent).toContain('Less');
  });

  it('the template toggle closure flips the expanded model', () => {
    const { fixture, cmp } = setup();
    cmp.expanded.set(true);
    fixture.detectChanges();

    const toggle = fixture.debugElement.query(By.css('.custom-toggle'))
      .nativeElement as HTMLButtonElement;
    toggle.click();
    expect(cmp.expanded()).toBe(false);
  });

  it('toggleContext keeps its reference while expanded is stable; new reference on change', () => {
    const { fixture, cmp } = setup();
    const instance = fixture.debugElement
      .query(By.directive(CngxExpandableText))
      .injector.get(CngxExpandableText) as unknown as { toggleContext(): unknown };

    const ctx1 = instance.toggleContext();
    fixture.detectChanges();
    expect(instance.toggleContext()).toBe(ctx1);

    cmp.expanded.set(true);
    fixture.detectChanges();
    expect(instance.toggleContext()).not.toBe(ctx1);
  });
});
