import { Component, resource, signal, type TemplateRef, viewChild } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { type AsyncStatus, buildAsyncStateView } from '@cngx/core/utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ManualAsyncState } from '../async-state/create-manual-state';
import { createManualState } from '../async-state/create-manual-state';
import { fromResource } from '../async-state/from-resource';
import { CngxAsync } from './async.directive';

@Component({
  template: `
    <div *cngxAsync="state; let data; skeleton: skelTpl; empty: emptyTpl; error: errTpl">
      {{ data }}
    </div>

    <ng-template #skelTpl>
      <span class="skeleton">Loading...</span>
    </ng-template>

    <ng-template #emptyTpl>
      <span class="empty">No data.</span>
    </ng-template>

    <ng-template #errTpl let-err>
      <span class="error">{{ err }}</span>
    </ng-template>
  `,
  imports: [CngxAsync],
})
class Host {
  state: ManualAsyncState<string> = createManualState<string>();
}

function createFixture(): { host: Host; el: HTMLElement } {
  TestBed.configureTestingModule({ imports: [Host] });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  return { host: fixture.componentInstance, el: fixture.nativeElement };
}

describe('CngxAsync', () => {
  let host: Host;
  let el: HTMLElement;

  beforeEach(() => {
    const ctx = createFixture();
    host = ctx.host;
    el = ctx.el;
  });

  it('shows nothing in idle', () => {
    expect(el.querySelector('.skeleton')).toBeNull();
    expect(el.querySelector('.empty')).toBeNull();
    expect(el.querySelector('.error')).toBeNull();
    expect(el.textContent!.trim()).toBe('');
  });

  it('shows skeleton template during first load', () => {
    host.state.set('loading');
    TestBed.flushEffects();

    expect(el.querySelector('.skeleton')).not.toBeNull();
    expect(el.querySelector('.skeleton')!.textContent).toContain('Loading...');
  });

  it('shows content with data on success', () => {
    host.state.setSuccess('hello world');
    TestBed.flushEffects();

    expect(el.querySelector('.skeleton')).toBeNull();
    expect(el.textContent).toContain('hello world');
  });

  it('shows empty template when empty', () => {
    // null data is considered empty by createManualState
    host.state.setSuccess(undefined as unknown as string);
    TestBed.flushEffects();

    expect(el.querySelector('.empty')).not.toBeNull();
    expect(el.querySelector('.empty')!.textContent).toContain('No data.');
  });

  it('shows error template on first-load error', () => {
    host.state.setError('Something broke');
    TestBed.flushEffects();

    expect(el.querySelector('.error')).not.toBeNull();
    expect(el.querySelector('.error')!.textContent).toContain('Something broke');
  });

  it('keeps content visible during refresh (not skeleton)', () => {
    host.state.setSuccess('initial data');
    TestBed.flushEffects();
    expect(el.textContent).toContain('initial data');

    // After success, refreshing should keep content visible
    host.state.set('refreshing');
    TestBed.flushEffects();

    expect(el.querySelector('.skeleton')).toBeNull();
    expect(el.textContent).toContain('initial data');
  });

  it('updates content context when data changes on success', () => {
    host.state.setSuccess('first');
    TestBed.flushEffects();
    expect(el.textContent).toContain('first');

    host.state.setSuccess('second');
    TestBed.flushEffects();
    expect(el.textContent).toContain('second');
  });

  it('shows content+error as content (error after data exists)', () => {
    host.state.setSuccess('existing data');
    TestBed.flushEffects();

    host.state.setError('late error');
    TestBed.flushEffects();

    // content+error resolves to content in structural directive
    expect(el.querySelector('.error')).toBeNull();
    expect(el.textContent).toContain('existing data');
  });
});

describe('CngxAsync over fromResource', () => {
  @Component({
    template: `
      <div *cngxAsync="state; let items; error: errTpl">CONTENT {{ $any(items).length }}</div>
      <ng-template #errTpl><span class="error">ERRORTPL</span></ng-template>
    `,
    imports: [CngxAsync],
  })
  class ResourceHost {
    readonly ref = resource<string[], unknown>({
      loader: async (): Promise<string[]> => {
        throw new Error('first-fail');
      },
    });
    readonly state = fromResource(this.ref);
  }

  it('renders the error template for a failed first load', async () => {
    const fixture = TestBed.createComponent(ResourceHost);
    for (let i = 0; i < 5; i++) {
      fixture.detectChanges();
      await fixture.whenStable();
    }
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelector('.error')?.textContent).toBe('ERRORTPL');
    expect(el.textContent).not.toContain('CONTENT');
  });
});

