import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  resolveHeardAnnouncements as publicResolveHeardAnnouncements,
  resolveUnheardReason as publicResolveUnheardReason,
} from '@cngx/core/utils';

import {
  createAnnouncementRecorder,
  type CngxAnnouncementOrigin,
  type CngxAnnouncementRecorder,
  type CngxRecordedAnnouncement,
} from './announcement-recorder';
import {
  resolveHeardAnnouncements,
  resolveUnheardReason,
  type CngxUnheardReason,
} from './heard-announcements';

const ORIGINS: readonly CngxAnnouncementOrigin[] = [
  'mutation',
  'insertion',
  'became-live',
  'busy-cleared',
];
const ROLES: readonly (string | null)[] = ['status', 'alert', 'log', null];
const BUSY: readonly boolean[] = [false, true];
const SUPPRESSED: readonly CngxRecordedAnnouncement['suppressedBy'][] = [null, 'aria-hidden'];

function entry(overrides: Partial<CngxRecordedAnnouncement> = {}): CngxRecordedAnnouncement {
  return {
    time: 0,
    text: 'Text',
    politeness: 'polite',
    role: 'status',
    busy: false,
    suppressedBy: null,
    origin: 'mutation',
    region: document.createElement('div'),
    owner: null,
    ...overrides,
  };
}

function expectedReason(
  origin: CngxAnnouncementOrigin,
  role: string | null,
  busy: boolean,
  suppressedBy: CngxRecordedAnnouncement['suppressedBy'],
): CngxUnheardReason | null {
  if (suppressedBy !== null) {
    return 'suppressed';
  }
  if (busy) {
    return 'busy';
  }
  if ((origin === 'insertion' || origin === 'became-live') && role !== 'alert') {
    return 'unreliable-insertion';
  }
  return null;
}

const ROWS = ORIGINS.flatMap((origin) =>
  ROLES.flatMap((role) =>
    BUSY.flatMap((busy) =>
      SUPPRESSED.map((suppressedBy) => ({
        origin,
        role,
        busy,
        suppressedBy,
        reason: expectedReason(origin, role, busy, suppressedBy),
      })),
    ),
  ),
);

describe('resolveUnheardReason', () => {
  it('covers every origin x role x busy x suppression combination', () => {
    expect(ROWS).toHaveLength(64);
  });

  it.each(ROWS)(
    'origin $origin, role $role, busy $busy, suppressedBy $suppressedBy -> $reason',
    ({ origin, role, busy, suppressedBy, reason }) => {
      expect(resolveUnheardReason(entry({ origin, role, busy, suppressedBy }))).toBe(reason);
    },
  );

  it('hears a mutation in a status region', () => {
    expect(resolveUnheardReason(entry({ origin: 'mutation', role: 'status' }))).toBeNull();
  });

  it('hears an alert inserted with its text', () => {
    expect(resolveUnheardReason(entry({ origin: 'insertion', role: 'alert' }))).toBeNull();
  });

  it('does not hear a status region inserted with its text', () => {
    expect(resolveUnheardReason(entry({ origin: 'insertion', role: 'status' }))).toBe(
      'unreliable-insertion',
    );
  });

  it('does not hear a bare aria-live region made live while holding text', () => {
    expect(resolveUnheardReason(entry({ origin: 'became-live', role: null }))).toBe(
      'unreliable-insertion',
    );
  });

  it('reports suppression before busy, and busy before an unreliable insertion', () => {
    expect(
      resolveUnheardReason(
        entry({ origin: 'insertion', role: 'status', busy: true, suppressedBy: 'inert' }),
      ),
    ).toBe('suppressed');
    expect(resolveUnheardReason(entry({ origin: 'insertion', role: 'status', busy: true }))).toBe(
      'busy',
    );
  });

  it('hears a busy flip', () => {
    expect(resolveUnheardReason(entry({ origin: 'busy-cleared', role: 'log' }))).toBeNull();
  });

  it('judges from the entry fields, not the live DOM', () => {
    const region = document.createElement('div');
    region.hidden = true;
    region.setAttribute('aria-busy', 'true');

    expect(resolveUnheardReason(entry({ region }))).toBeNull();
  });
});

describe('resolveHeardAnnouncements', () => {
  it('returns [] for []', () => {
    expect(resolveHeardAnnouncements([])).toEqual([]);
  });

  it('keeps the heard entries in recorded order', () => {
    const first = entry({ text: 'First' });
    const busy = entry({ text: 'Busy', busy: true });
    const second = entry({ text: 'Second', origin: 'insertion', role: 'alert' });
    const inserted = entry({ text: 'Inserted', origin: 'insertion' });
    const third = entry({ text: 'Third', origin: 'busy-cleared' });

    expect(resolveHeardAnnouncements([first, busy, second, inserted, third])).toEqual([
      first,
      second,
      third,
    ]);
  });

  it('returns a new array and leaves the input alone', () => {
    const entries = [entry(), entry({ busy: true })];

    const heard = resolveHeardAnnouncements(entries);

    expect(heard).not.toBe(entries);
    expect(entries).toHaveLength(2);
  });

  it('is public API of @cngx/core/utils', () => {
    expect(publicResolveHeardAnnouncements).toBe(resolveHeardAnnouncements);
    expect(publicResolveUnheardReason).toBe(resolveUnheardReason);
  });
});

describe('heard judgement on recorded entries', () => {
  let host: HTMLElement;
  let recorder: CngxAnnouncementRecorder;

  beforeEach(() => {
    host = document.createElement('section');
    document.body.appendChild(host);
  });

  afterEach(() => {
    recorder?.destroy();
    host.remove();
  });

  it('judges a role="status" region inserted holding its text as unreliable', async () => {
    recorder = createAnnouncementRecorder({ root: host, owner: () => null });
    const status = document.createElement('div');
    status.setAttribute('role', 'status');
    status.textContent = 'Saved';

    host.append(status);
    await Promise.resolve();

    expect(recorder.entries().map((e) => e.origin)).toEqual(['insertion']);
    expect(resolveUnheardReason(recorder.entries()[0])).toBe('unreliable-insertion');
  });

  it('maps the heard entries to their text', async () => {
    const polite = document.createElement('div');
    polite.setAttribute('aria-live', 'polite');
    host.append(polite);
    recorder = createAnnouncementRecorder({ root: host, owner: () => null });

    polite.textContent = 'Saved';
    await Promise.resolve();
    const alert = document.createElement('div');
    alert.setAttribute('role', 'alert');
    alert.textContent = 'Upload failed';
    host.append(alert);
    const status = document.createElement('div');
    status.setAttribute('role', 'status');
    status.textContent = 'Inserted';
    host.append(status);
    await Promise.resolve();

    const heard = resolveHeardAnnouncements(recorder.entries()).map((e) => e.text);

    expect(recorder.entries()).toHaveLength(3);
    expect(heard).toEqual(['Saved', 'Upload failed']);
  });
});
