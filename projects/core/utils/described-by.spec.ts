import {
  Component,
  computed,
  createEnvironmentInjector,
  Directive,
  EnvironmentInjector,
  HostAttributeToken,
  inject,
  input,
  runInInjectionContext,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  CNGX_DESCRIBED_BY,
  createDescribedByRegistry,
  injectDescribedByContribution,
} from './described-by';

describe('createDescribedByRegistry', () => {
  it('is null while empty', () => {
    const registry = createDescribedByRegistry();
    expect(registry.value()).toBeNull();
  });

  it('puts the seed first, then contributions in registration order', () => {
    const registry = createDescribedByRegistry({ seed: 'hint  note' });
    registry.contribute('b', signal('second'));
    registry.contribute('a', signal('first'));
    expect(registry.value()).toBe('hint note second first');
  });

  it('dedupes ids across the seed and contributions', () => {
    const registry = createDescribedByRegistry({ seed: 'hint' });
    registry.contribute('a', signal('hint tip'));
    registry.contribute('b', signal('tip'));
    expect(registry.value()).toBe('hint tip');
  });

  it('follows a contribution signal and drops it while it yields null', () => {
    const registry = createDescribedByRegistry({ seed: 'hint' });
    const reason = signal<string | null>(null);
    registry.contribute('reason', reason);
    registry.contribute('tip', signal('tip'));
    expect(registry.value()).toBe('hint tip');
    reason.set('reason');
    expect(registry.value()).toBe('hint reason tip');
    reason.set(null);
    expect(registry.value()).toBe('hint tip');
  });

  it('withdraws only while the caller still holds the key', () => {
    const registry = createDescribedByRegistry();
    const predecessor = signal('old');
    const successor = signal('new');
    registry.contribute('a', predecessor);
    registry.withdraw('a', predecessor);
    registry.contribute('a', successor);
    registry.withdraw('a', predecessor);
    expect(registry.value()).toBe('new');
    registry.withdraw('a', successor);
    expect(registry.value()).toBeNull();
  });

  it('absorbs a different signal under a live key and warns with the registry name', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const registry = createDescribedByRegistry({ name: 'TestHost' });
    registry.contribute('a', signal('first'));
    registry.contribute('a', signal('second'));
    expect(registry.value()).toBe('first');
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0][0]).toMatch(/^CNGX0004: .*TestHost already holds "a"/);
    warn.mockRestore();
  });

  it('keeps the same string value when an unrelated change recomputes it', () => {
    const registry = createDescribedByRegistry({ seed: 'hint' });
    const off = signal<string | null>(null);
    registry.contribute('off', off);
    const reads = vi.fn();
    const downstream = computed(() => {
      reads();
      return registry.value();
    });
    expect(downstream()).toBe('hint');
    off.set(null);
    expect(downstream()).toBe('hint');
    expect(reads).toHaveBeenCalledOnce();
  });
});

@Directive({ selector: '[testContributor]', standalone: true })
class TestContributor {
  readonly id = input.required<string>({ alias: 'testContributor' });
  private readonly ids = computed(() => this.id());
  readonly registry = injectDescribedByContribution('contributor', this.ids);
}

@Component({
  selector: 'test-owner',
  standalone: true,
  providers: [
    {
      provide: CNGX_DESCRIBED_BY,
      useFactory: () =>
        createDescribedByRegistry({
          seed: inject(new HostAttributeToken('aria-describedby'), { optional: true }),
        }),
    },
  ],
  host: { '[attr.aria-describedby]': 'registry.value()' },
  template: '',
})
class TestOwner {
  readonly registry = inject(CNGX_DESCRIBED_BY);
}

@Component({
  standalone: true,
  imports: [TestOwner, TestContributor],
  template: `
    <test-owner aria-describedby="hint" testContributor="tip" />
    <span testContributor="plain"></span>
  `,
})
class TestHost {}

describe('injectDescribedByContribution', () => {
  it('contributes to the registry of its own element and seeds from the static attribute', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const owner = fixture.nativeElement.querySelector('test-owner') as HTMLElement;
    expect(owner.getAttribute('aria-describedby')).toBe('hint tip');
  });

  it('returns null when the element provides no registry', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const plain = fixture.debugElement.children
      .find((el) => el.name === 'span')!
      .injector.get(TestContributor);
    expect(plain.registry).toBeNull();
  });

  it('withdraws the contribution when the contributor is destroyed', () => {
    const registry = createDescribedByRegistry({ seed: 'hint' });
    const scope = createEnvironmentInjector(
      [{ provide: CNGX_DESCRIBED_BY, useValue: registry }],
      TestBed.inject(EnvironmentInjector),
    );
    const returned = runInInjectionContext(scope, () =>
      injectDescribedByContribution('tip', signal('tip')),
    );
    expect(returned).toBe(registry);
    expect(registry.value()).toBe('hint tip');
    scope.destroy();
    expect(registry.value()).toBe('hint');
  });
});