describe('CngxAsync content context', () => {
  @Component({
    template: `<div *cngxAsync="state; let data">[{{ data }}]</div>`,
    imports: [CngxAsync],
  })
  class ViewHost {
    readonly status = signal<AsyncStatus>('success');
    readonly data = signal<string[] | undefined>(['a']);
    readonly state = buildAsyncStateView<string[]>({
      status: this.status,
      data: this.data,
      error: signal(undefined),
      isFirstLoad: signal(false),
    });
  }

  it('passes undefined data through while the content view stays', () => {
    const fixture = TestBed.createComponent(ViewHost);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('[a]');

    fixture.componentInstance.status.set('refreshing');
    fixture.componentInstance.data.set(undefined);
    TestBed.flushEffects();
    fixture.detectChanges();

    expect(el.textContent).toContain('[]');
    expect(el.textContent).not.toContain('a');
  });
});

describe('CngxAsync slot template swap', () => {
  @Component({
    template: `
      <div *cngxAsync="state; skeleton: skel(); error: err()">CONTENT</div>
      <ng-template #skelA><span class="skel-a">SKEL A</span></ng-template>
      <ng-template #skelB><span class="skel-b">SKEL B</span></ng-template>
      <ng-template #errA><span class="err-a">ERR A</span></ng-template>
      <ng-template #errB><span class="err-b">ERR B</span></ng-template>
    `,
    imports: [CngxAsync],
  })
  class SwapHost {
    readonly state = createManualState<string>();
    readonly skelA = viewChild.required<TemplateRef<unknown>>('skelA');
    readonly skelB = viewChild.required<TemplateRef<unknown>>('skelB');
    readonly errA = viewChild.required<TemplateRef<{ $implicit: unknown }>>('errA');
    readonly errB = viewChild.required<TemplateRef<{ $implicit: unknown }>>('errB');
    readonly useB = signal(false);
    readonly skel = (): TemplateRef<unknown> => (this.useB() ? this.skelB() : this.skelA());
    readonly err = (): TemplateRef<{ $implicit: unknown }> =>
      this.useB() ? this.errB() : this.errA();
  }

  function render(fixture: { detectChanges(): void }): void {
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
  }

  it('re-renders the error view with the swapped template', () => {
    const fixture = TestBed.createComponent(SwapHost);
    const el: HTMLElement = fixture.nativeElement;
    fixture.componentInstance.state.setError('boom');
    render(fixture);
    expect(el.querySelector('.err-a')).not.toBeNull();

    fixture.componentInstance.useB.set(true);
    render(fixture);

    expect(el.querySelector('.err-a')).toBeNull();
    expect(el.querySelector('.err-b')).not.toBeNull();
  });

  it('re-renders the skeleton view with the swapped template', () => {
    const fixture = TestBed.createComponent(SwapHost);
    const el: HTMLElement = fixture.nativeElement;
    fixture.componentInstance.state.set('loading');
    render(fixture);
    expect(el.querySelector('.skel-a')).not.toBeNull();

    fixture.componentInstance.useB.set(true);
    render(fixture);

    expect(el.querySelector('.skel-a')).toBeNull();
    expect(el.querySelector('.skel-b')).not.toBeNull();
  });
});

