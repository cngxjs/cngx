import { Component, linkedSignal, resource, signal, untracked, type ResourceStatus } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { CngxAsyncState } from '@cngx/core/utils';
import { describe, expect, it } from 'vitest';

import { CngxAsync } from '../async/async.directive';
import { fromResource } from './from-resource';

// Pins the Angular resource and linkedSignal behaviour the resource bridge latch
// relies on. A red case here means a latch rule has no basis any more.

const probe = (id: string, msg: string): void => console.log(`PROBE ${id} | ${msg}`);

async function settle(fixture?: ComponentFixture<unknown>): Promise<void> {
  for (let i = 0; i < 5; i++) {
    if (fixture) {
      fixture.detectChanges();
    } else {
      TestBed.tick();
    }
    await new Promise((r) => setTimeout(r, 0));
  }
}

function failingResource(fail: { on: boolean }) {
  const params = signal(1);
  const ref = TestBed.runInInjectionContext(() =>
    resource({
      params: () => params(),
      loader: async ({ params: p }) => {
        if (fail.on) {
          throw new Error(`fail-${p}`);
        }
        return [`v${p}`];
      },
    }),
  );
  return { params, ref };
}

describe('resource semantics behind the bridge latch', () => {
  it('P0.1 Angular resource premises', async () => {
    const fail = { on: true };
    const { params, ref } = failingResource(fail);
    await settle();

    const firstError = ref.error();
    const inError = `status=${ref.status()} hasValue=${ref.hasValue()}`;
    expect(ref.status()).toBe('error');
    expect(ref.hasValue()).toBe(false);

    ref.reload();
    const afterFailedReload = `status=${ref.status()} hasValue=${ref.hasValue()}`;
    const sameErrorWhileReloading = ref.error() === firstError;
    expect(ref.status()).toBe('reloading');
    expect(ref.hasValue()).toBe(false);
    expect(sameErrorWhileReloading).toBe(true);

    fail.on = false;
    await settle();
    expect(ref.status()).toBe('resolved');

    ref.reload();
    const reloadAfterSuccess = `status=${ref.status()} hasValue=${ref.hasValue()}`;
    expect(ref.status()).toBe('reloading');
    expect(ref.hasValue()).toBe(true);
    await settle();

    params.set(2);
    const paramsChange = `status=${ref.status()} hasValue=${ref.hasValue()}`;
    expect(ref.status()).toBe('loading');
    expect(ref.hasValue()).toBe(false);
    await settle();

    probe(
      'P0.1',
      `error: ${inError}; reload after failure: ${afterFailedReload} sameError=${sameErrorWhileReloading}; ` +
        `reload after success: ${reloadAfterSuccess}; params change: ${paramsChange}`,
    );
  });

  it('P0.2 linkedSignal hands the computation the last read entry as previous', () => {
    const status = signal<ResourceStatus>('loading');
    const seen: (string | undefined)[] = [];
    const latch = linkedSignal<ResourceStatus, ResourceStatus>({
      source: status,
      computation: (s, previous) => {
        seen.push(previous?.source);
        return s;
      },
    });

    latch();
    status.set('resolved');
    status.set('error');
    latch();
    const a = seen.at(-1);
    expect(a).toBe('loading');

    status.set('resolved');
    latch();
    status.set('loading');
    status.set('error');
    latch();
    const b = seen.at(-1);
    expect(b).toBe('resolved');

    probe('P0.2', `(a) unread resolved -> previous=${a}; (b) unread loading -> previous=${b}`);
  });

  describe('real *cngxAsync wiring', () => {
    @Component({
      imports: [CngxAsync],
      template: `
        @if (shown()) {
          <span *cngxAsync="state; error: err">CONTENT</span>
        }
        <ng-template #err>ERROR</ng-template>
      `,
    })
    class Host {
      readonly fail = { on: false };
      readonly params = signal(1);
      readonly shown = signal(true);
      readonly reads: ResourceStatus[] = [];
      readonly ref = resource({
        params: () => this.params(),
        loader: async ({ params: p }) => {
          if (this.fail.on) {
            throw new Error(`fail-${p}`);
          }
          return [`v${p}`];
        },
      });
      readonly state: CngxAsyncState<string[] | undefined> = this.record(fromResource(this.ref));

      private record(
        inner: CngxAsyncState<string[] | undefined>,
      ): CngxAsyncState<string[] | undefined> {
        const isFirstLoad = Object.assign(
          () => {
            this.reads.push(untracked(this.ref.status));
            return inner.isFirstLoad();
          },
          inner.isFirstLoad,
        );
        return { ...inner, isFirstLoad };
      }
    }

    async function loaded(): Promise<ComponentFixture<Host>> {
      const fixture = TestBed.createComponent(Host);
      await settle(fixture);
      expect(fixture.componentInstance.ref.status()).toBe('resolved');
      return fixture;
    }

    it('P0.3 the consumer reads the intermediate status of a reload and a params change', async () => {
      const a = await loaded();
      const hostA = a.componentInstance;
      hostA.reads.length = 0;
      hostA.fail.on = true;
      hostA.ref.reload();
      await settle(a);
      const readsA = [...hostA.reads];
      expect(hostA.ref.status()).toBe('error');
      expect(readsA.indexOf('reloading')).toBeGreaterThanOrEqual(0);
      expect(readsA.indexOf('reloading')).toBeLessThan(readsA.lastIndexOf('error'));
      a.destroy();

      const b = await loaded();
      const hostB = b.componentInstance;
      hostB.reads.length = 0;
      hostB.fail.on = true;
      hostB.params.set(2);
      await settle(b);
      const readsB = [...hostB.reads];
      expect(hostB.ref.status()).toBe('error');
      expect(readsB.indexOf('loading')).toBeGreaterThanOrEqual(0);
      expect(readsB.indexOf('loading')).toBeLessThan(readsB.lastIndexOf('error'));

      probe('P0.3', `A reload fails: reads=${readsA.join(',')}; B params change fails: reads=${readsB.join(',')}`);
    });

    it('P0.4 a hidden consumer reads nothing during the failing step', async () => {
      const fixture = await loaded();
      const host = fixture.componentInstance;
      host.shown.set(false);
      await settle(fixture);
      host.reads.length = 0;
      host.fail.on = true;
      host.params.set(2);
      await settle(fixture);
      const readsWhileHidden = [...host.reads];
      expect(host.ref.status()).toBe('error');
      expect(readsWhileHidden).toEqual([]);

      probe('P0.4', `reads while hidden through a failing params change: [${readsWhileHidden.join(',')}]`);
    });
  });
});
