import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createAnnouncementCapture, type CngxAnnouncementCapture } from '@cngx/core/testing';
import { resolveUnheardReason } from '@cngx/core/utils';

import { cngxAnnouncementMatchers } from './public-api';

const observed = () => Promise.resolve();

function region(attrs: Record<string, string>, text = ''): HTMLElement {
  const el = document.createElement('div');
  for (const [name, value] of Object.entries(attrs)) {
    el.setAttribute(name, value);
  }
  el.textContent = text;
  return el;
}

describe('cngxAnnouncementMatchers', () => {
  let host: HTMLElement;
  let capture: CngxAnnouncementCapture;

  beforeEach(() => {
    host = document.createElement('section');
    document.body.appendChild(host);
    capture = createAnnouncementCapture({ root: host });
  });

  afterEach(() => {
    capture.stop();
    host.remove();
  });

  async function writeAll(target: HTMLElement, texts: readonly string[]): Promise<void> {
    for (const text of texts) {
      target.textContent = text;
      await observed();
    }
  }

  async function politeWrites(texts: readonly string[]): Promise<void> {
    const polite = region({ 'aria-live': 'polite' });
    host.append(polite);
    await writeAll(polite, texts);
  }

  it('runs the JSDoc registration and usage example', async () => {
    expect.extend(cngxAnnouncementMatchers);
    await politeWrites(['Loading', '12 results', 'Saved']);

    expect(capture).toHaveHeard('Saved');
    expect(capture).toHaveHeardInOrder(['Loading', /^\d+ results$/]);
    expect(capture).not.toHaveHeard('Upload failed');
  });

  it('prints the JSDoc failure message for a status inserted with its text', async () => {
    host.append(region({ role: 'status' }, 'Saved'));
    host.append(region({ role: 'alert' }, 'Save failed'));
    await observed();

    expect(() => expect(capture).toHaveHeard('Saved')).toThrow(
      [
        'expected the capture to have heard "Saved"',
        'heard: "Save failed"',
        '"Saved" was recorded but not heard: role="status" region inserted with its content; only role="alert" is announced reliably when it appears',
      ].join('\n'),
    );
  });

  describe('toHaveHeard', () => {
    it('matches a string exactly, not as a substring', async () => {
      await politeWrites(['Saved draft']);

      expect(capture).toHaveHeard('Saved draft');
      expect(capture).not.toHaveHeard('Saved');
    });

    it('tests a RegExp, also a global one twice in a row', async () => {
      await politeWrites(['12 results']);
      const pattern = /results/g;

      expect(capture).toHaveHeard(pattern);
      expect(capture).toHaveHeard(pattern);
      expect(capture).not.toHaveHeard(/^results/);
    });

    it('fails .not with the heard texts', async () => {
      await politeWrites(['Saved']);

      expect(() => expect(capture).not.toHaveHeard('Saved')).toThrow(
        'expected the capture not to have heard "Saved"\nheard: "Saved"',
      );
    });

    it('says nothing matching was recorded and that nothing was heard', () => {
      expect(() => expect(capture).toHaveHeard(/Saved/)).toThrow(
        'expected the capture to have heard /Saved/\nheard: nothing\nnothing matching /Saved/ was recorded',
      );
    });

    it('names a suppression', async () => {
      const hidden = region({ 'aria-live': 'polite', hidden: '' });
      const modal = document.createElement('dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('open', '');
      const outside = region({ 'aria-live': 'polite' });
      host.append(hidden, modal, outside);
      hidden.textContent = 'Hidden';
      outside.textContent = 'Behind';
      await observed();

      expect(() => expect(capture).toHaveHeard('Hidden')).toThrow(
        '"Hidden" was recorded but not heard: suppressed, inside a hidden element',
      );
      expect(() => expect(capture).toHaveHeard('Behind')).toThrow(
        '"Behind" was recorded but not heard: suppressed, outside the open aria-modal="true" element',
      );
    });

    it('names a status made live while already holding its text', async () => {
      const status = region({}, 'Saved');
      host.append(status);
      await observed();
      status.setAttribute('role', 'status');
      await observed();

      expect(() => expect(capture).toHaveHeard('Saved')).toThrow(
        '"Saved" was recorded but not heard: role="status" region made live while already holding its text; only role="alert" is announced reliably when it appears',
      );
    });

    it('names a busy write and passes once the flip records it', async () => {
      const status = region({ role: 'status', 'aria-busy': 'true' });
      host.append(status);
      status.textContent = '3 results';
      await observed();

      expect(() => expect(capture).toHaveHeard('3 results')).toThrow(
        '"3 results" was recorded but not heard: written under aria-busy="true"; it counts as heard only through a later busy-cleared entry',
      );

      status.setAttribute('aria-busy', 'false');
      await observed();

      expect(capture).toHaveHeard('3 results');
    });

    // An appearing non-alert region under aria-busy reports 'busy', but the
    // flip never replays it, so the message must not promise a later hearing.
    it('does not promise a hearing for a status inserted under aria-busy', async () => {
      const busy = region({ 'aria-busy': 'true' });
      host.append(busy);
      await observed();
      busy.append(region({ role: 'status' }, 'Saved'));
      await observed();
      expect(resolveUnheardReason(capture.entries()[0])).toBe('busy');

      const message = () => cngxAnnouncementMatchers.toHaveHeard(capture, 'Saved').message();
      expect(message()).toContain(
        '"Saved" was recorded but not heard: role="status" region appeared with its content under aria-busy="true", which clearing busy does not replay',
      );
      expect(message()).not.toContain('busy-cleared');

      busy.setAttribute('aria-busy', 'false');
      await observed();

      expect(capture.entries()).toHaveLength(1);
      expect(capture).not.toHaveHeard('Saved');
    });
  });

  describe('toHaveHeardInOrder', () => {
    it('passes for an in-order subsequence with other texts between', async () => {
      await politeWrites(['Loading', 'Still loading', '12 results', 'Done']);

      expect(capture).toHaveHeardInOrder(['Loading', /results$/, 'Done']);
      expect(capture).not.toHaveHeardInOrder(['Done', 'Loading']);
    });

    it('names the first missing text and that it was heard out of order', async () => {
      await politeWrites(['Done', 'Loading']);

      expect(() => expect(capture).toHaveHeardInOrder(['Loading', 'Done'])).toThrow(
        [
          'expected the capture to have heard in order: "Loading", "Done"',
          'heard: "Done", "Loading"',
          'missing after "Loading": "Done"',
          '"Done" was heard, but not after "Loading"',
        ].join('\n'),
      );
    });

    it('lists the unheard entries of the missing texts', async () => {
      await politeWrites(['Loading']);
      host.append(region({ role: 'status' }, 'Saved'));
      await observed();

      expect(() => expect(capture).toHaveHeardInOrder(['Loading', 'Saved'])).toThrow(
        [
          'expected the capture to have heard in order: "Loading", "Saved"',
          'heard: "Loading"',
          'missing after "Loading": "Saved"',
          '"Saved" was recorded but not heard: role="status" region inserted with its content; only role="alert" is announced reliably when it appears',
        ].join('\n'),
      );
    });

    it('fails .not with the heard texts', async () => {
      await politeWrites(['Loading', 'Done']);

      expect(() => expect(capture).not.toHaveHeardInOrder(['Loading', 'Done'])).toThrow(
        'expected the capture not to have heard in order: "Loading", "Done"\nheard: "Loading", "Done"',
      );
    });

    it('throws on an empty or non-array expectation', () => {
      expect(() => expect(capture).toHaveHeardInOrder([])).toThrow(TypeError);
      expect(() => expect(capture).not.toHaveHeardInOrder([])).toThrow(TypeError);
      expect(() =>
        cngxAnnouncementMatchers.toHaveHeardInOrder(capture, 'Saved' as unknown as string[]),
      ).toThrow(
        'toHaveHeardInOrder expects a non-empty array of strings or RegExps, received string',
      );
    });
  });

  describe('a received value that is not a capture', () => {
    it.each([
      ['null', null],
      ['an array', ['Saved']],
      ['string', 'Saved'],
      ['object', { heard: () => ['Saved'] }],
    ])('throws for %s, with and without .not', (described, value) => {
      const message = `toHaveHeard expects the capture returned by createAnnouncementCapture(), received ${described}`;

      expect(() => expect(value).toHaveHeard('Saved')).toThrow(message);
      expect(() => expect(value).not.toHaveHeard('Saved')).toThrow(message);
      expect(() => expect(value).toHaveHeardInOrder(['Saved'])).toThrow(TypeError);
    });

    it('throws for an expectation that is neither a string nor a RegExp', () => {
      expect(() => expect(capture).toHaveHeard(42 as unknown as string)).toThrow(
        'toHaveHeard expects a string or a RegExp, received number',
      );
      expect(() => expect(capture).toHaveHeardInOrder(['Saved', 42 as unknown as string])).toThrow(
        'toHaveHeardInOrder expects a string or a RegExp, received number',
      );
    });
  });
});
