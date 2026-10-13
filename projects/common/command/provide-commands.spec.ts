import {
  Component,
  createComponent,
  createEnvironmentInjector,
  EnvironmentInjector,
  runInInjectionContext,
  signal,
  type Signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import { describe, expect, it } from 'vitest';

import type { CngxCommand } from './command';
import { CNGX_COMMAND_SOURCE, injectCommands, provideCommands } from './provide-commands';

function cmd(id: string, overrides: Partial<CngxCommand> = {}): CngxCommand {
  return { id, label: id, run: () => {}, ...overrides };
}

function merged(): Signal<readonly CngxCommand[]> {
  return TestBed.runInInjectionContext(() => injectCommands());
}

function ids(commands: Signal<readonly CngxCommand[]>): string[] {
  return commands().map((x) => x.id);
}

describe('provideCommands / injectCommands', () => {
  it('merges multiple provideCommands sources into one signal', () => {
    const a = cmd('a');
    const b = cmd('b');
    const c = cmd('c');
    TestBed.configureTestingModule({
      providers: [provideCommands([a, b]), provideCommands([c])],
    });

    expect(merged()().map((x) => x.id)).toEqual(['a', 'b', 'c']);
  });

  it('registers at component scope via viewProviders (Provider[], not env-only)', () => {
    @Component({
      standalone: true,
      template: '',
      viewProviders: [provideCommands([cmd('scoped')])],
    })
    class Host {
      readonly commands = injectCommands();
    }

    const fixture = TestBed.createComponent(Host);
    expect(fixture.componentInstance.commands().map((x) => x.id)).toEqual(['scoped']);
  });

  it('returns an empty list when no source is registered', () => {
    TestBed.configureTestingModule({});
    expect(merged()()).toEqual([]);
  });

  it('tracks a signal source live', () => {
    const source = signal<readonly CngxCommand[]>([cmd('a')]);
    TestBed.configureTestingModule({ providers: [provideCommands(source)] });
    const commands = merged();

    expect(commands().map((x) => x.id)).toEqual(['a']);
    source.set([cmd('a'), cmd('b')]);
    expect(commands().map((x) => x.id)).toEqual(['a', 'b']);
  });

  it('reflects a command disabled signal live', () => {
    const disabled = signal(false);
    const source = signal<readonly CngxCommand[]>([cmd('a', { disabled, disabledReason: 'busy' })]);
    TestBed.configureTestingModule({ providers: [provideCommands(source)] });
    const commands = merged();

    expect(commands()[0].disabled?.()).toBe(false);
    disabled.set(true);
    expect(commands()[0].disabled?.()).toBe(true);
    expect(commands()[0].disabledReason).toBe('busy');
  });

  it('does not emit a new array when an identical set is re-provided (equal holds)', () => {
    const a = cmd('a');
    const b = cmd('b');
    const source = signal<readonly CngxCommand[]>([a, b]);
    TestBed.configureTestingModule({ providers: [provideCommands(source)] });
    const commands = merged();

    const first = commands();
    // Fresh array literal, same command references, same order.
    source.set([a, b]);
    const second = commands();

    expect(second).toBe(first);
  });

  it('emits a new array when the command identity changes', () => {
    const source = signal<readonly CngxCommand[]>([cmd('a')]);
    TestBed.configureTestingModule({ providers: [provideCommands(source)] });
    const commands = merged();

    const first = commands();
    source.set([cmd('a')]); // same id, fresh reference
    const second = commands();

    expect(second).not.toBe(first);
  });
});

describe('provideCommands / injectCommands scope inheritance', () => {
  describe('nested scopes add to the outer set', () => {
    it('a viewProviders scope inherits the root set', () => {
      @Component({ template: '', viewProviders: [provideCommands([cmd('b')])] })
      class Host {
        readonly commands = injectCommands();
      }
      TestBed.configureTestingModule({ providers: [provideCommands([cmd('a')])] });

      const fixture = TestBed.createComponent(Host);
      expect(ids(fixture.componentInstance.commands)).toEqual(['a', 'b']);
    });

    it('a providers scope inherits the root set', () => {
      @Component({ template: '', providers: [provideCommands([cmd('b')])] })
      class Host {
        readonly commands = injectCommands();
      }
      TestBed.configureTestingModule({ providers: [provideCommands([cmd('a')])] });

      const fixture = TestBed.createComponent(Host);
      expect(ids(fixture.componentInstance.commands)).toEqual(['a', 'b']);
    });

    it('an environment child inherits the root set', () => {
      TestBed.configureTestingModule({ providers: [provideCommands([cmd('a')])] });
      const child = createEnvironmentInjector(
        [provideCommands([cmd('b')])],
        TestBed.inject(EnvironmentInjector),
      );

      const commands = runInInjectionContext(child, () => injectCommands());
      expect(ids(commands)).toEqual(['a', 'b']);
      child.destroy();
    });

    it('merges three levels: root, environment child, component', () => {
      @Component({ template: '', viewProviders: [provideCommands([cmd('c')])] })
      class Leaf {
        readonly commands = injectCommands();
      }
      TestBed.configureTestingModule({ providers: [provideCommands([cmd('a')])] });
      const child = createEnvironmentInjector(
        [provideCommands([cmd('b')])],
        TestBed.inject(EnvironmentInjector),
      );

      const ref = createComponent(Leaf, { environmentInjector: child });
      expect(ids(ref.instance.commands)).toEqual(['a', 'b', 'c']);
      ref.destroy();
      child.destroy();
    });

    it('a nested component inherits both outer sets', () => {
      @Component({
        selector: 'cngx-test-inner',
        template: '',
        viewProviders: [provideCommands([cmd('c')])],
      })
      class Inner {
        readonly commands = injectCommands();
      }
      @Component({
        imports: [Inner],
        template: '<cngx-test-inner />',
        viewProviders: [provideCommands([cmd('b')])],
      })
      class Outer {}
      TestBed.configureTestingModule({ providers: [provideCommands([cmd('a')])] });

      const fixture = TestBed.createComponent(Outer);
      fixture.detectChanges();
      const inner = fixture.debugElement.query(By.directive(Inner)).componentInstance as Inner;
      expect(ids(inner.commands)).toEqual(['a', 'b', 'c']);
    });

    it('keeps a root signal source live from a nested scope', () => {
      const source = signal<readonly CngxCommand[]>([cmd('a')]);
      @Component({ template: '', viewProviders: [provideCommands([cmd('b')])] })
      class Host {
        readonly commands = injectCommands();
      }
      TestBed.configureTestingModule({ providers: [provideCommands(source)] });

      const commands = TestBed.createComponent(Host).componentInstance.commands;
      expect(ids(commands)).toEqual(['a', 'b']);
      source.set([cmd('a'), cmd('a2')]);
      expect(ids(commands)).toEqual(['a', 'a2', 'b']);
    });

    it('merges two calls at one nested level with the root set, without duplicates', () => {
      @Component({
        template: '',
        viewProviders: [provideCommands([cmd('b')]), provideCommands([cmd('c')])],
      })
      class Host {
        readonly commands = injectCommands();
      }
      TestBed.configureTestingModule({ providers: [provideCommands([cmd('a')])] });

      const fixture = TestBed.createComponent(Host);
      expect(ids(fixture.componentInstance.commands)).toEqual(['a', 'b', 'c']);
    });

    it('a routed component sees the root, route and shell sets across a router outlet', async () => {
      let routed: Routed | undefined;
      @Component({ template: '' })
      class Routed {
        readonly commands = injectCommands();
        constructor() {
          // eslint-disable-next-line @typescript-eslint/no-this-alias
          routed = this;
        }
      }
      @Component({
        imports: [RouterOutlet],
        template: '<router-outlet />',
        viewProviders: [provideCommands([cmd('shell')])],
      })
      class Shell {}
      TestBed.configureTestingModule({
        providers: [
          provideCommands([cmd('root')]),
          provideRouter([
            { path: 'x', providers: [provideCommands([cmd('route')])], component: Routed },
          ]),
        ],
      });

      const fixture = TestBed.createComponent(Shell);
      fixture.detectChanges();
      await TestBed.inject(Router).navigateByUrl('/x');
      fixture.detectChanges();

      expect(routed).toBeDefined();
      expect(ids(routed!.commands)).toEqual(['root', 'route', 'shell']);
    });

    it('a view child of a node with providers and viewProviders sees both sets', () => {
      @Component({ selector: 'cngx-test-view-child', template: '' })
      class ViewChild {
        readonly commands = injectCommands();
      }
      @Component({
        imports: [ViewChild],
        template: '<cngx-test-view-child />',
        providers: [provideCommands([cmd('b')])],
        viewProviders: [provideCommands([cmd('c')])],
      })
      class Mixed {}
      TestBed.configureTestingModule({ providers: [provideCommands([cmd('a')])] });

      const fixture = TestBed.createComponent(Mixed);
      fixture.detectChanges();
      const child = fixture.debugElement.query(By.directive(ViewChild))
        .componentInstance as ViewChild;
      expect(ids(child.commands)).toEqual(['a', 'b', 'c']);
    });
  });

  describe('guards', () => {
    it('an empty provideCommands() at a nested level leaves the parent set intact', () => {
      @Component({ template: '', viewProviders: [provideCommands()] })
      class Host {
        readonly commands = injectCommands();
      }
      TestBed.configureTestingModule({ providers: [provideCommands([cmd('a')])] });

      const fixture = TestBed.createComponent(Host);
      expect(ids(fixture.componentInstance.commands)).toEqual(['a']);
    });

    it('a raw CNGX_COMMAND_SOURCE multi-provider is read on its own', () => {
      TestBed.configureTestingModule({
        providers: [{ provide: CNGX_COMMAND_SOURCE, useValue: [cmd('x')], multi: true }],
      });

      expect(ids(merged())).toEqual(['x']);
    });

    it('the same source reference registered at root and at a nested level appears once', () => {
      const shared: readonly CngxCommand[] = [cmd('a')];
      @Component({ template: '', viewProviders: [provideCommands(shared)] })
      class Host {
        readonly commands = injectCommands();
      }
      TestBed.configureTestingModule({ providers: [provideCommands(shared)] });

      const fixture = TestBed.createComponent(Host);
      expect(ids(fixture.componentInstance.commands)).toEqual(['a']);
    });

    it('projected content does not see a viewProviders set', () => {
      @Component({ selector: 'cngx-test-content-child', template: '' })
      class ContentChild {
        readonly commands = injectCommands();
      }
      @Component({
        selector: 'cngx-test-scoped',
        template: '<ng-content />',
        viewProviders: [provideCommands([cmd('b')])],
      })
      class Scoped {}
      @Component({
        imports: [Scoped, ContentChild],
        template: '<cngx-test-scoped><cngx-test-content-child /></cngx-test-scoped>',
      })
      class Host {}
      TestBed.configureTestingModule({ providers: [provideCommands([cmd('a')])] });

      const fixture = TestBed.createComponent(Host);
      fixture.detectChanges();
      const child = fixture.debugElement.query(By.directive(ContentChild))
        .componentInstance as ContentChild;
      expect(ids(child.commands)).toEqual(['a']);
    });
  });
});

describe('provideCommands / injectCommands id dedupe', () => {
  it('an inner scope replaces an outer command with the same id, in the outer position', () => {
    @Component({
      template: '',
      viewProviders: [provideCommands([cmd('x', { label: 'scoped' }), cmd('c')])],
    })
    class Host {
      readonly commands = injectCommands();
    }
    TestBed.configureTestingModule({
      providers: [provideCommands([cmd('x', { label: 'global' }), cmd('b')])],
    });

    const commands = TestBed.createComponent(Host).componentInstance.commands;
    expect(ids(commands)).toEqual(['x', 'b', 'c']);
    expect(commands()[0].label).toBe('scoped');
  });

  it('on one level, the later registration of an id wins', () => {
    TestBed.configureTestingModule({
      providers: [
        provideCommands([cmd('x', { label: 'first' })]),
        provideCommands([cmd('x', { label: 'second' })]),
      ],
    });

    const commands = merged();
    expect(ids(commands)).toEqual(['x']);
    expect(commands()[0].label).toBe('second');
  });

  it('keeps the deduped array stable when an identical set is re-emitted', () => {
    const a = cmd('a');
    const x1 = cmd('x');
    const x2 = cmd('x');
    const source = signal<readonly CngxCommand[]>([a, x1, x2]);
    TestBed.configureTestingModule({ providers: [provideCommands(source)] });
    const commands = merged();

    const first = commands();
    source.set([a, x1, x2]);

    expect(first).toEqual([a, x2]);
    expect(commands()).toBe(first);
  });
});
