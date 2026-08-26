import { describe, expect, it } from 'vitest';
import { migrateCngxPrompt, themeComponentPrompt, wireComponentPrompt } from './register-prompts.js';

function textOf(result: { messages: { role: string; content: { type: string; text?: string } }[] }): string {
  const [message] = result.messages;
  expect(message.role).toBe('user');
  expect(message.content.type).toBe('text');
  return message.content.text ?? '';
}

describe('wireComponentPrompt', () => {
  it('interpolates the component and names get_api / get_slots / get_config', () => {
    const text = textOf(wireComponentPrompt('CngxSelect'));

    expect(text).toContain('CngxSelect');
    expect(text).toContain('get_api');
    expect(text).toContain('get_slots');
    expect(text).toContain('get_config');
  });
});

describe('themeComponentPrompt', () => {
  it('interpolates the component and names get_theme_tokens', () => {
    const text = textOf(themeComponentPrompt('CngxSelect'));

    expect(text).toContain('CngxSelect');
    expect(text).toContain('get_theme_tokens');
  });
});

describe('migrateCngxPrompt', () => {
  it('names migrate_usage and interpolates both versions when "to" is given', () => {
    const text = textOf(migrateCngxPrompt('0.1.0', '0.2.0'));

    expect(text).toContain('migrate_usage');
    expect(text).toContain('0.1.0');
    expect(text).toContain('0.2.0');
    expect(text).toContain('{ from: "0.1.0", to: "0.2.0" }');
  });

  it('falls back to the bundled snapshot when "to" is omitted, never emitting undefined', () => {
    const text = textOf(migrateCngxPrompt('0.1.0'));

    expect(text).toContain('0.1.0');
    expect(text).toContain('bundled snapshot');
    expect(text).toContain('{ from: "0.1.0" }');
    expect(text).not.toContain('undefined');
  });
});
