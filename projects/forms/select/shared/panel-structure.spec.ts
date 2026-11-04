import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { throwError } from 'rxjs';

import { createManualState } from '@cngx/common/data';

import { KINDS, type Kind, type Mount, cleanupRoots, mount } from './__test-helpers/review-probe-host';
import { provideSelectConfig, withAnnouncer, withSearchDebounce } from './config';
import { CngxSelectAnnouncer } from './announcer';
import { CngxTypeahead } from '../typeahead/typeahead.component';

afterEach(() => {
  cleanupRoots();
  vi.restoreAllMocks();
});

const ALL = Object.values(KINDS);

function container(m: Mount): HTMLElement | null {
  return m.el.querySelector<HTMLElement>('[role="listbox"], [role="tree"]');
}

function commitErrorId(m: Mount): string | null {
  const span = m.el.querySelector<HTMLElement>('[id^="cngx-select-commit-error"]');
  return span?.id ?? null;
}

function tokens(el: HTMLElement | null, attr: string): string[] {
  return (el?.getAttribute(attr) ?? '').split(/\s+/).filter(Boolean);
}

function errorMount(kind: Kind): Mount {
  const m = mount(kind, { mode: 'pessimistic', commit: () => throwError(() => new Error('commit failed')) });
  m.pickAt(1);
  m.settle();
  return m;
}

function errorCombobox(m: Mount): HTMLElement {
  const combobox = m.el.querySelector<HTMLElement>('[role="combobox"]');
  if (!combobox) {
    expect.fail(`no role=combobox for ${m.kind.name}`);
  }
  return combobox!;
}

// ── C4: no status/alert/group live region lives inside the option container ──
// The eight anchored/input composites render a role="status" inside the
// listbox today; only the tree container is already clean.
describe('C4: the listbox/tree container holds no status, alert or group node', () => {
  for (const kind of ALL) {
    it(`${kind.name}: no role=status/alert/group descendant inside the option container`, () => {
      const m = mount(kind);
      m.open();
      const box = container(m);
      if (!box) {
        expect.fail(`no option container for ${kind.name}`);
      }
      expect(box!.querySelector('[role="status"], [role="alert"], [role="group"]')).toBeNull();
    });
  }
});

// ── I8: the commit-error id is referenced once, not by both attributes ───────
describe('I8: the commit-error id rides on exactly one aria reference', () => {
  for (const kind of ALL) {
    it(`${kind.name}: commit-error id is in aria-errormessage xor aria-describedby`, () => {
      const m = errorMount(kind);
      const id = commitErrorId(m);
      if (!id) {
        expect.fail(`no commit-error node for ${kind.name}`);
      }
      const combobox = errorCombobox(m);
      const inDescribedBy = tokens(combobox, 'aria-describedby').includes(id!);
      const inErrorMessage = tokens(combobox, 'aria-errormessage').includes(id!);
      expect(inDescribedBy || inErrorMessage, `${kind.name} referenced at all`).toBe(true);
      expect(inDescribedBy && inErrorMessage, `${kind.name} referenced by both`).toBe(false);
    });

    it(`${kind.name}: the commit failure is spoken exactly once`, () => {
      const m = errorMount(kind);
      const text = m.el.querySelector<HTMLElement>('[id^="cngx-select-commit-error"]')?.textContent?.trim() ?? '';
      const spokenError = m.spoken.filter((s) => text !== '' && s.message.includes(text));
      expect(spokenError.length, `${m.kind.name} spoke the failure`).toBe(1);
    });
  }
});

// ── H7: an optimistic rejection with the panel closed leaves a reachable,
// non-sr-only error on the trigger. ─────────────────────────────────────────
describe('H7: an optimistic rejection surfaces a visible trigger error while closed', () => {
  for (const kind of ALL) {
    it(`${kind.name}: the commit error renders outside the sr-only node and the closed panel`, () => {
      const m = mount(kind, { mode: 'optimistic', commit: () => throwError(() => new Error('rejected')) });
      m.pickAt(1);
      m.v.close();
      m.settle();
      const srOnly = m.el.querySelector<HTMLElement>('.cngx-sr-only[id^="cngx-select-commit-error"]');
      const text = srOnly?.textContent?.trim() ?? '';
      if (text === '') {
        expect.fail(`${kind.name} produced no commit-error text`);
      }
      const reachable = Array.from(m.el.querySelectorAll<HTMLElement>('*')).some(
        (el) =>
          el.children.length === 0 &&
          el.textContent?.trim() === text &&
          !el.classList.contains('cngx-sr-only') &&
          !el.closest('.cngx-popover, [role="listbox"], [role="tree"]'),
      );
      expect(reachable, `${kind.name} reachable visible error`).toBe(true);
    });
  }
});

