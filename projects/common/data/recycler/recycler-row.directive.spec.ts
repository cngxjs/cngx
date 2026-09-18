import {
  Component,
  DestroyRef,
  Directive,
  inject,
  provideZonelessChangeDetection,
  signal,
  type TemplateRef,
  viewChild,
  type WritableSignal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import {
  CNGX_RECYCLER_PLACEHOLDER_ROW,
  CngxRecyclerRow,
  type CngxRecyclerRowContext,
  provideRecyclerPlaceholderRow,
} from './recycler-row.directive';
import type { CngxRecycler } from './recycler';

interface Row {
  id: number;
  name: string;
}

function mockRecycler(rowSizeHint: number, ariaSetSize: number): CngxRecycler {
  return {
    rowSizeHint: signal(rowSizeHint),
    ariaSetSize: signal(ariaSetSize),
  } as unknown as CngxRecycler;
}

@Component({
  standalone: true,
  imports: [CngxRecyclerRow],
  template: `<ul>
    <li
      *cngxRecyclerRow="item(); index: index(); recycler: recycler; placeholder: ph; let row"
      class="real-row"
    >
      {{ row?.name }}
    </li>
    <ng-template #ph let-idx let-setSize="setSize" let-top="top">
      <li
        class="ph-row"
        role="listitem"
        aria-busy="true"
        [attr.aria-posinset]="idx + 1"
        [attr.aria-setsize]="setSize"
        [attr.data-top]="top"
      >
        loading
      </li>
    </ng-template>
  </ul>`,
})
class Host {
  readonly recycler = mockRecycler(56, 100);
  readonly item = signal<Row | undefined>({ id: 0, name: 'Row 1' });
  readonly index = signal(3);
}

@Component({
  standalone: true,
  imports: [CngxRecyclerRow],
  template: `<ul>
    <li *cngxRecyclerRow="item(); index: index(); recycler: recycler; let row" class="real-row">
      {{ row?.name }}
    </li>
  </ul>`,
})
class HostNoPlaceholder {
  readonly recycler = mockRecycler(56, 100);
  readonly item = signal<Row | undefined>(undefined);
  readonly index = signal(3);
}

@Component({
  standalone: true,
  template: `<ng-template #t let-idx let-setSize="setSize">
    <li
      class="token-row"
      role="listitem"
      aria-busy="true"
      [attr.aria-posinset]="idx + 1"
      [attr.aria-setsize]="setSize"
    >
      token
    </li>
  </ng-template>`,
})
class TokenTplHost {
  readonly tpl = viewChild.required<TemplateRef<CngxRecyclerRowContext>>('t');
}

@Directive({ selector: '[destroyProbe]', standalone: true })
class DestroyProbe {
  static destroyed = 0;
  constructor() {
    inject(DestroyRef).onDestroy(() => {
      DestroyProbe.destroyed += 1;
    });
  }
}

@Component({
  standalone: true,
  imports: [CngxRecyclerRow, DestroyProbe],
  template: `<ul>
    <li *cngxRecyclerRow="item(); index: 0; recycler: recycler" destroyProbe class="real-row"></li>
  </ul>`,
})
class ProbeHost {
  readonly recycler = mockRecycler(56, 100);
  readonly item = signal<Row | undefined>({ id: 0, name: 'Row 1' });
}

function setup(): { host: Host; el: HTMLElement; flush: () => void } {
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  return {
    host: fixture.componentInstance,
    el: fixture.nativeElement as HTMLElement,
    flush: () => {
      TestBed.flushEffects();
      fixture.detectChanges();
    },
  };
}

// Mints a real, rendering TemplateRef and hands it to the config token via a
// mutable holder read lazily at directive-construction time (a module-level
// TemplateRef cannot exist, so the token value must come from a live view).
function mintTokenTemplate(): { tpl: TemplateRef<CngxRecyclerRowContext> | null } {
  const holder: { tpl: TemplateRef<CngxRecyclerRowContext> | null } = { tpl: null };
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      { provide: CNGX_RECYCLER_PLACEHOLDER_ROW, useFactory: () => holder.tpl },
    ],
  });
  const tplFixture = TestBed.createComponent(TokenTplHost);
  tplFixture.detectChanges();
  holder.tpl = tplFixture.componentInstance.tpl();
  return holder;
}

