import { Component, signal, type Type } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CngxPopoverSheet, type CngxPopoverPresentationRequest } from '@cngx/common/popover';
import { CngxFormField, type CngxFieldAccessor } from '@cngx/forms/field';
import { Subject, type Observable } from 'rxjs';
import { describe, expect, it, vi, type Mock } from 'vitest';

import { CngxSelectAnnouncer } from '../announcer';
import type { CngxSelectCommitMode } from '../commit-action.types';
import {
  CNGX_DISMISS_HANDLER_FACTORY,
  createDismissHandler,
  type DismissHandler,
} from '../dismiss-handler';

/** @internal What a variant's mobile-sheet spec needs to know about it. */
export interface MobileSheetSpecOptions {
  /** Inputs that make the variant render options, bound on the host below. */
  readonly inputs: string;
  /** Projected content (declarative options). */
  readonly content?: string;
  /** Standalone imports the projected content needs. */
  readonly contentImports?: readonly Type<unknown>[];
  /** Selector of one pickable row inside the panel. */
  readonly optionSelector: string;
  readonly fill: 'sheet' | 'fullscreen';
  readonly showDone: boolean;
  readonly showInput: boolean;
  /**
   * `false` where the variant's toggle path does not announce commit errors
   * yet (`CngxTreeSelect`); the spec then checks a pessimistic success.
   */
  readonly announcesCommitError?: boolean;
  /** Field factory; `@cngx/forms/field/testing` is a spec-only alias. */
  readonly makeField: () => {
    readonly accessor: CngxFieldAccessor;
    readonly touched: () => boolean;
  };
}