// ── D4: the reorder hint names the configured keyboard modifier. ─────────────
describe('D4: the reorder hint names the configured keyboard modifier', () => {
  const cases = [
    { modifier: 'alt', needle: /alt/i, red: false },
    { modifier: 'ctrl', needle: /ctrl|control|strg/i, red: true },
    { modifier: 'meta', needle: /meta|cmd|command|⌘/i, red: true },
  ] as const;
  for (const c of cases) {
    const run = c.red ? it.fails : it;
    run(`modifier ${c.modifier}: the chip-strip hint names it`, () => {
      const m = mount(KINDS['reorder'], { initial: ['red', 'green'], extraInputs: `[reorderKeyboardModifier]="'${c.modifier}'"` });
      const strip = m.el.querySelector<HTMLElement>('.cngx-select__chip-list');
      if (!strip) {
        expect.fail('no chip strip');
      }
      expect(strip!.getAttribute('aria-label') ?? '').toMatch(c.needle);
    });
  }
});

// ── Search-results announcements honour announcer.politeness / enabled. ──────
describe('search-results announcements follow the announcer config', () => {
  function typeFilter(m: Mount): void {
    m.open();
    const input = m.el.querySelector<HTMLInputElement>('input');
    if (!input) {
      expect.fail(`no input for ${m.kind.name}`);
    }
    input!.value = 'gr';
    input!.dispatchEvent(new Event('input', { bubbles: true }));
    m.settle();
  }

  it.fails('a results announcement uses the configured politeness (assertive)', () => {
    const m = mount(KINDS['combobox'], {
      providers: [provideSelectConfig(withSearchDebounce(0), withAnnouncer({ politeness: 'assertive' }))],
    });
    typeFilter(m);
    const results = m.spoken.filter((s) => /result/i.test(s.message));
    expect(results.length, 'spoke a results message').toBeGreaterThan(0);
    expect(results.every((s) => s.politeness === 'assertive')).toBe(true);
  });

  it.fails('no results announcement is spoken when the announcer is disabled', () => {
    const m = mount(KINDS['combobox'], {
      providers: [provideSelectConfig(withSearchDebounce(0), withAnnouncer({ enabled: false }))],
    });
    typeFilter(m);
    expect(m.spoken.some((s) => /result/i.test(s.message))).toBe(false);
  });
});

// ── I9: a typeahead load error while closed sets aria-invalid on the input and
// renders no role=alert inside the closed popover. ───────────────────────────
@Component({
  template: `
    <cngx-typeahead
      [label]="'Colour'"
      [state]="state"
      [(value)]="value"
      [presentation]="'anchored'"
    />
  `,
  imports: [CngxTypeahead],
})
class TypeaheadStateHost {
  readonly state = createManualState<readonly { value: string; label: string }[]>();
  readonly value = signal<string | undefined>(undefined);
}

describe('I9: a closed typeahead load error is announced on the input, not inside the panel', () => {
  afterEach(() => {
    cleanupRoots();
    vi.restoreAllMocks();
  });

  function mountState(): { root: HTMLElement; host: TypeaheadStateHost; fixture: ReturnType<typeof TestBed.createComponent<TypeaheadStateHost>> } {
    vi.spyOn(TestBed.inject(CngxSelectAnnouncer), 'announce').mockImplementation(() => undefined);
    const fixture = TestBed.createComponent(TypeaheadStateHost);
    const root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    return { root, host: fixture.componentInstance, fixture };
  }

  it.fails('sets aria-invalid on the input and renders no role=alert in the closed popover', () => {
    const { root, host, fixture } = mountState();
    host.state.setError(new Error('load failed'));
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const input = root.querySelector<HTMLInputElement>('input');
    if (!input) {
      expect.fail('no typeahead input');
    }
    expect(input!.getAttribute('aria-invalid')).toBe('true');
    const alert = root.querySelector('.cngx-popover [role="alert"], [role="listbox"] [role="alert"]');
    expect(alert, 'no role=alert inside the closed popover').toBeNull();
  });
});