describe('CngxAsync focus across a view switch', () => {
  @Component({
    template: `
      <button class="outside">Outside</button>
      <div *cngxAsync="state; skeleton: skel; error: err">CONTENT</div>
      <ng-template #skel><span class="skeleton">Loading</span></ng-template>
      <ng-template #err><button class="retry">Retry</button></ng-template>
    `,
    imports: [CngxAsync],
  })
  class FocusHost {
    readonly state = createManualState<string>();
  }

  async function render(fixture: ComponentFixture<FocusHost>): Promise<void> {
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    await fixture.whenStable();
  }

  async function setup(): Promise<{ fixture: ComponentFixture<FocusHost>; el: HTMLElement }> {
    const fixture = TestBed.createComponent(FocusHost);
    fixture.componentInstance.state.setError('boom');
    await render(fixture);
    return { fixture, el: fixture.nativeElement };
  }

  async function errorAgain(fixture: ComponentFixture<FocusHost>, between?: () => void) {
    fixture.componentInstance.state.set('loading');
    await render(fixture);
    between?.();
    fixture.componentInstance.state.setError('boom again');
    await render(fixture);
  }

  it('moves focus from a destroyed Retry button into the next view that has one', async () => {
    const { fixture, el } = await setup();
    const first = el.querySelector<HTMLButtonElement>('.retry')!;
    first.focus();
    expect(document.activeElement).toBe(first);

    await errorAgain(fixture);

    const next = el.querySelector<HTMLButtonElement>('.retry')!;
    expect(next).not.toBe(first);
    expect(document.activeElement).toBe(next);
  });

  it('never moves focus that sits outside the directive', async () => {
    const { fixture, el } = await setup();
    const outside = el.querySelector<HTMLButtonElement>('.outside')!;
    outside.focus();

    await errorAgain(fixture);

    expect(document.activeElement).toBe(outside);
  });

  it('drops the hand-off after one more view without a focusable element', async () => {
    const { fixture, el } = await setup();
    el.querySelector<HTMLButtonElement>('.retry')!.focus();

    fixture.componentInstance.state.set('loading');
    await render(fixture);
    fixture.componentInstance.state.set('idle');
    await render(fixture);
    fixture.componentInstance.state.setError('late');
    await render(fixture);

    expect(el.querySelector('.retry')).not.toBeNull();
    expect(document.activeElement).toBe(document.body);
  });

  it('does not pull back focus the user moved elsewhere during the skeleton', async () => {
    const { fixture, el } = await setup();
    el.querySelector<HTMLButtonElement>('.retry')!.focus();
    const outside = el.querySelector<HTMLButtonElement>('.outside')!;

    await errorAgain(fixture, () => outside.focus());

    expect(document.activeElement).toBe(outside);
  });
});

describe('CngxAsync focus target selection', () => {
  @Component({
    template: `
      <div *cngxAsync="state; skeleton: skel; error: err">CONTENT</div>
      <ng-template #skel><span class="skeleton">Loading</span></ng-template>
      <ng-template #err>
        <div inert><button class="inert-btn">Hidden</button></div>
        <button class="retry">Retry</button>
      </ng-template>
    `,
    imports: [CngxAsync],
  })
  class InertHost {
    readonly state = createManualState<string>();
  }

  it('skips focusable elements inside an inert subtree', async () => {
    const fixture = TestBed.createComponent(InertHost);
    const state = fixture.componentInstance.state;
    const el: HTMLElement = fixture.nativeElement;
    const render = async () => {
      fixture.detectChanges();
      TestBed.flushEffects();
      fixture.detectChanges();
      await fixture.whenStable();
    };
    state.setError('boom');
    await render();
    el.querySelector<HTMLButtonElement>('.retry')!.focus();

    state.set('loading');
    await render();
    state.setError('again');
    await render();

    expect(document.activeElement).toBe(el.querySelector('.retry'));
  });
});

@Component({
  template: `<div class="wrap">
    <p *cngxAsync="state; let data">CONTENT {{ data }}</p>
  </div>`,
  imports: [CngxAsync],
})
class NoErrorTemplateHost {
  state: ManualAsyncState<string> = createManualState<string>();
}

describe('CngxAsync without an error template (CNGX1085)', () => {
  afterEach(() => vi.restoreAllMocks());

  function setup(): {
    fixture: ComponentFixture<NoErrorTemplateHost>;
    state: ManualAsyncState<string>;
  } {
    TestBed.configureTestingModule({ imports: [NoErrorTemplateHost] });
    const fixture = TestBed.createComponent(NoErrorTemplateHost);
    fixture.detectChanges();
    return { fixture, state: fixture.componentInstance.state };
  }

  it('renders nothing and warns once on a failed first load', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { fixture, state } = setup();
    state.set('loading');
    fixture.detectChanges();
    state.setError('boom');
    fixture.detectChanges();

    const wrap = fixture.nativeElement.querySelector('.wrap') as HTMLElement;
    expect(wrap.textContent!.trim()).toBe('');
    expect(warn).toHaveBeenCalledOnce();
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/^CNGX1085: \[cngxAsync\]/), wrap);
  });

  it('does not warn again when a retry fails again', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { fixture, state } = setup();
    state.setError('first');
    fixture.detectChanges();
    state.set('loading');
    fixture.detectChanges();
    state.setError('second');
    fixture.detectChanges();

    expect(warn).toHaveBeenCalledOnce();
  });

  it('does not warn on a failed refresh that keeps the content', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { fixture, state } = setup();
    state.setSuccess('data');
    fixture.detectChanges();
    state.setError('late');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('CONTENT data');
    expect(warn).not.toHaveBeenCalled();
  });

  it('does not warn when an error template is bound', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { host, el } = createFixture();
    host.state.setError('boom');
    TestBed.flushEffects();

    expect(el.querySelector('.error')?.textContent).toContain('boom');
    expect(warn).not.toHaveBeenCalled();
  });
});
