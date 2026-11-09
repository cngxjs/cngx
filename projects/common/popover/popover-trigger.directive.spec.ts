import { Component, Directive, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxPopover } from './popover.directive';
import { CngxPopoverPanel } from './popover-panel.component';
import { CngxPopoverBody, CngxPopoverHeader } from './popover-panel-slots';
import { CngxPopoverAnchor } from './popover-anchor.directive';
import { CngxPopoverSheet } from './popover-sheet.directive';
import { CngxPopoverTrigger } from './popover-trigger.directive';
import {
  CNGX_POPOVER_PRESENTATION,
  type CngxPopoverPresentation,
  type CngxPopoverPresentationSeam,
} from './popover-presentation';

// ── Test helpers ────────────────────────────────────────────────────────

function stubPopoverElement(el: HTMLElement): void {
  const rec = el as unknown as Record<string, unknown>;
  rec['showPopover'] = vi.fn();
  rec['hidePopover'] = vi.fn();
  rec['togglePopover'] = vi.fn();

  vi.spyOn(globalThis, 'getComputedStyle').mockReturnValue({
    transitionDuration: '0s',
  } as unknown as CSSStyleDeclaration);
}

// ── Test hosts ──────────────────────────────────────────────────────────

@Component({
  template: `
    <button [cngxPopoverTrigger]="pop" id="trigger">Open</button>
    <div cngxPopover #pop="cngxPopover">Content</div>
  `,
  imports: [CngxPopover, CngxPopoverTrigger],
})
class BasicTriggerHost {
  readonly popover = viewChild.required(CngxPopover);
  readonly trigger = viewChild.required(CngxPopoverTrigger);
}

@Component({
  template: `
    <button [cngxPopoverTrigger]="pop" haspopup="menu" id="trigger">Menu</button>
    <div cngxPopover #pop="cngxPopover">Menu items</div>
  `,
  imports: [CngxPopover, CngxPopoverTrigger],
})
class MenuTriggerHost {
  readonly popover = viewChild.required(CngxPopover);
  readonly trigger = viewChild.required(CngxPopoverTrigger);
}

@Component({
  template: `
    <button [cngxPopoverTrigger]="pop" id="trigger">Open</button>
    <div cngxPopover #pop="cngxPopover"><ul role="menu" id="inner-menu"></ul></div>
  `,
  imports: [CngxPopover, CngxPopoverTrigger],
})
class ControlsHintHost {
  readonly popover = viewChild.required(CngxPopover);
}

@Component({
  template: `
    <button [cngxPopoverTrigger]="pop" id="trigger">Open</button>
    <div cngxPopover cngxPopoverSheet="sheet" #pop="cngxPopover"><ul role="menu"></ul></div>
  `,
  imports: [CngxPopover, CngxPopoverTrigger, CngxPopoverSheet],
})
class SheetControlsHintHost {
  readonly popover = viewChild.required(CngxPopover);
}

@Component({
  template: `
    <button [cngxPopoverTrigger]="pop" [controls]="controls()" id="trigger">Open</button>
    <div cngxPopover #pop="cngxPopover"><div role="listbox" id="inner-list"></div></div>
  `,
  imports: [CngxPopover, CngxPopoverTrigger],
})
class ControlsTriggerHost {
  readonly popover = viewChild.required(CngxPopover);
  readonly controls = signal<string | null | undefined>('inner-list');
}

@Component({
  template: `
    <button [cngxPopoverTrigger]="pop" haspopup="none" id="trigger">Disclose</button>
    <div cngxPopover #pop="cngxPopover">Link list</div>
  `,
  imports: [CngxPopover, CngxPopoverTrigger],
})
class NoneHaspopupHost {
  readonly popover = viewChild.required(CngxPopover);
  readonly trigger = viewChild.required(CngxPopoverTrigger);
}

@Component({
  template: `
    <button [cngxPopoverTrigger]="pop" [restoreFocus]="true" id="trigger">Open</button>
    <div cngxPopover #pop="cngxPopover">Restorable</div>
  `,
  imports: [CngxPopover, CngxPopoverTrigger],
})
class RestoreFocusHost {
  readonly popover = viewChild.required(CngxPopover);
  readonly trigger = viewChild.required(CngxPopoverTrigger);
}