describe('CngxRecyclerRow', () => {
  it('exposes the template context guard', () => {
    expect(CngxRecyclerRow.ngTemplateContextGuard).toBeTypeOf('function');
    expect(
      CngxRecyclerRow.ngTemplateContextGuard(null as unknown as CngxRecyclerRow<unknown>, {}),
    ).toBe(true);
  });

  it('renders the real-row template with $implicit when the item is defined', () => {
    const { el } = setup();
    const real = el.querySelector('.real-row');
    expect(real).not.toBeNull();
    expect(real?.textContent?.trim()).toBe('Row 1');
    expect(el.querySelector('.ph-row')).toBeNull();
  });

  it('renders the placeholder branch when the item is undefined', () => {
    const { host, el, flush } = setup();
    host.item.set(undefined);
    flush();

    expect(el.querySelector('.real-row')).toBeNull();
    expect(el.querySelector('.ph-row')).not.toBeNull();
  });

  it('passes index/top/setSize context to the placeholder template', () => {
    const { host, el, flush } = setup();
    host.item.set(undefined);
    flush();

    const ph = el.querySelector('.ph-row') as HTMLElement;
    // index 3 -> posinset 4; setSize 100; top = rowSizeHint(56) * index(3) = 168.
    expect(ph.getAttribute('aria-posinset')).toBe('4');
    expect(ph.getAttribute('aria-setsize')).toBe('100');
    expect(ph.getAttribute('data-top')).toBe('168');
  });

  it('keeps the placeholder row in the a11y tree (busy, listitem, not aria-hidden)', () => {
    const { host, el, flush } = setup();
    host.item.set(undefined);
    flush();

    const ph = el.querySelector('.ph-row') as HTMLElement;
    expect(ph.getAttribute('aria-busy')).toBe('true');
    expect(ph.getAttribute('role')).toBe('listitem');
    expect(ph.hasAttribute('aria-hidden')).toBe(false);
  });

  it('reuses the same real-row view across a defined -> undefined -> defined flip', () => {
    const { host, el, flush } = setup();
    const first = el.querySelector('.real-row');
    expect(first).not.toBeNull();

    host.item.set(undefined);
    flush();
    expect(el.querySelector('.real-row')).toBeNull();

    host.item.set({ id: 1, name: 'Row 2' });
    flush();
    const second = el.querySelector('.real-row');
    // Same DOM node identity => the cached EmbeddedViewRef was re-attached, not remounted.
    expect(second).toBe(first);
    expect(second?.textContent?.trim()).toBe('Row 2');
  });

  it('stamps the imperative <li> default when neither microsyntax nor token supplies a template', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(HostNoPlaceholder);
    fixture.detectChanges();

    const def = (fixture.nativeElement as HTMLElement).querySelector(
      'li.cngx-recycler-placeholder',
    ) as HTMLElement;
    expect(def).not.toBeNull();
    expect(def.getAttribute('aria-busy')).toBe('true');
    expect(def.getAttribute('role')).toBe('listitem');
    expect(def.getAttribute('aria-posinset')).toBe('4');
    expect(def.getAttribute('aria-setsize')).toBe('100');
    expect(def.hasAttribute('aria-hidden')).toBe(false);
    expect(def.style.height).toBe('56px');
  });

  it('prefers the microsyntax placeholder over the imperative default', () => {
    const { host, el, flush } = setup();
    host.item.set(undefined);
    flush();

    expect(el.querySelector('.ph-row')).not.toBeNull();
    expect(el.querySelector('li.cngx-recycler-placeholder')).toBeNull();
  });

  it('renders the config-token template over the imperative default', () => {
    mintTokenTemplate();

    const fixture = TestBed.createComponent(HostNoPlaceholder);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    const token = el.querySelector('.token-row') as HTMLElement;
    expect(token).not.toBeNull();
    expect(token.getAttribute('aria-posinset')).toBe('4');
    expect(el.querySelector('li.cngx-recycler-placeholder')).toBeNull();
  });

  it('prefers the microsyntax placeholder over the config token', () => {
    mintTokenTemplate();

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    fixture.componentInstance.item.set(undefined);
    TestBed.flushEffects();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.ph-row')).not.toBeNull();
    expect(el.querySelector('.token-row')).toBeNull();
  });

  it('keeps the custom placeholder a11y position/size reactive across an index/setSize shift', () => {
    const { host, el, flush } = setup();
    host.item.set(undefined);
    flush();
    let ph = el.querySelector('.ph-row') as HTMLElement;
    expect(ph.getAttribute('aria-posinset')).toBe('4');
    expect(ph.getAttribute('aria-setsize')).toBe('100');

    // The window shifts this still-unloaded slot down and the server total grows.
    host.index.set(7);
    (host.recycler.ariaSetSize as WritableSignal<number>).set(250);
    flush();

    ph = el.querySelector('.ph-row') as HTMLElement;
    expect(ph.getAttribute('aria-posinset')).toBe('8');
    expect(ph.getAttribute('aria-setsize')).toBe('250');
    expect(ph.getAttribute('data-top')).toBe('392'); // rowSizeHint(56) * index(7)
  });

  it('refreshes the imperative default a11y attrs across an index/setSize shift', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(HostNoPlaceholder);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    let def = el.querySelector('li.cngx-recycler-placeholder') as HTMLElement;
    expect(def.getAttribute('aria-posinset')).toBe('4');
    expect(def.getAttribute('aria-setsize')).toBe('100');

    fixture.componentInstance.index.set(9);
    (fixture.componentInstance.recycler.ariaSetSize as WritableSignal<number>).set(500);
    TestBed.flushEffects();
    fixture.detectChanges();

    def = el.querySelector('li.cngx-recycler-placeholder') as HTMLElement;
    expect(def.getAttribute('aria-posinset')).toBe('10');
    expect(def.getAttribute('aria-setsize')).toBe('500');
  });

  it('destroys the cached detached row view on teardown (no leak)', () => {
    DestroyProbe.destroyed = 0;
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(ProbeHost);
    fixture.detectChanges();
    expect(DestroyProbe.destroyed).toBe(0);

    // Flip to placeholder: the row view is detached and cached (not destroyed),
    // so it is no longer owned by the VCR - only the directive's own teardown
    // can free it.
    fixture.componentInstance.item.set(undefined);
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(DestroyProbe.destroyed).toBe(0);

    fixture.destroy();
    expect(DestroyProbe.destroyed).toBe(1);
  });

  it('provideRecyclerPlaceholderRow returns the token useValue provider', () => {
    const fake = {} as TemplateRef<CngxRecyclerRowContext>;
    expect(provideRecyclerPlaceholderRow(fake)).toEqual({
      provide: CNGX_RECYCLER_PLACEHOLDER_ROW,
      useValue: fake,
    });
  });
});
