import checkbox from '@inquirer/checkbox';
import confirm from '@inquirer/confirm';
import select from '@inquirer/select';

export interface PromptChoice<T extends string> {
  readonly value: T;
  readonly name: string;
  /** Preselected in a multi-select. */
  readonly checked?: boolean;
}

export type PromptAnswer = string | boolean | readonly string[];

/** What the manifest records: one answer per question key. */
export type PromptAnswers = Readonly<Record<string, PromptAnswer>>;

interface Question<T> {
  /** Stable key in the answers record and the flag that answers it. */
  readonly key: string;
  readonly message: string;
  /** The answer when nobody is asked and no flag was given. */
  readonly default: T;
}

export interface SelectQuestion<T extends string> extends Question<T> {
  readonly choices: readonly PromptChoice<T>[];
}

export interface MultiSelectQuestion<T extends string> extends Question<readonly T[]> {
  readonly choices: readonly PromptChoice<T>[];
}

export type ConfirmQuestion = Question<boolean>;

/** The terminal side; the inquirer adapter by default, a fake in specs. */
export interface PromptAdapter {
  select<T extends string>(question: SelectQuestion<T>): Promise<T>;
  multiSelect<T extends string>(question: MultiSelectQuestion<T>): Promise<readonly T[]>;
  confirm(question: ConfirmQuestion): Promise<boolean>;
}

export interface PromptFlow {
  select<T extends string>(question: SelectQuestion<T>): Promise<T>;
  multiSelect<T extends string>(question: MultiSelectQuestion<T>): Promise<readonly T[]>;
  confirm(question: ConfirmQuestion): Promise<boolean>;
  /** Every answer so far, flag, prompt or default alike. */
  answers(): PromptAnswers;
}

export interface PromptFlowOptions {
  /** Resolved once in the shell with `canPrompt(...)`. */
  readonly canPrompt: boolean;
  /** Answers already given as flags or by the preset; they are never asked. */
  readonly answers?: PromptAnswers;
  readonly adapter?: PromptAdapter;
}

/**
 * Detection-dependent questions run inside the rule, so `x-prompt` cannot
 * ask them. A terminal is the only signal: `ng add` strips `--interactive`
 * before the rule runs, and `--prompts=false` is the schematic's own switch
 * for CI under a pseudo-terminal.
 */
export function canPrompt(isTTY: boolean | undefined, prompts: boolean | undefined): boolean {
  return isTTY === true && prompts !== false;
}

export const inquirerAdapter: PromptAdapter = {
  select: (question) =>
    select({
      message: question.message,
      choices: question.choices.map(({ value, name }) => ({ value, name })),
      default: question.default,
    }),
  multiSelect: (question) =>
    checkbox({
      message: question.message,
      choices: question.choices.map(({ value, name, checked }) => ({
        value,
        name,
        checked: checked ?? question.default.includes(value),
      })),
    }),
  confirm: (question) => confirm({ message: question.message, default: question.default }),
};

function assertChoices<T extends string>(
  question: SelectQuestion<T> | MultiSelectQuestion<T>,
  values: readonly string[],
): asserts values is readonly T[] {
  const allowed = new Set<string>(question.choices.map((choice) => choice.value));
  const unknown = values.filter((value) => !allowed.has(value));
  if (unknown.length > 0) {
    throw new Error(
      `"${unknown.join('", "')}" is not a valid answer for ${question.key}. Expected one of: ${[...allowed].join(', ')}.`,
    );
  }
}

// Array.isArray narrows a readonly array to any[]; this keeps the element type.
function isList(answer: PromptAnswer | undefined): answer is readonly string[] {
  return Array.isArray(answer);
}

function given(answers: PromptAnswers, key: string): PromptAnswer | undefined {
  return Object.prototype.hasOwnProperty.call(answers, key) ? answers[key] : undefined;
}

/**
 * One question API for the onboarding steps. A given answer wins, then the
 * terminal, then the question's default; whichever answered lands in
 * `answers()` for the install manifest.
 */
export function createPromptFlow({
  canPrompt: interactive,
  answers: preset = {},
  adapter = inquirerAdapter,
}: PromptFlowOptions): PromptFlow {
  const recorded: Record<string, PromptAnswer> = {};

  function record<T extends PromptAnswer>(key: string, value: T): T {
    recorded[key] = value;
    return value;
  }

  return {
    async select(question) {
      const flag = given(preset, question.key);
      if (typeof flag === 'string') {
        const values = [flag];
        assertChoices(question, values);
        return record(question.key, values[0]);
      }
      const answer = interactive ? await adapter.select(question) : question.default;
      return record(question.key, answer);
    },
    async multiSelect(question) {
      const flag = given(preset, question.key);
      if (isList(flag)) {
        const values = [...flag];
        assertChoices(question, values);
        return record(question.key, values);
      }
      const answer = interactive ? await adapter.multiSelect(question) : question.default;
      return record(question.key, [...answer]);
    },
    async confirm(question) {
      const flag = given(preset, question.key);
      if (typeof flag === 'boolean') {
        return record(question.key, flag);
      }
      const answer = interactive ? await adapter.confirm(question) : question.default;
      return record(question.key, answer);
    },
    answers: () => ({ ...recorded }),
  };
}
