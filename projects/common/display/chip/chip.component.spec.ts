import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CngxChip } from './chip.component';

@Component({
  template: `
    <cngx-chip
      [removable]="removable()"
      [removeAriaLabel]="ariaLabel"
      [id]="chipId"
      (remove)="removeCount.update((c) => c + 1)"
    >
      Rot
    </cngx-chip>
  `,
  imports: [CngxChip],
})
class Host {
  readonly removable = signal<boolean>(true);
  readonly removeCount = signal<number>(0);
  ariaLabel = 'Remove Red';
  chipId: string | null = null;
}

function flush(fixture: { detectChanges: () => void }): void {
  TestBed.flushEffects();
  fixture.detectChanges();
}

describe('CngxChip', () => {
  it('projects label content', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    const label: HTMLElement = fixture.nativeElement.querySelector('.cngx-chip__label');
    expect(label.textContent!.trim()).toBe('Rot');
  });

  it('renders close button only when removable() is true', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    expect(fixture.nativeElement.querySelector('.cngx-chip__remove')).not.toBeNull();

    fixture.componentInstance.removable.set(false);
    flush(fixture);
    expect(fixture.nativeElement.querySelector('.cngx-chip__remove')).toBeNull();
  });

  it('emits (remove) when close button is clicked', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.cngx-chip__remove',
    );
    btn.click();
    flush(fixture);
    expect(fixture.componentInstance.removeCount()).toBe(1);
  });

  it('passes removeAriaLabel through to the close button', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.cngx-chip__remove',
    );
    expect(btn.getAttribute('aria-label')).toBe('Remove Red');
  });

  it('host element receives an auto-generated id when none is supplied', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    const host: HTMLElement = fixture.nativeElement.querySelector('cngx-chip');
    expect(host.getAttribute('id')).toMatch(/^cngx-chip-\d+$/);
  });

  it('honors a consumer-supplied id', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.chipId = 'my-tag-1';
    flush(fixture);
    const host: HTMLElement = fixture.nativeElement.querySelector('cngx-chip');
    expect(host.getAttribute('id')).toBe('my-tag-1');
  });

  it('renders projected [cngxChipClose] content instead of the default ✕ glyph', () => {
    @Component({
      template: `
        <cngx-chip [removable]="true">
          Custom
          <span cngxChipClose class="my-close">dismiss</span>
        </cngx-chip>
      `,
      imports: [CngxChip],
    })
    class CloseSlotHost {}
    TestBed.configureTestingModule({ imports: [CloseSlotHost] });
    const fixture = TestBed.createComponent(CloseSlotHost);
    flush(fixture);
    const button: HTMLElement = fixture.nativeElement.querySelector('.cngx-chip__remove');
    expect(button).not.toBeNull();
    expect(button.querySelector('.my-close')).not.toBeNull();
    // Default × fallback is not rendered when the slot is filled.
    expect(button.textContent).toContain('dismiss');
    expect(button.textContent).not.toContain('\u2715');
  });
});
