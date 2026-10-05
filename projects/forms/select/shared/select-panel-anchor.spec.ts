import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideFloatingFallback } from '@cngx/common/popover';
import { provideDirection } from '@cngx/core';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CngxActionMultiSelect } from '../action-multi-select/action-multi-select.component';
import { CngxActionSelect } from '../action-select/action-select.component';
import { CngxCombobox } from '../combobox/combobox.component';
import { CngxTypeahead } from '../typeahead/typeahead.component';

// jsdom has no CSS Anchor Positioning (`SUPPORTS_ANCHOR === false`), so the
// panels position through the Floating UI fallback. Its reference element must
// be the bordered `.cngx-field-trigger` row, not the inner combobox input.

const OPTIONS = [
  { value: 'red', label: 'Red' },
  { value: 'green', label: 'Green' },
];

interface Openable {
  open(): void;
}

@Component({
  imports: [CngxTypeahead],
  template: `<cngx-typeahead #v [label]="'Colour'" [options]="options" />`,
})
class TypeaheadHost {
  readonly options = OPTIONS;
  readonly select = viewChild.required<Openable>('v');
}

@Component({
  imports: [CngxCombobox],
  template: `<cngx-combobox #v [label]="'Colours'" [options]="options" />`,
})
class ComboboxHost {
  readonly options = OPTIONS;
  readonly select = viewChild.required<Openable>('v');
}

@Component({
  imports: [CngxActionSelect],
  template: `<cngx-action-select #v [label]="'Colour'" [options]="options" />`,
})
class ActionHost {
  readonly options = OPTIONS;
  readonly select = viewChild.required<Openable>('v');
}

@Component({
  imports: [CngxActionMultiSelect],
  template: `<cngx-action-multi-select #v [label]="'Colours'" [options]="options" />`,
})
class ActionMultiHost {
  readonly options = OPTIONS;
  readonly select = viewChild.required<Openable>('v');
}

@Component({
  imports: [CngxActionSelect],
  template: `<cngx-action-select
    #v
    popoverPlacement="bottom-start"
    [label]="'Colour'"
    [options]="options"
  />`,
})
class ActionPlacementHost {
  readonly options = OPTIONS;
  readonly select = viewChild.required<Openable>('v');
}

function stubPopovers(root: HTMLElement): void {
  for (const el of Array.from(root.querySelectorAll<HTMLElement>('[cngxpopover]'))) {
    const rec = el as unknown as Record<string, unknown>;
    rec['showPopover'] = vi.fn();
    rec['hidePopover'] = vi.fn();
    rec['togglePopover'] = vi.fn();
  }
}

function openWithFallback<T extends { select(): Openable }>(
  host: new () => T,
  extraProviders: Parameters<typeof TestBed.configureTestingModule>[0]['providers'] = [],
) {
  const computePosition = vi
    .fn()
    .mockResolvedValue({ x: 0, y: 0, placement: 'bottom', middlewareData: {} });
  TestBed.configureTestingModule({
    providers: [
      provideFloatingFallback(computePosition, [{ name: 'flip' }]),
      ...(extraProviders ?? []),
    ],
  });
  const fixture = TestBed.createComponent(host);
  fixture.detectChanges();
  TestBed.flushEffects();
  const root = fixture.nativeElement as HTMLElement;
  stubPopovers(root);
  fixture.componentInstance.select().open();
  fixture.detectChanges();
  TestBed.flushEffects();
  const row = root.querySelector<HTMLElement>('.cngx-field-trigger');
  const input = root.querySelector<HTMLElement>('[role="combobox"]');
  return { computePosition, row, input };
}

describe('select panel anchor (floating-ui fallback)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  for (const [name, host] of [
    ['CngxTypeahead', TypeaheadHost],
    ['CngxCombobox', ComboboxHost],
    ['CngxActionSelect', ActionHost],
    ['CngxActionMultiSelect', ActionMultiHost],
  ] as const) {
    it(`${name}: positions against the field-trigger row, not the input`, () => {
      const { computePosition, row, input } = openWithFallback<{ select(): Openable }>(host);
      expect(computePosition).toHaveBeenCalled();
      expect(row).not.toBeNull();
      expect(computePosition.mock.calls[0][0]).toBe(row);
      expect(computePosition.mock.calls[0][0]).not.toBe(input);
    });
  }

  it('RTL: keeps the row as reference and hands floating-ui the literal bottom-start', () => {
    const { computePosition, row } = openWithFallback(ActionPlacementHost, [
      provideDirection('rtl'),
    ]);
    expect(computePosition.mock.calls[0][0]).toBe(row);
    const opts = computePosition.mock.calls[0][2] as { placement: string };
    expect(opts.placement).toBe('bottom-start');
  });
});
