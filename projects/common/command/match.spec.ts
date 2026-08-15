import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import type { CngxCommand } from './command';
import { createDefaultCommandMatcher, type CngxCommandMatcher } from './match';
import { CNGX_COMMAND_MATCH_FACTORY } from './match-strategy.token';

function cmd(id: string, overrides: Partial<CngxCommand> = {}): CngxCommand {
  return { id, label: id, run: () => {}, ...overrides };
}

describe('createDefaultCommandMatcher', () => {
  const match = createDefaultCommandMatcher();

  it('returns every command at score 0 in order for an empty query', () => {
    const commands = [cmd('a'), cmd('b')];
    expect(match(commands, '').map((r) => r.command.id)).toEqual(['a', 'b']);
    expect(match(commands, '   ').every((r) => r.score === 0)).toBe(true);
  });

  it('ranks label-exact > prefix > substring > keyword', () => {
    const commands = [
      cmd('substring', { label: 'xxopenxx' }),
      cmd('keyword', { label: 'unrelated', keywords: ['open'] }),
      cmd('exact', { label: 'open' }),
      cmd('prefix', { label: 'opened' }),
    ];
    expect(match(commands, 'open').map((r) => r.command.id)).toEqual([
      'exact',
      'prefix',
      'substring',
      'keyword',
    ]);
  });

  it('drops non-matching commands', () => {
    const commands = [cmd('a', { label: 'alpha' }), cmd('b', { label: 'beta' })];
    expect(match(commands, 'alph').map((r) => r.command.id)).toEqual(['a']);
  });

  it('filters to the given scope by group', () => {
    const commands = [
      cmd('a', { label: 'alpha', group: 'files' }),
      cmd('b', { label: 'alpha too', group: 'edit' }),
    ];
    expect(match(commands, 'alpha', 'files').map((r) => r.command.id)).toEqual(['a']);
  });
});

describe('CNGX_COMMAND_MATCH_FACTORY', () => {
  it('defaults to the label/keyword ranker', () => {
    TestBed.configureTestingModule({});
    const factory = TestBed.runInInjectionContext(() => TestBed.inject(CNGX_COMMAND_MATCH_FACTORY));
    const match = factory();
    const commands = [cmd('a', { label: 'zzz' }), cmd('b', { label: 'open' })];

    expect(match(commands, 'open').map((r) => r.command.id)).toEqual(['b']);
  });

  it('is overridable, swapping the ranking with zero consumer-site edits', () => {
    // A reverse-alphabetical matcher swapped in via the token.
    const reverseMatcher: CngxCommandMatcher = (commands) =>
      [...commands]
        .sort((a, b) => b.label.localeCompare(a.label))
        .map((command) => ({ command, score: 1 }));
    TestBed.configureTestingModule({
      providers: [{ provide: CNGX_COMMAND_MATCH_FACTORY, useValue: () => reverseMatcher }],
    });

    const factory = TestBed.inject(CNGX_COMMAND_MATCH_FACTORY);
    const match = factory();
    const commands = [cmd('a', { label: 'alpha' }), cmd('b', { label: 'beta' })];

    expect(match(commands, 'anything').map((r) => r.command.id)).toEqual(['b', 'a']);
  });
});
