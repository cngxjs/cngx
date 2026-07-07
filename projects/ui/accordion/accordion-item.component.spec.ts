import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import type { AsyncStatus, CngxAsyncState } from '@cngx/core/utils';

import { CngxAccordionGroup } from './accordion-group.component';
import { CngxAccordionItem } from './accordion-item.component';
import { CngxAccordionItemBusy } from './accordion-item-busy.directive';
import { CngxAccordionItemContent } from './accordion-item-content.directive';
import { CngxAccordionItemError } from './accordion-item-error.directive';
import { CngxAccordionItemIcon } from './accordion-item-icon.directive';
import { CngxAccordionItemLeading } from './accordion-item-leading.directive';
import { CngxAccordionItemMeta } from './accordion-item-meta.directive';
import { CngxAccordionItemSubtitle } from './accordion-item-subtitle.directive';
import { CngxAccordionItemTitle } from './accordion-item-title.directive';

@Component({
  template: `<cngx-accordion-group [headingLevel]="level()">
    <cngx-accordion-item><span cngxAccordionItemTitle>A</span>Body A</cngx-accordion-item>
    <cngx-accordion-item [disabled]="bDisabled()"
      ><span cngxAccordionItemTitle>B</span>Body B</cngx-accordion-item
    >
    <cngx-accordion-item><span cngxAccordionItemTitle>C</span>Body C</cngx-accordion-item>
  </cngx-accordion-group>`,
  imports: [CngxAccordionGroup, CngxAccordionItem, CngxAccordionItemTitle],
})
class Host {
  readonly level = signal<number>(3);
  readonly bDisabled = signal(false);
}

@Component({
  template: `<cngx-accordion-group>
    <cngx-accordion-item>
      <span cngxAccordionItemTitle>Report</span>
      <ng-template cngxAccordionItemIcon let-expanded>
        <span class="custom-icon">{{ expanded }}</span>
      </ng-template>
      <ng-template cngxAccordionItemContent>
        <span class="lazy-body">loaded</span>
      </ng-template>
    </cngx-accordion-item>
  </cngx-accordion-group>`,
  imports: [
    CngxAccordionGroup,
    CngxAccordionItem,
    CngxAccordionItemTitle,
    CngxAccordionItemContent,
    CngxAccordionItemIcon,
  ],
})
class SlotHost {}

@Component({
  template: `<cngx-accordion-group [(openIds)]="open">
    <cngx-accordion-item panelId="alpha"><span cngxAccordionItemTitle>A</span>Body A</cngx-accordion-item>
    <cngx-accordion-item panelId="beta"><span cngxAccordionItemTitle>B</span>Body B</cngx-accordion-item>
  </cngx-accordion-group>`,
  imports: [CngxAccordionGroup, CngxAccordionItem, CngxAccordionItemTitle],
})
class NamedHost {
  readonly open = signal<ReadonlySet<string>>(new Set(['beta']));
}

@Component({
  template: `<cngx-accordion-group>
    <cngx-accordion-item>
      <span cngxAccordionItemLeading class="lead">01</span>
      <span cngxAccordionItemTitle>Billing</span>
      <span cngxAccordionItemSubtitle class="sub">Invoices</span>
      <span cngxAccordionItemMeta><a href="#" class="meta-link">edit</a></span>
      Body
    </cngx-accordion-item>
  </cngx-accordion-group>`,
  imports: [
    CngxAccordionGroup,
    CngxAccordionItem,
    CngxAccordionItemTitle,
    CngxAccordionItemSubtitle,
    CngxAccordionItemLeading,
    CngxAccordionItemMeta,
  ],
})
class SlotsHost {}

@Component({
  template: `<cngx-accordion-group>
    <cngx-accordion-item [state]="state()">
      <span cngxAccordionItemTitle>Report</span>
      <ng-template cngxAccordionItemBusy><span class="busy-slot">loading</span></ng-template>
      <ng-template cngxAccordionItemError><span class="error-slot">failed</span></ng-template>
      <ng-template cngxAccordionItemContent><span class="body">content</span></ng-template>
    </cngx-accordion-item>
  </cngx-accordion-group>`,
  imports: [
    CngxAccordionGroup,
    CngxAccordionItem,
    CngxAccordionItemTitle,
    CngxAccordionItemBusy,
    CngxAccordionItemError,
    CngxAccordionItemContent,
  ],
})
class AsyncHost {
  readonly state = signal<AsyncStatus | CngxAsyncState<unknown> | undefined>(undefined);
}

// The item reads only `.status()` off the object form, so a status-only stub is
// a faithful CngxAsyncState for these tests.
function asyncState(status: AsyncStatus): CngxAsyncState<unknown> {
  return { status: signal(status) } as unknown as CngxAsyncState<unknown>;
}

