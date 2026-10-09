import { describe, expect, it } from 'vitest';

import {
  canPrompt,
  createPromptFlow,
  type MultiSelectQuestion,
  type PromptAdapter,
  type SelectQuestion,
} from './prompt';

type Theme = 'cngx' | 'material';
type Tool = 'claude' | 'cursor' | 'vscode';

const THEME: SelectQuestion<Theme> = {
  key: 'theme',
  message: 'Which theme should cngx generate?',
  choices: [
    { value: 'cngx', name: 'cngx default' },
    { value: 'material', name: 'Material bridge' },
  ],
  default: 'cngx',
};

const TOOLS: MultiSelectQuestion<Tool> = {
  key: 'aiTools',
  message: 'Which AI tools should cngx configure?',
  choices: [
    { value: 'claude', name: 'Claude Code' },
    { value: 'cursor', name: 'Cursor' },
    { value: 'vscode', name: 'VS Code' },
  ],
  default: ['claude'],
};

const LINT = { key: 'lint', message: 'Add the cngx eslint plugin?', default: true } as const;

interface Asked {
  readonly adapter: PromptAdapter;
  readonly asked: string[];
}

function scripted(): Asked {
  const asked: string[] = [];
  return {
    asked,
    adapter: {
      select: <T extends string>(question: SelectQuestion<T>) => {
        asked.push(question.key);
        return Promise.resolve(question.choices[question.choices.length - 1].value);
      },
      multiSelect: <T extends string>(question: MultiSelectQuestion<T>) => {
        asked.push(question.key);
        return Promise.resolve(question.choices.map((choice) => choice.value));
      },
      confirm: (question) => {
        asked.push(question.key);
        return Promise.resolve(!question.default);
      },
    },
  };
}

describe('canPrompt', () => {
  it('prompts on a terminal unless --prompts=false', () => {
    expect(canPrompt(true, undefined)).toBe(true);
    expect(canPrompt(true, true)).toBe(true);
    expect(canPrompt(true, false)).toBe(false);
  });

  it('never prompts without a terminal', () => {
    expect(canPrompt(false, true)).toBe(false);
    expect(canPrompt(undefined, undefined)).toBe(false);
  });
});

describe('createPromptFlow', () => {
  it('answers every question with its default and asks nothing when it cannot prompt', async () => {
    const { adapter, asked } = scripted();
    const flow = createPromptFlow({ canPrompt: false, adapter });

    expect(await flow.select(THEME)).toBe('cngx');
    expect(await flow.multiSelect(TOOLS)).toEqual(['claude']);
    expect(await flow.confirm(LINT)).toBe(true);
    expect(asked).toEqual([]);
  });

  it('asks the terminal when it can prompt', async () => {
    const { adapter, asked } = scripted();
    const flow = createPromptFlow({ canPrompt: true, adapter });

    expect(await flow.select(THEME)).toBe('material');
    expect(await flow.multiSelect(TOOLS)).toEqual(['claude', 'cursor', 'vscode']);
    expect(await flow.confirm(LINT)).toBe(false);
    expect(asked).toEqual(['theme', 'aiTools', 'lint']);
  });

  it('never asks a question a flag already answered', async () => {
    const { adapter, asked } = scripted();
    const flow = createPromptFlow({
      canPrompt: true,
      adapter,
      answers: { theme: 'cngx', aiTools: ['cursor'], lint: true },
    });

    expect(await flow.select(THEME)).toBe('cngx');
    expect(await flow.multiSelect(TOOLS)).toEqual(['cursor']);
    expect(await flow.confirm(LINT)).toBe(true);
    expect(asked).toEqual([]);
  });

  it('rejects a flag value that is not a choice', async () => {
    const flow = createPromptFlow({ canPrompt: false, answers: { theme: 'bootstrap' } });

    await expect(flow.select(THEME)).rejects.toThrow(
      '"bootstrap" is not a valid answer for theme. Expected one of: cngx, material.',
    );
  });

  it('rejects unknown entries in a multi-select flag', async () => {
    const flow = createPromptFlow({ canPrompt: false, answers: { aiTools: ['claude', 'zed'] } });

    await expect(flow.multiSelect(TOOLS)).rejects.toThrow(
      '"zed" is not a valid answer for aiTools.',
    );
  });

  it('records every answer for the manifest, whichever source gave it', async () => {
    const { adapter } = scripted();
    const flow = createPromptFlow({ canPrompt: true, adapter, answers: { theme: 'cngx' } });

    await flow.select(THEME);
    await flow.multiSelect(TOOLS);
    await flow.confirm(LINT);

    expect(flow.answers()).toEqual({
      theme: 'cngx',
      aiTools: ['claude', 'cursor', 'vscode'],
      lint: false,
    });
  });

  it('hands out snapshots of the answers and leaves its inputs alone', async () => {
    const preset = { aiTools: ['cursor'] };
    const flow = createPromptFlow({ canPrompt: false, answers: preset });

    const tools = await flow.multiSelect(TOOLS);
    const first = flow.answers();
    await flow.confirm(LINT);

    expect(first).toEqual({ aiTools: ['cursor'] });
    expect(tools).not.toBe(preset.aiTools);
    expect(preset).toEqual({ aiTools: ['cursor'] });
  });

  it('ignores inherited keys on the given answers', async () => {
    const answers = Object.create({ theme: 'material' }) as Record<string, string>;
    const flow = createPromptFlow({ canPrompt: false, answers });

    expect(await flow.select(THEME)).toBe('cngx');
  });
});
