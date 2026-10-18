import { Component, OutputEmitterRef, signal, type Type } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Subject, type Observable } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CngxSelectAnnouncer } from '../announcer';
import type { CngxSelectCommitMode } from '../commit-action.types';

/**
 * Per-variant wiring for {@link describeSelectBehaviourHost}.
 *
 * @internal
 */
export interface SelectBehaviourHostOptions {
  /** Inputs that make the variant render rows; they read the host members below. */
  readonly inputs: string;
  /** Projected content (declarative options). */
  readonly content?: string;
  /** Standalone imports the projected content needs. */
  readonly contentImports?: readonly Type<unknown>[];
  /** Selector of one pickable row inside the panel. */
  readonly optionSelector: string;
  /** Reads the variant's own value model. */
  readonly readValue: (cmp: unknown) => unknown;
  /**
   * Activates one row through the variant's real activation path. Defaults
   * to opening the panel and clicking the second row.
   */
  readonly commitPick?: (cmp: unknown, fixture: ComponentFixture<unknown>) => void;
}

interface VariantApi {
  open(): void;
  readonly panelOpen: () => boolean;
}

// jsdom has no Popover API.
function polyfillPopover(): void {
  const proto = HTMLElement.prototype as unknown as {
    showPopover?: () => void;
    hidePopover?: () => void;
    togglePopover?: () => boolean;
  };
  if (typeof proto.showPopover === 'function') {
    return;
  }
  proto.showPopover = function (this: HTMLElement) {
    this.setAttribute('data-popover-open', 'true');
  };
  proto.hidePopover = function (this: HTMLElement) {
    this.removeAttribute('data-popover-open');
  };
  proto.togglePopover = function (this: HTMLElement) {
    const open = !this.hasAttribute('data-popover-open');
    if (open) {
      this.setAttribute('data-popover-open', 'true');
    } else {
      this.removeAttribute('data-popover-open');
    }
    return open;
  };
}

// An emit on a destroyed `OutputEmitterRef` is what Angular reports as NG0953.
function emittedAfterDestroy(refs: readonly unknown[]): number {
  return refs.filter((ref) => (ref as { readonly destroyed?: boolean }).destroyed === true).length;
}

function flush(fixture: ComponentFixture<unknown>): void {
  TestBed.flushEffects();
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
}

/**
 * Shared behaviour rows for a select-family composite, mounted anchored on a
 * plain host with a deferred `[commitAction]`: a commit that settles after
 * the host is destroyed neither writes, emits nor speaks.
 *
 * @internal
 */
export function describeSelectBehaviourHost(
  variantName: string,
  component: Type<unknown>,
  elementSelector: string,
  opts: SelectBehaviourHostOptions,
): void {
  describe(`select behaviour host (${variantName})`, () => {
    @Component({ template: '', imports: [] })
    class BehaviourHost {
      readonly options = [
        { value: 'red', label: 'Red' },
        { value: 'green', label: 'Green' },
      ];
      readonly nodes = [{ value: 'red' }, { value: 'green' }];
      readonly idFn = (v: unknown): string => String(v);
      readonly labelFn = (v: unknown): string => String(v);
      readonly mode = signal<CngxSelectCommitMode>('optimistic');
      pending: Subject<unknown> | null = null;
      readonly commitAction = (): Observable<unknown> => {
        const subject = new Subject<unknown>();
        this.pending = subject;
        return subject.asObservable();
      };
    }

    const mountedRoots: HTMLElement[] = [];
    afterEach(() => {
      mountedRoots.splice(0).forEach((el) => el.remove());
    });

    function mount() {
      polyfillPopover();
      TestBed.overrideComponent(BehaviourHost, {
        set: {
          template: `
            <button type="button" class="outside-btn">Outside</button>
            <${elementSelector}
              [label]="'Colour'"
              ${opts.inputs}
              [presentation]="'anchored'"
              [commitAction]="commitAction"
              [commitMode]="mode()"
            >${opts.content ?? ''}</${elementSelector}>
          `,
          imports: [component, ...(opts.contentImports ?? [])],
        },
      });
      const fixture = TestBed.createComponent(BehaviourHost);
      const root = fixture.nativeElement as HTMLElement;
      document.body.appendChild(root);
      mountedRoots.push(root);
      fixture.detectChanges();
      flush(fixture);
      const de = fixture.debugElement.query(By.directive(component));
      const el = de.nativeElement as HTMLElement;
      const cmp = de.componentInstance as unknown;
      const variant = cmp as VariantApi;
      const panel = () => el.querySelector<HTMLElement>('.cngx-select__panel')!;
      const pick = () => {
        if (opts.commitPick) {
          opts.commitPick(cmp, fixture as ComponentFixture<unknown>);
        } else {
          variant.open();
          flush(fixture);
          panel().querySelectorAll<HTMLElement>(opts.optionSelector)[1].click();
        }
        flush(fixture);
      };
      return { fixture, host: fixture.componentInstance, el, cmp, variant, panel, pick };
    }

    it.each(['resolve', 'reject'] as const)(
      'neither writes, emits nor speaks when a commit settles (%s) after destroy',
      (outcome) => {
        const { fixture, host, cmp, pick } = mount();
        pick();
        expect(host.pending).not.toBeNull();
        const valueAtDestroy = opts.readValue(cmp);
        const announce = vi
          .spyOn(TestBed.inject(CngxSelectAnnouncer), 'announce')
          .mockImplementation(() => undefined);
        const emit = vi.spyOn(OutputEmitterRef.prototype, 'emit');
        fixture.destroy();
        if (outcome === 'resolve') {
          host.pending!.next(undefined);
          host.pending!.complete();
        } else {
          host.pending!.error(new Error('server down'));
        }
        const lateEmits = emittedAfterDestroy(emit.mock.contexts);
        const spoken = announce.mock.calls.map((args) => args[0]);
        emit.mockRestore();
        announce.mockRestore();
        expect(lateEmits).toBe(0);
        expect(spoken).toEqual([]);
        expect(opts.readValue(cmp)).toEqual(valueAtDestroy);
      },
    );
  });
}