@Component({
  template: `<cngx-accordion-group>
    <cngx-accordion-item [state]="'error'"><span cngxAccordionItemTitle>R</span>Body</cngx-accordion-item>
  </cngx-accordion-group>`,
  imports: [CngxAccordionGroup, CngxAccordionItem, CngxAccordionItemTitle],
})
class ErrorDefaultHost {}

@Component({
  template: `<cngx-accordion-group>
    <cngx-accordion-item [state]="'error'" [errorMessage]="msg()">
      <span cngxAccordionItemTitle>R</span>
    </cngx-accordion-item>
  </cngx-accordion-group>`,
  imports: [CngxAccordionGroup, CngxAccordionItem, CngxAccordionItemTitle],
})
class ErrorMessageHost {
  readonly msg = signal('Custom failure.');
}

describe('CngxAccordionItem', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [Host] }));

  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const headers = fixture.debugElement
      .queryAll(By.css('button.cngx-accordion-item__header'))
      .map((de) => de.nativeElement as HTMLButtonElement);
    const regions = Array.from(root.querySelectorAll<HTMLElement>('[role="region"]'));
    return { fixture, root, host: fixture.componentInstance, headers, regions };
  }

  function keydown(el: HTMLElement, key: string): void {
    el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  }

  // The button's aria-describedby is `${subtitleId} ${reasonId}`; the reason is
  // the visually-hidden element among the referenced ids.
  function describedReason(root: HTMLElement, button: HTMLElement): HTMLElement | undefined {
    return (button.getAttribute('aria-describedby') ?? '')
      .split(/\s+/)
      .map((id) => root.querySelector<HTMLElement>(`#${id}`))
      .find((el): el is HTMLElement => el?.classList.contains('cngx-visually-hidden') ?? false);
  }

  function setupAsync(initial?: AsyncStatus | CngxAsyncState<unknown>) {
    const fixture = TestBed.createComponent(AsyncHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const header = root.querySelector<HTMLButtonElement>('button.cngx-accordion-item__header')!;
    // Open so the lazy body latches; async branches then swap around a mounted body.
    header.click();
    if (initial !== undefined) {
      fixture.componentInstance.state.set(initial);
    }
    fixture.detectChanges();
    const region = root.querySelector<HTMLElement>('[role="region"]')!;
    return { fixture, root, header, region };
  }

  it('pins each region and its header button name to the title element only', () => {
    const { headers, regions, root } = setup();
    expect(regions).toHaveLength(3);
    regions.forEach((region, i) => {
      expect(region.getAttribute('role')).toBe('region');
      // Button names itself at the title element (not its own subtree), so a
      // subtitle inside the button never leaks into the accessible name.
      const titleId = headers[i].getAttribute('aria-labelledby');
      expect(titleId).toBeTruthy();
      // Region points at the SAME title element, not at the button: naming the
      // button would fold in title+subtitle since accname does not re-follow the
      // button's own aria-labelledby.
      expect(region.getAttribute('aria-labelledby')).toBe(titleId);
      const titleEl = root.querySelector<HTMLElement>(`#${titleId}`);
      expect(titleEl?.textContent?.trim()).toBe(['A', 'B', 'C'][i]);
    });
  });

  it('reflects the group heading level onto every item heading', () => {
    const { fixture, root, host } = setup();
    host.level.set(4);
    fixture.detectChanges();
    const headings = root.querySelectorAll<HTMLElement>('[role="heading"]');
    expect(headings).toHaveLength(3);
    headings.forEach((h) => expect(h.getAttribute('aria-level')).toBe('4'));
  });

  it('roves focus and the tab stop ACROSS item view boundaries on ArrowDown', () => {
    const { fixture, headers } = setup();
    expect(headers[0].getAttribute('tabindex')).toBe('0');
    expect(headers[1].getAttribute('tabindex')).toBe('-1');

    headers[0].focus();
    keydown(headers[0], 'ArrowDown');
    fixture.detectChanges();

    expect(document.activeElement).toBe(headers[1]);
    expect(headers[0].getAttribute('tabindex')).toBe('-1');
    expect(headers[1].getAttribute('tabindex')).toBe('0');
  });

  it('skips a disabled item on ArrowDown and resolves its aria-describedby reason', () => {
    const { fixture, root, host, headers } = setup();
    host.bDisabled.set(true);
    fixture.detectChanges();

    expect(headers[1].getAttribute('aria-disabled')).toBe('true');
    // aria-describedby now carries `${subtitleId} ${reasonId}`; pick the reason
    // element (the visually-hidden one) out of the id list.
    const reason = describedReason(root, headers[1]);
    expect(reason?.textContent?.trim()).toBeTruthy();
    expect(reason?.getAttribute('aria-hidden')).toBe('false');

    headers[0].focus();
    keydown(headers[0], 'ArrowDown');
    fixture.detectChanges();
    expect(document.activeElement).toBe(headers[2]);
  });

  it('keeps the aria-describedby reason IDREF present but hidden when enabled', () => {
    const { headers, root } = setup();
    const reason = describedReason(root, headers[1]);
    expect(reason).toBeTruthy();
    expect(reason?.getAttribute('aria-hidden')).toBe('true');
    expect(reason?.textContent?.trim()).toBe('');
  });

  it('instantiates *cngxAccordionItemContent only after first open', () => {
    const fixture = TestBed.createComponent(SlotHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const header = root.querySelector<HTMLButtonElement>('button.cngx-accordion-item__header')!;

    expect(root.querySelector('.lazy-body')).toBeNull();

    header.click();
    fixture.detectChanges();
    expect(root.querySelector('.lazy-body')?.textContent).toBe('loaded');
  });

  it('renders *cngxAccordionItemIcon in place of the CSS chevron with expanded context', () => {
    const fixture = TestBed.createComponent(SlotHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.cngx-accordion-item__chevron')).toBeNull();
    expect(root.querySelector('.custom-icon')?.textContent).toBe('false');

    root.querySelector<HTMLButtonElement>('button.cngx-accordion-item__header')!.click();
    fixture.detectChanges();
    expect(root.querySelector('.custom-icon')?.textContent).toBe('true');
  });

  it('addresses a consumer-set panelId through the group open-set model', () => {
    const fixture = TestBed.createComponent(NamedHost);
    fixture.detectChanges();
    const headers = fixture.debugElement
      .queryAll(By.css('button.cngx-accordion-item__header'))
      .map((de) => de.nativeElement as HTMLButtonElement);

    // Seeded `beta` open -> the named second panel renders expanded on load.
    expect(headers[0].getAttribute('aria-expanded')).toBe('false');
    expect(headers[1].getAttribute('aria-expanded')).toBe('true');

    // Consumer drives expansion declaratively by the same stable id.
    fixture.componentInstance.open.set(new Set(['alpha']));
    fixture.detectChanges();
    expect(headers[0].getAttribute('aria-expanded')).toBe('true');
    expect(headers[1].getAttribute('aria-expanded')).toBe('false');
  });

  it('exposes the title, subtitle, leading and meta slots on the header', () => {
    const fixture = TestBed.createComponent(SlotsHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.cngx-accordion-item__title')?.textContent?.trim()).toBe('Billing');
    expect(root.querySelector('.sub')?.textContent?.trim()).toBe('Invoices');
    expect(root.querySelector('.lead')?.textContent?.trim()).toBe('01');
    expect(root.querySelector('.meta-link')?.textContent?.trim()).toBe('edit');
  });

  it('pins the header/region name to the title, excluding subtitle, leading and meta', () => {
    const fixture = TestBed.createComponent(SlotsHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const button = root.querySelector<HTMLButtonElement>('button.cngx-accordion-item__header')!;
    const region = root.querySelector<HTMLElement>('[role="region"]')!;

    const titleId = button.getAttribute('aria-labelledby');
    expect(titleId).toBeTruthy();
    const titleEl = root.querySelector<HTMLElement>(`#${titleId}`)!;
    // The name resolves to the title text only - not "Billing Invoices".
    expect(titleEl.textContent?.trim()).toBe('Billing');
    expect(region.getAttribute('aria-labelledby')).toBe(titleId);
  });

  it('announces the subtitle through aria-describedby without leaking it into the name', () => {
    const fixture = TestBed.createComponent(SlotsHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const button = root.querySelector<HTMLButtonElement>('button.cngx-accordion-item__header')!;
    const subtitleWrapper = root.querySelector<HTMLElement>('.cngx-accordion-item__subtitle')!;

    // The subtitle wrapper id is referenced by aria-describedby (announced),
    // and the bound subtitle is visible (not aria-hidden).
    const ids = (button.getAttribute('aria-describedby') ?? '').split(/\s+/);
    expect(ids).toContain(subtitleWrapper.id);
    expect(subtitleWrapper.getAttribute('aria-hidden')).toBeNull();
    // Subtitle lives inside the button (described), title-only name still holds.
    expect(button.contains(subtitleWrapper)).toBe(true);
  });

  it('hides the subtitle IDREF wrapper when no subtitle is projected', () => {
    const { headers, root } = setup();
    const button = headers[0];
    const ids = (button.getAttribute('aria-describedby') ?? '').split(/\s+/);
    const subtitleWrapper = ids
      .map((id) => root.querySelector<HTMLElement>(`#${id}`))
      .find((el) => el?.classList.contains('cngx-accordion-item__subtitle'));
    // IDREF stays in the DOM (always-present describedby), but is aria-hidden
    // and empty when unbound.
    expect(subtitleWrapper).toBeTruthy();
    expect(subtitleWrapper?.getAttribute('aria-hidden')).toBe('true');
    expect(subtitleWrapper?.textContent?.trim()).toBe('');
  });

  it('renders leading aria-hidden and meta as real content, both button siblings', () => {
    const fixture = TestBed.createComponent(SlotsHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const heading = root.querySelector<HTMLElement>('[role="heading"]')!;
    const button = root.querySelector<HTMLButtonElement>('button.cngx-accordion-item__header')!;
    const leadingWrapper = root.querySelector<HTMLElement>('.cngx-accordion-item__leading')!;
    const metaWrapper = root.querySelector<HTMLElement>('.cngx-accordion-item__meta')!;

    // Siblings of the button (parent is the heading row), never children.
    expect(leadingWrapper.parentElement).toBe(heading);
    expect(metaWrapper.parentElement).toBe(heading);
    expect(button.contains(leadingWrapper)).toBe(false);
    expect(button.contains(metaWrapper)).toBe(false);

    // Leading is decorative; meta is real content.
    expect(leadingWrapper.getAttribute('aria-hidden')).toBe('true');
    expect(metaWrapper.getAttribute('aria-hidden')).toBeNull();

    // Interactive meta (a link) sits OUTSIDE the button -> valid HTML.
    const metaLink = root.querySelector<HTMLAnchorElement>('.meta-link')!;
    expect(button.contains(metaLink)).toBe(false);
  });

  it('sets aria-busy and renders the busy slot on [state]="loading"', () => {
    const { region, root } = setupAsync('loading');
    expect(region.getAttribute('aria-busy')).toBe('true');
    expect(root.querySelector('.busy-slot')).not.toBeNull();
    // Loading is first-load: the body is replaced by the busy visual.
    expect(root.querySelector('.body')).toBeNull();
  });

  it('keeps aria-busy and the mounted body on [state]="refreshing"', () => {
    const { region, root } = setupAsync('refreshing');
    expect(region.getAttribute('aria-busy')).toBe('true');
    // Refreshing keeps the body mounted and overlays the busy visual.
    expect(root.querySelector('.body')?.textContent).toBe('content');
    expect(root.querySelector('.busy-slot')).not.toBeNull();
  });

  it('sets aria-busy on [state]="pending" without dropping the body', () => {
    const { region, root } = setupAsync('pending');
    expect(region.getAttribute('aria-busy')).toBe('true');
    expect(root.querySelector('.body')?.textContent).toBe('content');
  });

  it('renders the error slot in an alert and clears aria-busy on [state]="error"', () => {
    const { region, root } = setupAsync('error');
    expect(region.getAttribute('aria-busy')).toBeNull();
    const alert = root.querySelector<HTMLElement>('[role="alert"]');
    expect(alert).not.toBeNull();
    expect(alert?.querySelector('.error-slot')?.textContent).toBe('failed');
    // Error replaces the body.
    expect(root.querySelector('.body')).toBeNull();
  });

  it('clears aria-busy and shows the body on success and when [state] is absent', () => {
    const { fixture, region, root } = setupAsync('success');
    expect(region.getAttribute('aria-busy')).toBeNull();
    expect(root.querySelector('.body')?.textContent).toBe('content');

    fixture.componentInstance.state.set(undefined);
    fixture.detectChanges();
    expect(region.getAttribute('aria-busy')).toBeNull();
    expect(root.querySelector('.body')?.textContent).toBe('content');
  });

  it('resolves a CngxAsyncState<unknown> object input via its status() signal', () => {
    const { region } = setupAsync(asyncState('loading'));
    expect(region.getAttribute('aria-busy')).toBe('true');
  });

  it('announces an EN default error message when no error slot is given', () => {
    const fixture = TestBed.createComponent(ErrorDefaultHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const alert = root.querySelector<HTMLElement>('[role="alert"]');
    // The zero-config error state speaks, never a silent alert (Pillar 2).
    expect(alert?.textContent?.trim()).toBe('This section could not be loaded.');
  });

  it('lets a per-instance [errorMessage] win over the default in the alert', () => {
    const fixture = TestBed.createComponent(ErrorMessageHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const alert = root.querySelector<HTMLElement>('[role="alert"]');
    expect(alert?.textContent?.trim()).toBe('Custom failure.');
  });
});
