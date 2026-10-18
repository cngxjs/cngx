import { Component, OutputEmitterRef, signal, type Type } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { form, validate } from '@angular/forms/signals';
import { By } from '@angular/platform-browser';
import { Subject, type Observable } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CngxFormField, CngxFormFieldPresenter } from '@cngx/forms/field';

import { CngxSelectAnnouncer } from '../announcer';
import type { CngxSelectCommitErrorDisplay, CngxSelectCommitMode } from '../commit-action.types';

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
  close(): void;
  readonly panelOpen: () => boolean;
}

interface MountOptions {
  /** Wraps the variant in a touched, invalid `cngx-form-field`. */
  readonly inField?: boolean;
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
 * the host is destroyed neither writes, emits nor speaks; a failed commit
 * stays reachable from the trigger while the panel is closed.
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
    @Component({ template: '', imports: [], host: { 'data-select-behaviour-host': '' } })
    class BehaviourHost {
      readonly options = [
        { value: 'red', label: 'Red' },
        { value: 'green', label: 'Green' },
      ];
      readonly nodes = [{ value: 'red' }, { value: 'green' }];
      readonly idFn = (v: unknown): string => String(v);
      readonly labelFn = (v: unknown): string => String(v);
      readonly mode = signal<CngxSelectCommitMode>('optimistic');
      readonly display = signal<CngxSelectCommitErrorDisplay>('banner');
      readonly model = signal<{ pick: string | null }>({ pick: null });
      readonly f = form(this.model, (p) => {
        validate(p.pick, () => ({ kind: 'rejected' }));
      });
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

    function mount(mountOpts: MountOptions = {}) {
      polyfillPopover();
      const variantTag = `
            <${elementSelector}
              [label]="'Colour'"
              ${opts.inputs}
              [presentation]="'anchored'"
              [commitAction]="commitAction"
              [commitMode]="mode()"
              [commitErrorDisplay]="display()"
            >${opts.content ?? ''}</${elementSelector}>`;
      const body = mountOpts.inField
        ? `<cngx-form-field [field]="f.pick">${variantTag}</cngx-form-field>`
        : variantTag;
      TestBed.overrideComponent(BehaviourHost, {
        set: {
          template: `
            <button type="button" class="outside-btn">Outside</button>
            ${body}
          `,
          imports: [component, CngxFormField, ...(opts.contentImports ?? [])],
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
      const trigger = () => {
        const t = el.querySelector<HTMLElement>('[role="combobox"]');
        expect(t, `${elementSelector} renders no role="combobox" element`).not.toBeNull();
        return t!;
      };
      const closePanel = () => {
        if (variant.panelOpen()) {
          variant.close();
        }
        flush(fixture);
      };
      return {
        fixture,
        host: fixture.componentInstance,
        de,
        el,
        cmp,
        variant,
        panel,
        pick,
        trigger,
        closePanel,
      };
    }

    function idrefs(el: HTMLElement, attr: string): string[] {
      return (el.getAttribute(attr) ?? '').split(/\s+/).filter(Boolean);
    }

    function textOfRefs(el: HTMLElement, attr: string): string[] {
      return idrefs(el, attr).map((id) => document.getElementById(id)?.textContent ?? '');
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

    it.each(['banner', 'inline'] as const)(
      'references a failed commit from the trigger while the panel is closed (%s)',
      (display) => {
        const { fixture, host, panel, pick, trigger, closePanel } = mount();
        host.display.set(display);
        flush(fixture);
        pick();
        host.pending!.error(new Error('server down'));
        flush(fixture);
        closePanel();
        const t = trigger();
        expect(t.getAttribute('aria-invalid')).toBe('true');
        const ref = t.getAttribute('aria-errormessage');
        expect(ref).not.toBeNull();
        const node = document.getElementById(ref!);
        expect(node?.textContent).toContain('Save failed');
        expect(panel().contains(node)).toBe(false);
        expect(idrefs(t, 'aria-describedby')).toContain(ref);
      },
    );

    it("references nothing when the display is 'none'", () => {
      const { fixture, host, pick, trigger, closePanel } = mount();
      host.display.set('none');
      flush(fixture);
      pick();
      host.pending!.error(new Error('server down'));
      flush(fixture);
      closePanel();
      expect(trigger().getAttribute('aria-errormessage')).toBeNull();
      expect(textOfRefs(trigger(), 'aria-describedby').join(' ')).not.toContain('Save failed');
    });

    it('references nothing after a successful commit', () => {
      const { fixture, host, pick, trigger, closePanel } = mount();
      pick();
      host.pending!.next(undefined);
      host.pending!.complete();
      flush(fixture);
      closePanel();
      expect(trigger().getAttribute('aria-errormessage')).toBeNull();
      expect(textOfRefs(trigger(), 'aria-describedby').join(' ')).not.toContain('Save failed');
    });

    it('keeps the field error on aria-errormessage and describes the failed commit', () => {
      const { fixture, host, de, pick, trigger, closePanel } = mount({ inField: true });
      // Pessimistic: nothing is written into the bound field, only its error shows.
      host.mode.set('pessimistic');
      host.f.pick().markAsTouched();
      flush(fixture);
      pick();
      host.pending!.error(new Error('server down'));
      flush(fixture);
      closePanel();
      const presenter = de.injector.get(CngxFormFieldPresenter);
      expect(trigger().getAttribute('aria-errormessage')).toBe(presenter.errorId());
      expect(textOfRefs(trigger(), 'aria-describedby').join(' ')).toContain('Save failed');
    });
  });
}