interface VariantApi {
  open(): void;
  readonly panelOpen: () => boolean;
  readonly isCommitting: () => boolean;
  readonly closed: { subscribe(fn: () => void): unknown };
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

function flush(fixture: ComponentFixture<unknown>): void {
  TestBed.flushEffects();
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
}

/**
 * Shared spec for the mobile sheet of a select-family variant: modal
 * presentation and header shape, one close path per outside tap, the
 * pessimistic-pending block on every close vector, focus back to the
 * trigger without a body hop or a touched field, and announcements spoken
 * from the sheet region only.
 *
 * @internal
 */
export function describeMobileSheet(
  variantName: string,
  component: Type<unknown>,
  elementSelector: string,
  opts: MobileSheetSpecOptions,
): void {
  describe(`mobile sheet (${variantName})`, () => {
    @Component({ template: '', imports: [] })
    class SheetHost {
      readonly options = [
        { value: 'red', label: 'Red' },
        { value: 'green', label: 'Green' },
      ];
      readonly nodes = [{ value: 'red' }, { value: 'green' }];
      readonly idFn = (v: unknown): string => String(v);
      readonly labelFn = (v: unknown): string => String(v);
      readonly presentation = signal<CngxPopoverPresentationRequest | undefined>(opts.fill);
      readonly mode = signal<CngxSelectCommitMode>('optimistic');
      readonly mock = opts.makeField();
      readonly field = this.mock.accessor;
      pending: Subject<unknown> | null = null;
      readonly commitAction = (): Observable<unknown> => {
        const subject = new Subject<unknown>();
        this.pending = subject;
        return subject.asObservable();
      };
    }

    let spies: {
      handleClickOutside: Mock<() => void>;
      handleSheetClose: Mock<(reason: string) => void>;
    };

    function setup() {
      polyfillPopover();
      spies = { handleClickOutside: vi.fn(), handleSheetClose: vi.fn() };
      TestBed.configureTestingModule({
        providers: [
          {
            provide: CNGX_DISMISS_HANDLER_FACTORY,
            useValue: (o: Parameters<typeof createDismissHandler>[0]): DismissHandler => {
              const real = createDismissHandler(o);
              return {
                handleClickOutside: () => {
                  spies.handleClickOutside();
                  real.handleClickOutside();
                },
                handleSheetClose: (reason) => {
                  spies.handleSheetClose(reason);
                  real.handleSheetClose?.(reason);
                },
              };
            },
          },
        ],
      });
      TestBed.overrideComponent(SheetHost, {
        set: {
          template: `
            <button type="button" class="page-btn">Page</button>
            <cngx-form-field [field]="field">
              <${elementSelector}
                [label]="'Colour'"
                ${opts.inputs}
                [presentation]="presentation()"
                [commitAction]="commitAction"
                [commitMode]="mode()"
              >${opts.content ?? ''}</${elementSelector}>
            </cngx-form-field>
          `,
          imports: [CngxFormField, component, ...(opts.contentImports ?? [])],
        },
      });
      const fixture = TestBed.createComponent(SheetHost);
      fixture.detectChanges();
      flush(fixture);
      const de = fixture.debugElement.query(By.directive(component));
      const el = de.nativeElement as HTMLElement;
      const variant = de.componentInstance as VariantApi;
      const panel = el.querySelector<HTMLElement>('.cngx-select__panel')!;
      const sheet = () => de.query(By.directive(CngxPopoverSheet)).injector.get(CngxPopoverSheet);
      const open = () => {
        variant.open();
        flush(fixture);
      };
      const pickSecond = () => {
        panel.querySelectorAll<HTMLElement>(opts.optionSelector)[1].click();
        flush(fixture);
      };
      const x = () => el.querySelector<HTMLElement>('.cngx-select-sheet-header__close')!;
      const root = fixture.nativeElement as HTMLElement;
      const page = () => root.querySelector<HTMLElement>('.page-btn')!;
      return {
        fixture,
        host: fixture.componentInstance,
        el,
        variant,
        panel,
        sheet,
        open,
        pickSecond,
        x,
        page,
      };
    }

    it(`opens as a modal ${opts.fill} with the variant's header`, () => {
      const { panel, open } = setup();
      open();
      expect(panel.getAttribute('data-cngx-presentation')).toBe(opts.fill);
      expect(panel.getAttribute('role')).toBe('dialog');
      expect(panel.getAttribute('aria-modal')).toBe('true');
      expect(panel.firstElementChild?.tagName.toLowerCase()).toBe('cngx-select-sheet-header');
      const title = panel.querySelector<HTMLElement>('.cngx-select-sheet-header__title')!;
      expect(panel.getAttribute('aria-labelledby')).toBe(title.id);
      expect(title.textContent?.trim()).toBe('Colour');
      expect(!!panel.querySelector('.cngx-select-sheet-header__done')).toBe(opts.showDone);
      expect(!!panel.querySelector('.cngx-select-sheet-header__input')).toBe(opts.showInput);
      expect(panel.style.getPropertyValue('--cngx-select-panel-min-width')).toBe('');
    });

    it('resolves auto to anchored on a desktop viewport', () => {
      const { fixture, host, panel } = setup();
      host.presentation.set(undefined);
      flush(fixture);
      expect(panel.getAttribute('data-cngx-sheet')).toBe('auto');
      expect(panel.getAttribute('data-cngx-presentation')).toBe('anchored');
    });

    it('closes an outside tap through handleSheetClose once and never through the anchored path', () => {
      const { fixture, variant, open, page } = setup();
      open();
      page().dispatchEvent(new Event('pointerdown', { bubbles: true }));
      page().click();
      flush(fixture);
      expect(spies.handleSheetClose).toHaveBeenCalledExactlyOnceWith('backdrop');
      expect(spies.handleClickOutside).not.toHaveBeenCalled();
      expect(variant.panelOpen()).toBe(false);
    });

    it('keeps the sheet open on every close vector while a pessimistic commit is pending', () => {
      const { fixture, host, el, variant, open, pickSecond, sheet, x, page } = setup();
      host.mode.set('pessimistic');
      flush(fixture);
      open();
      pickSecond();
      expect(variant.isCommitting()).toBe(true);

      expect(x().getAttribute('aria-disabled')).toBe('true');
      x().click();
      el.querySelector<HTMLElement>('.cngx-select-sheet-header__done')?.click();
      sheet().requestClose('swipe');
      sheet().requestClose('back');
      page().dispatchEvent(new Event('pointerdown', { bubbles: true }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      flush(fixture);
      expect(variant.panelOpen()).toBe(true);
    });

    it('returns focus panel -> trigger on X without a body drop or a touched field', () => {
      const { fixture, host, el, panel, open, x } = setup();
      open();
      expect(panel.contains(document.activeElement)).toBe(true);

      const drops: EventTarget[] = [];
      const log = (event: FocusEvent) => {
        if (event.relatedTarget === null && event.target) {
          drops.push(event.target);
        }
      };
      x().focus();
      document.addEventListener('focusout', log, true);
      x().click();
      const active = document.activeElement;
      flush(fixture);
      document.removeEventListener('focusout', log, true);

      expect(el.contains(active)).toBe(true);
      expect(panel.contains(active)).toBe(false);
      expect(drops).toEqual([]);
      expect(host.mock.touched()).toBe(false);
    });

    it('speaks while open from the sheet region only', () => {
      const { fixture, host, open, pickSecond, sheet } = setup();
      const root = vi
        .spyOn(TestBed.inject(CngxSelectAnnouncer), 'announce')
        .mockImplementation(() => undefined);
      host.mode.set('pessimistic');
      flush(fixture);
      open();
      const inSheet = vi.spyOn(sheet(), 'announce');
      pickSecond();
      if (opts.announcesCommitError === false) {
        host.pending!.next(['green']);
        host.pending!.complete();
      } else {
        host.pending!.error(new Error('server down'));
      }
      flush(fixture);
      expect(root).not.toHaveBeenCalled();
      expect(inSheet).toHaveBeenCalled();
    });

    if (opts.showInput) {
      it('keeps the sheet open on Escape in the header input while a pessimistic commit is pending', () => {
        const { fixture, host, el, variant, panel, open, pickSecond } = setup();
        host.mode.set('pessimistic');
        flush(fixture);
        open();
        pickSecond();
        const input = panel.querySelector<HTMLInputElement>('.cngx-select-sheet-header__input')!;
        input.focus();
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        flush(fixture);
        expect(variant.panelOpen()).toBe(true);
        expect(panel.contains(document.activeElement)).toBe(true);
        expect(el.contains(document.activeElement)).toBe(true);
      });

      it('closes once on Escape in the header input', () => {
        const { fixture, variant, panel, open } = setup();
        const closed = vi.fn();
        variant.closed.subscribe(closed);
        open();
        const input = panel.querySelector<HTMLInputElement>('.cngx-select-sheet-header__input')!;
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        flush(fixture);
        expect(variant.panelOpen()).toBe(false);
        expect(spies.handleSheetClose).toHaveBeenCalledExactlyOnceWith('close');
        expect(closed).toHaveBeenCalledTimes(1);
      });

      it('writes the header term through the trigger input', () => {
        const { el, panel, open } = setup();
        open();
        const header = panel.querySelector<HTMLInputElement>('.cngx-select-sheet-header__input')!;
        header.value = 'gr';
        header.dispatchEvent(new Event('input'));
        const trigger = Array.from(el.querySelectorAll<HTMLInputElement>('input')).find(
          (i) => i !== header && !panel.contains(i),
        );
        expect(trigger?.value).toBe('gr');
      });
    }
  });
}