@Component({
  template: `
    <button [cngxPopoverTrigger]="pop" [restoreFocus]="restore()" id="trigger">Open</button>
    <div cngxPopover #pop="cngxPopover">Claimed</div>
  `,
  imports: [CngxPopover, CngxPopoverTrigger],
})
class RestoreClaimHost {
  readonly popover = viewChild.required(CngxPopover);
  readonly restore = signal<boolean | undefined>(undefined);
}

@Component({
  template: `
    <button [cngxPopoverTrigger]="panel.popover" [restoreFocus]="restore()" id="trigger">
      Open
    </button>
    <button id="outside" type="button">Outside</button>
    <cngx-popover-panel #panel [showClose]="true" [empty]="empty()">
      <span cngxPopoverHeader>Recent activity</span>
      <div cngxPopoverBody><button id="inside" type="button">Done</button></div>
    </cngx-popover-panel>
  `,
  imports: [CngxPopoverTrigger, CngxPopoverPanel, CngxPopoverHeader, CngxPopoverBody],
})
class PanelTriggerHost {
  readonly panel = viewChild.required(CngxPopoverPanel);
  readonly restore = signal<boolean | undefined>(undefined);
  readonly empty = signal(false);
}

/** Presentation modifier whose layout a spec flips directly. */
@Directive({
  selector: '[testPresentation]',
  providers: [{ provide: CNGX_POPOVER_PRESENTATION, useExisting: TestPresentation }],
})
class TestPresentation implements CngxPopoverPresentationSeam {
  readonly presentation = signal<CngxPopoverPresentation>('anchored');
  onShown(): void {
    /* no-op */
  }
  onHide(): void {
    /* no-op */
  }
}

@Component({
  template: `
    <button [cngxPopoverTrigger]="pop" id="trigger">Open</button>
    <div cngxPopover testPresentation #pop="cngxPopover">Flippable</div>
  `,
  imports: [CngxPopover, CngxPopoverTrigger, TestPresentation],
})
class FlippingPresentationHost {
  readonly popover = viewChild.required(CngxPopover);
  readonly presentation = viewChild.required(TestPresentation);
}

@Component({
  template: `
    @if (showTrigger()) {
      <button [cngxPopoverTrigger]="pop" id="trigger">Open</button>
    }
    <div cngxPopover #pop="cngxPopover">Content</div>
  `,
  imports: [CngxPopover, CngxPopoverTrigger],
})
class ConditionalTriggerHost {
  readonly popover = viewChild.required(CngxPopover);
  readonly showTrigger = signal(true);
}

@Component({
  template: `
    <button [cngxPopoverTrigger]="pop" id="first">First</button>
    <button [cngxPopoverTrigger]="pop" id="second">Second</button>
    <div cngxPopover #pop="cngxPopover">Content</div>
  `,
  imports: [CngxPopover, CngxPopoverTrigger],
})
class TwoTriggersHost {
  readonly popover = viewChild.required(CngxPopover);
}

@Component({
  template: `
    @if (showTrigger()) {
      <button [cngxPopoverTrigger]="pop" [restoreFocus]="true" id="trigger">Open</button>
    }
    <button id="outside" type="button">Outside</button>
    <div cngxPopover #pop="cngxPopover">Content</div>
  `,
  imports: [CngxPopover, CngxPopoverTrigger],
})
class ConditionalRestoreTriggerHost {
  readonly popover = viewChild.required(CngxPopover);
  readonly showTrigger = signal(true);
}

@Component({
  template: `
    @if (showTrigger()) {
      <button [cngxPopoverTrigger]="pop" id="trigger">Open</button>
    }
    @if (showAnchor()) {
      <div id="anchor" [cngxPopoverAnchor]="pop"></div>
    }
    <div cngxPopover #pop="cngxPopover">Content</div>
  `,
  imports: [CngxPopover, CngxPopoverTrigger, CngxPopoverAnchor],
})
class TriggerWithAnchorHost {
  readonly showTrigger = signal(true);
  readonly showAnchor = signal(true);
  readonly popover = viewChild.required(CngxPopover);
}

function setup<T>(hostType: new () => T) {
  const fixture = TestBed.createComponent(hostType);
  fixture.detectChanges();
  TestBed.flushEffects();
  const triggerEl = fixture.nativeElement.querySelector('#trigger') as HTMLElement;
  const popoverEl = fixture.nativeElement.querySelector('[cngxpopover]') as HTMLElement;
  stubPopoverElement(popoverEl);
  return { fixture, triggerEl, popoverEl };
}

// ── Tests ───────────────────────────────────────────────────────────────

describe('CngxPopoverTrigger', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ARIA attributes', () => {
    it('should set aria-expanded to false when popover is closed', () => {
      const { triggerEl } = setup(BasicTriggerHost);
      expect(triggerEl.getAttribute('aria-expanded')).toBe('false');
    });

    it('should set aria-expanded to true when popover is visible', () => {
      const { fixture, triggerEl } = setup(BasicTriggerHost);
      const host = fixture.componentInstance as BasicTriggerHost;
      host.popover().show();
      fixture.detectChanges();
      expect(triggerEl.getAttribute('aria-expanded')).toBe('true');
    });

    it('should set aria-controls to the popover id', () => {
      const { fixture, triggerEl } = setup(BasicTriggerHost);
      const host = fixture.componentInstance as BasicTriggerHost;
      expect(triggerEl.getAttribute('aria-controls')).toBe(host.popover().id());
    });

    it('lets a controls override name the popup element, null or unset fall back', () => {
      const { fixture, triggerEl } = setup(ControlsTriggerHost);
      const host = fixture.componentInstance as ControlsTriggerHost;
      expect(triggerEl.getAttribute('aria-controls')).toBe('inner-list');
      host.controls.set(null);
      fixture.detectChanges();
      expect(triggerEl.getAttribute('aria-controls')).toBe(host.popover().id());
      host.controls.set(undefined);
      fixture.detectChanges();
      expect(triggerEl.getAttribute('aria-controls')).toBe(host.popover().id());
    });

    it('names the element a composer registers through the controls hint', () => {
      const { fixture, triggerEl } = setup(ControlsHintHost);
      const host = fixture.componentInstance as ControlsHintHost;
      host.popover().claimControls(host, signal('inner-menu'));
      fixture.detectChanges();
      expect(host.popover().controlsHint()).toBe('inner-menu');
      expect(triggerEl.getAttribute('aria-controls')).toBe('inner-menu');
    });

    it('follows a change of the registered source without another claim', () => {
      const { fixture, triggerEl } = setup(ControlsHintHost);
      const host = fixture.componentInstance as ControlsHintHost;
      const source = signal('inner-menu');
      host.popover().claimControls(host, source);
      fixture.detectChanges();
      source.set('renamed-menu');
      fixture.detectChanges();
      expect(triggerEl.getAttribute('aria-controls')).toBe('renamed-menu');
    });

    it('clears the hint when the owner releases its claim', () => {
      const { fixture, triggerEl } = setup(ControlsHintHost);
      const host = fixture.componentInstance as ControlsHintHost;
      host.popover().claimControls(host, signal('inner-menu'));
      fixture.detectChanges();
      host.popover().releaseControls(host);
      fixture.detectChanges();
      expect(host.popover().controlsHint()).toBeNull();
      expect(triggerEl.getAttribute('aria-controls')).toBe(host.popover().id());
    });

    it('lets a bound controls win over the hint', () => {
      const { fixture, triggerEl } = setup(ControlsTriggerHost);
      const host = fixture.componentInstance as ControlsTriggerHost;
      host.popover().claimControls(host, signal('hinted'));
      fixture.detectChanges();
      expect(triggerEl.getAttribute('aria-controls')).toBe('inner-list');
    });

    it('ignores the hint in a sheet presentation and names the popover', () => {
      const { fixture, triggerEl } = setup(SheetControlsHintHost);
      const host = fixture.componentInstance as SheetControlsHintHost;
      host.popover().claimControls(host, signal('inner-menu'));
      fixture.detectChanges();
      expect(host.popover().controlsHint()).toBeNull();
      expect(triggerEl.getAttribute('aria-controls')).toBe(host.popover().id());
    });

    it('should set aria-haspopup to true by default', () => {
      const { triggerEl } = setup(BasicTriggerHost);
      expect(triggerEl.getAttribute('aria-haspopup')).toBe('true');
    });

    it('should set aria-haspopup to menu when configured', () => {
      const { triggerEl } = setup(MenuTriggerHost);
      expect(triggerEl.getAttribute('aria-haspopup')).toBe('menu');
    });

    it('should pick up the popover haspopup signal as default', () => {
      const { fixture, triggerEl } = setup(BasicTriggerHost);
      const host = fixture.componentInstance as BasicTriggerHost;
      host.popover().claimHaspopup(host, 'dialog');
      fixture.detectChanges();
      expect(triggerEl.getAttribute('aria-haspopup')).toBe('dialog');
    });

    it('should let consumer haspopup override the popover hint', () => {
      const { fixture, triggerEl } = setup(MenuTriggerHost);
      const host = fixture.componentInstance as MenuTriggerHost;
      host.popover().claimHaspopup(host, 'dialog');
      fixture.detectChanges();
      expect(triggerEl.getAttribute('aria-haspopup')).toBe('menu');
    });

    it('should emit no aria-haspopup when configured with none', () => {
      const { triggerEl } = setup(NoneHaspopupHost);
      expect(triggerEl.hasAttribute('aria-haspopup')).toBe(false);
    });

    it('should let none cancel the popover haspopup hint', () => {
      const { fixture, triggerEl } = setup(NoneHaspopupHost);
      const host = fixture.componentInstance as NoneHaspopupHost;
      host.popover().claimHaspopup(host, 'dialog');
      fixture.detectChanges();
      expect(triggerEl.hasAttribute('aria-haspopup')).toBe(false);
    });
  });

  describe('focus restoration', () => {
    let testRoot: HTMLElement;

    beforeEach(() => {
      testRoot = document.createElement('div');
      document.body.appendChild(testRoot);
    });

    afterEach(() => {
      testRoot.remove();
    });

    it('should not move focus on close by default', () => {
      const fixture = TestBed.createComponent(BasicTriggerHost);
      testRoot.appendChild(fixture.nativeElement);
      fixture.detectChanges();
      TestBed.flushEffects();
      const triggerEl = fixture.nativeElement.querySelector('#trigger') as HTMLElement;
      const popoverEl = fixture.nativeElement.querySelector('[cngxpopover]') as HTMLElement;
      stubPopoverElement(popoverEl);

      const externalBtn = document.createElement('button');
      testRoot.appendChild(externalBtn);
      externalBtn.focus();
      const host = fixture.componentInstance as BasicTriggerHost;
      host.popover().show();
      fixture.detectChanges();
      host.popover().hide();
      fixture.detectChanges();
      expect(document.activeElement).not.toBe(triggerEl);
      fixture.destroy();
    });

    function closeFromInsidePanel(restore: boolean | undefined) {
      const fixture = TestBed.createComponent(RestoreClaimHost);
      fixture.componentInstance.restore.set(restore);
      testRoot.appendChild(fixture.nativeElement);
      fixture.detectChanges();
      TestBed.flushEffects();
      const triggerEl = fixture.nativeElement.querySelector('#trigger') as HTMLElement;
      const popoverEl = fixture.nativeElement.querySelector('[cngxpopover]') as HTMLElement;
      stubPopoverElement(popoverEl);
      const host = fixture.componentInstance;
      host.popover().claimRestoreFocus(host, true);
      fixture.detectChanges();
      TestBed.flushEffects();

      triggerEl.focus();
      host.popover().show();
      fixture.detectChanges();
      TestBed.flushEffects();
      const panelItem = document.createElement('button');
      popoverEl.appendChild(panelItem);
      panelItem.focus();
      host.popover().hide();
      fixture.detectChanges();
      TestBed.flushEffects();
      const active = document.activeElement;
      fixture.destroy();
      return { active, triggerEl };
    }

    it('restores focus through a composer claim when no input is bound', () => {
      const { active, triggerEl } = closeFromInsidePanel(undefined);
      expect(active).toBe(triggerEl);
    });

    it('lets [restoreFocus]="false" beat a composer claim', () => {
      const { active, triggerEl } = closeFromInsidePanel(false);
      expect(active).not.toBe(triggerEl);
    });

    describe('bound to a CngxPopoverPanel', () => {
      function mountPanel(configure?: (host: PanelTriggerHost) => void) {
        const fixture = TestBed.createComponent(PanelTriggerHost);
        configure?.(fixture.componentInstance);
        testRoot.appendChild(fixture.nativeElement);
        fixture.detectChanges();
        TestBed.flushEffects();
        const root = fixture.nativeElement as HTMLElement;
        const popoverEl = root.querySelector('cngx-popover-panel') as HTMLElement;
        stubPopoverElement(popoverEl);
        const triggerEl = root.querySelector('#trigger') as HTMLElement;
        const popover = fixture.componentInstance.panel().popover;
        const flush = () => {
          fixture.detectChanges();
          TestBed.flushEffects();
        };
        const open = () => {
          triggerEl.focus();
          popover.show();
          flush();
        };
        return { fixture, root, triggerEl, popover, flush, open };
      }

      it('returns focus to the trigger when the panel hides with focus inside', () => {
        const { fixture, root, triggerEl, popover, flush, open } = mountPanel();
        open();
        root.querySelector<HTMLButtonElement>('#inside')!.focus();
        popover.hide();
        flush();
        expect(document.activeElement).toBe(triggerEl);
        fixture.destroy();
      });

      it('returns focus to the trigger from the built-in close, also in the empty view', () => {
        for (const empty of [false, true]) {
          const { fixture, root, triggerEl, flush, open } = mountPanel((h) => h.empty.set(empty));
          open();
          const close = root.querySelector<HTMLButtonElement>('button.cngx-popover-panel__close')!;
          close.focus();
          close.click();
          flush();
          expect(document.activeElement, `empty=${empty}`).toBe(triggerEl);
          fixture.destroy();
        }
      });

      it('leaves focus on body with [restoreFocus]="false"', () => {
        const { fixture, root, popover, flush, open } = mountPanel((h) => h.restore.set(false));
        open();
        root.querySelector<HTMLButtonElement>('#inside')!.focus();
        popover.hide();
        flush();
        expect(document.activeElement).toBe(document.body);
        fixture.destroy();
      });

      it('leaves focus on an outside control the user moved to', () => {
        const { fixture, root, popover, flush, open } = mountPanel();
        open();
        const outside = root.querySelector<HTMLButtonElement>('#outside')!;
        outside.focus();
        popover.hide();
        flush();
        expect(document.activeElement).toBe(outside);
        fixture.destroy();
      });
    });

    it('drops its snapshot when restore turns off mid-open, so a later flip moves no focus', () => {
      const fixture = TestBed.createComponent(FlippingPresentationHost);
      testRoot.appendChild(fixture.nativeElement);
      fixture.detectChanges();
      TestBed.flushEffects();
      const triggerEl = fixture.nativeElement.querySelector('#trigger') as HTMLElement;
      const popoverEl = fixture.nativeElement.querySelector('[cngxpopover]') as HTMLElement;
      stubPopoverElement(popoverEl);
      const host = fixture.componentInstance;
      const flush = () => {
        fixture.detectChanges();
        TestBed.flushEffects();
      };
      host.popover().claimRestoreFocus(host, true);
      flush();

      triggerEl.focus();
      host.popover().show();
      flush();
      host.presentation().presentation.set('sheet');
      flush();
      host.popover().hide();
      flush();
      triggerEl.blur();
      expect(document.activeElement).toBe(document.body);

      host.presentation().presentation.set('anchored');
      flush();
      expect(document.activeElement).not.toBe(triggerEl);
      fixture.destroy();
    });

    it('should restore focus on close when restoreFocus is true', () => {
      const fixture = TestBed.createComponent(RestoreFocusHost);
      testRoot.appendChild(fixture.nativeElement);
      fixture.detectChanges();
      TestBed.flushEffects();
      const triggerEl = fixture.nativeElement.querySelector('#trigger') as HTMLElement;
      const popoverEl = fixture.nativeElement.querySelector('[cngxpopover]') as HTMLElement;
      stubPopoverElement(popoverEl);

      triggerEl.focus();
      const host = fixture.componentInstance as RestoreFocusHost;
      host.popover().show();
      fixture.detectChanges();
      const panelItem = document.createElement('button');
      popoverEl.appendChild(panelItem);
      panelItem.focus();
      host.popover().hide();
      fixture.detectChanges();
      expect(document.activeElement).toBe(triggerEl);
      fixture.destroy();
    });

    it('restores focus when show() and hide() run before change detection', () => {
      const fixture = TestBed.createComponent(RestoreFocusHost);
      testRoot.appendChild(fixture.nativeElement);
      fixture.detectChanges();
      TestBed.flushEffects();
      const triggerEl = fixture.nativeElement.querySelector('#trigger') as HTMLElement;
      const popoverEl = fixture.nativeElement.querySelector('[cngxpopover]') as HTMLElement;
      stubPopoverElement(popoverEl);

      triggerEl.focus();
      const host = fixture.componentInstance as RestoreFocusHost;
      // A fast keyboard user (Enter, then Escape) opens and closes inside
      // one tick: no change detection runs between show() and hide().
      host.popover().show();
      const panelItem = document.createElement('button');
      popoverEl.appendChild(panelItem);
      panelItem.focus();
      host.popover().hide();
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(document.activeElement).toBe(triggerEl);
      fixture.destroy();
    });

    it('should leave focus on a control outside the panel when the popover closes', () => {
      const fixture = TestBed.createComponent(RestoreFocusHost);
      testRoot.appendChild(fixture.nativeElement);
      fixture.detectChanges();
      TestBed.flushEffects();
      const triggerEl = fixture.nativeElement.querySelector('#trigger') as HTMLElement;
      const popoverEl = fixture.nativeElement.querySelector('[cngxpopover]') as HTMLElement;
      stubPopoverElement(popoverEl);

      triggerEl.focus();
      const host = fixture.componentInstance as RestoreFocusHost;
      host.popover().show();
      fixture.detectChanges();
      // An outside click or an Escape typed in another field closes the
      // popover while focus already sits on that control.
      const elsewhere = document.createElement('input');
      testRoot.appendChild(elsewhere);
      elsewhere.focus();
      host.popover().hide();
      fixture.detectChanges();
      expect(document.activeElement).toBe(elsewhere);
      fixture.destroy();
    });

    it('should restore to the trigger when focus fell to body before the close', () => {
      const fixture = TestBed.createComponent(RestoreFocusHost);
      testRoot.appendChild(fixture.nativeElement);
      fixture.detectChanges();
      TestBed.flushEffects();
      const triggerEl = fixture.nativeElement.querySelector('#trigger') as HTMLElement;
      const popoverEl = fixture.nativeElement.querySelector('[cngxpopover]') as HTMLElement;
      stubPopoverElement(popoverEl);

      triggerEl.focus();
      const host = fixture.componentInstance as RestoreFocusHost;
      host.popover().show();
      fixture.detectChanges();
      (document.activeElement as HTMLElement).blur();
      host.popover().hide();
      fixture.detectChanges();
      expect(document.activeElement).toBe(triggerEl);
      fixture.destroy();
    });

    it('should fall back to the trigger when the pre-open focus target is body', () => {
      const fixture = TestBed.createComponent(RestoreFocusHost);
      testRoot.appendChild(fixture.nativeElement);
      fixture.detectChanges();
      TestBed.flushEffects();
      const triggerEl = fixture.nativeElement.querySelector('#trigger') as HTMLElement;
      const popoverEl = fixture.nativeElement.querySelector('[cngxpopover]') as HTMLElement;
      stubPopoverElement(popoverEl);

      // Safari does not focus a clicked button: the pre-open snapshot is body.
      (document.activeElement as HTMLElement | null)?.blur();
      expect(document.activeElement).toBe(document.body);
      const host = fixture.componentInstance as RestoreFocusHost;
      host.popover().show();
      fixture.detectChanges();
      const panelLink = document.createElement('a');
      panelLink.href = '#';
      popoverEl.appendChild(panelLink);
      panelLink.focus();
      host.popover().hide();
      fixture.detectChanges();
      expect(document.activeElement).toBe(triggerEl);
      fixture.destroy();
    });

    it('should restore to the pre-show focus target even when panel content grabs focus before the capture effect runs', () => {
      const fixture = TestBed.createComponent(RestoreFocusHost);
      testRoot.appendChild(fixture.nativeElement);
      fixture.detectChanges();
      TestBed.flushEffects();
      const triggerEl = fixture.nativeElement.querySelector('#trigger') as HTMLElement;
      const popoverEl = fixture.nativeElement.querySelector('[cngxpopover]') as HTMLElement;
      stubPopoverElement(popoverEl);

      triggerEl.focus();
      const host = fixture.componentInstance as RestoreFocusHost;
      host.popover().show();
      // Simulate content autofocus landing between show() and the
      // trigger's post-CD capture effect - the effect must adopt the
      // popover's pre-show snapshot, not document.activeElement.
      const autofocused = document.createElement('button');
      popoverEl.appendChild(autofocused);
      autofocused.focus();
      fixture.detectChanges();
      host.popover().hide();
      fixture.detectChanges();
      expect(document.activeElement).toBe(triggerEl);
      fixture.destroy();
    });

    it('releases the close listener on trigger destroy, so a later close moves no focus', () => {
      const fixture = TestBed.createComponent(ConditionalRestoreTriggerHost);
      testRoot.appendChild(fixture.nativeElement);
      fixture.detectChanges();
      TestBed.flushEffects();
      const triggerEl = fixture.nativeElement.querySelector('#trigger') as HTMLElement;
      const outsideEl = fixture.nativeElement.querySelector('#outside') as HTMLElement;
      const popoverEl = fixture.nativeElement.querySelector('[cngxpopover]') as HTMLElement;
      stubPopoverElement(popoverEl);
      const host = fixture.componentInstance as ConditionalRestoreTriggerHost;

      host.showTrigger.set(false);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(triggerEl.isConnected).toBe(false);

      // The pre-open origin is a live element, so a listener left behind by
      // the destroyed trigger would move focus onto it.
      outsideEl.focus();
      host.popover().show();
      const panelItem = document.createElement('button');
      popoverEl.appendChild(panelItem);
      panelItem.focus();
      host.popover().hide();
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(document.activeElement).not.toBe(triggerEl);
      expect(document.activeElement).toBe(document.body);
      fixture.destroy();
    });
  });

  describe('close listener', () => {
    it('does not throw or focus a disconnected element when the host is destroyed while open', () => {
      const testRoot = document.createElement('div');
      document.body.appendChild(testRoot);
      const fixture = TestBed.createComponent(RestoreFocusHost);
      testRoot.appendChild(fixture.nativeElement);
      fixture.detectChanges();
      TestBed.flushEffects();
      const triggerEl = fixture.nativeElement.querySelector('#trigger') as HTMLElement;
      const popoverEl = fixture.nativeElement.querySelector('[cngxpopover]') as HTMLElement;
      stubPopoverElement(popoverEl);
      const host = fixture.componentInstance as RestoreFocusHost;

      triggerEl.focus();
      host.popover().show();
      fixture.detectChanges();
      const panelItem = document.createElement('button');
      popoverEl.appendChild(panelItem);
      panelItem.focus();
      expect(host.popover().state()).not.toBe('closed');

      // Record every focus() call with the target's connection state at
      // call time: the popover's destroy runs finalize() and the close
      // listener while the trigger is torn down in the same pass.
      const focusCalls: { el: HTMLElement; connected: boolean }[] = [];
      const realFocus = HTMLElement.prototype.focus;
      const focusSpy = vi
        .spyOn(HTMLElement.prototype, 'focus')
        .mockImplementation(function (this: HTMLElement, options?: FocusOptions) {
          focusCalls.push({ el: this, connected: this.isConnected });
          realFocus.call(this, options);
        });

      expect(() => fixture.destroy()).not.toThrow();
      focusSpy.mockRestore();

      expect(focusCalls.filter((call) => !call.connected)).toEqual([]);
      const active = document.activeElement;
      expect(active === null || active.isConnected).toBe(true);
      testRoot.remove();
    });

    it('warns once when a second trigger takes the close listener of one popover', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const fixture = TestBed.createComponent(TwoTriggersHost);
      fixture.detectChanges();
      TestBed.flushEffects();
      fixture.detectChanges();
      TestBed.flushEffects();

      const takeovers = warnSpy.mock.calls.filter((call) => /^CNGX1081: /.test(String(call[0])));
      expect(takeovers).toHaveLength(1);
      expect(String(takeovers[0][0])).toMatch(/Only the last-registered trigger restores focus/);
      fixture.destroy();
    });

    it('does not warn for a single trigger', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const { fixture } = setup(BasicTriggerHost);
      fixture.detectChanges();
      TestBed.flushEffects();

      const takeovers = warnSpy.mock.calls.filter((call) => /^CNGX1081: /.test(String(call[0])));
      expect(takeovers).toHaveLength(0);
    });
  });

  describe('anchor registration', () => {
    it('should register the trigger element as anchor on the popover', () => {
      const { fixture, triggerEl } = setup(BasicTriggerHost);
      const host = fixture.componentInstance as BasicTriggerHost;
      TestBed.flushEffects();
      expect(host.popover().anchorElement()).toBe(triggerEl);
    });

    it('should clear the anchor on trigger destroy', () => {
      const { fixture, triggerEl } = setup(ConditionalTriggerHost);
      const host = fixture.componentInstance as ConditionalTriggerHost;
      TestBed.flushEffects();
      expect(host.popover().anchorElement()).toBe(triggerEl);

      host.showTrigger.set(false);
      fixture.detectChanges();
      expect(host.popover().anchorElement()).toBeNull();
    });

    it('should not clear an anchor a later registration replaced', () => {
      const { fixture } = setup(ConditionalTriggerHost);
      const host = fixture.componentInstance as ConditionalTriggerHost;
      TestBed.flushEffects();

      const replacement = document.createElement('button');
      host.popover().setAnchorElement(replacement);
      host.showTrigger.set(false);
      fixture.detectChanges();
      expect(host.popover().anchorElement()).toBe(replacement);
    });

    it('keeps its implicit registration under an explicit anchor', () => {
      const { fixture, triggerEl } = setup(TriggerWithAnchorHost);
      const host = fixture.componentInstance as TriggerWithAnchorHost;
      const anchorEl = fixture.nativeElement.querySelector('#anchor') as HTMLElement;
      expect(host.popover().anchorElement()).toBe(anchorEl);

      host.showAnchor.set(false);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(host.popover().anchorElement()).toBe(triggerEl);
    });

    it('releases its implicit registration on destroy while an explicit anchor holds the popover', () => {
      const { fixture } = setup(TriggerWithAnchorHost);
      const host = fixture.componentInstance as TriggerWithAnchorHost;

      host.showTrigger.set(false);
      fixture.detectChanges();
      TestBed.flushEffects();
      host.showAnchor.set(false);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(host.popover().anchorElement()).toBeNull();
    });
  });

  describe('no event handling', () => {
    it('should not toggle popover on click (consumer responsibility)', () => {
      const { fixture, triggerEl, popoverEl } = setup(BasicTriggerHost);
      const host = fixture.componentInstance as BasicTriggerHost;
      triggerEl.click();
      fixture.detectChanges();
      expect(host.popover().state()).toBe('closed');
      expect(popoverEl.showPopover).not.toHaveBeenCalled();
    });
  });
});
