import { isHeardOnAppearance, type CngxRecordedAnnouncement } from './announcement-recorder';

/**
 * Why assistive technology is not expected to speak a recorded entry:
 * - `'suppressed'`: the entry carries a `suppressedBy` reason (`hidden`,
 *   `aria-hidden`, `inert`, or outside an open `aria-modal` element);
 * - `'busy'`: the text was written while the region or an ancestor was
 *   `aria-busy="true"`;
 * - `'unreliable-insertion'`: the region appeared already holding its text
 *   (`'insertion'` or `'became-live'`) and is not `role="alert"`.
 *
 * @since 0.1.0
 * @relatedTo resolveUnheardReason, resolveHeardAnnouncements
 */
export type CngxUnheardReason = 'suppressed' | 'busy' | 'unreliable-insertion';

/**
 * Judges one recorded entry: `null` when assistive technology is expected to
 * speak it, else the first reason it is not. The clauses are checked in this
 * order, so an entry that fails several reports the first:
 *
 * 1. `'suppressed'`: AT does not read text that is hidden, inert or outside
 *    an open modal.
 * 2. `'busy'`: AT defers a write under `aria-busy`. What it reads once busy
 *    clears is recorded as its own `'busy-cleared'` entry, so the deferred
 *    write is not counted a second time.
 * 3. `'unreliable-insertion'`: a `status`, `log` or bare `aria-live` region
 *    inserted together with its content, or made live after it already held
 *    text, is announced by some screen reader / browser pairs and not by
 *    others. `role="alert"` is announced on insertion, so it passes; `role`
 *    is read by its first token, as the recorder reads it (`"alert status"`
 *    is an alert).
 *
 * A text change in a live region (`'mutation'`) or a busy flip
 * (`'busy-cleared'`) is heard unless it is suppressed or busy. Pure: it reads
 * only the entry, never the DOM.
 *
 * ```typescript
 * const recorder = createAnnouncementRecorder();
 * // ... a role="status" region is inserted holding 'Saved'
 * resolveUnheardReason(recorder.entries()[0]); // 'unreliable-insertion'
 * ```
 *
 * @param entry An entry from {@link createAnnouncementRecorder}.
 *
 * @since 0.1.0
 * @relatedTo resolveHeardAnnouncements, createAnnouncementRecorder
 */
export function resolveUnheardReason(entry: CngxRecordedAnnouncement): CngxUnheardReason | null {
  if (entry.suppressedBy !== null) {
    return 'suppressed';
  }
  if (entry.busy) {
    return 'busy';
  }
  const appeared = entry.origin === 'insertion' || entry.origin === 'became-live';
  if (appeared && !isHeardOnAppearance(entry.role)) {
    return 'unreliable-insertion';
  }
  return null;
}

/**
 * The entries assistive technology is expected to speak, in recorded order:
 * every entry for which {@link resolveUnheardReason} returns `null`. This is
 * the one judgement of what counts as heard; the recorder itself drops
 * nothing, and its callers filter through this function instead of keeping a
 * rule of their own.
 *
 * ```typescript
 * const recorder = createAnnouncementRecorder();
 * // ... the component under test announces
 * const heard = resolveHeardAnnouncements(recorder.entries()).map((entry) => entry.text);
 * ```
 *
 * @param entries Entries from {@link createAnnouncementRecorder}.
 * @returns A new array; `[]` when nothing is heard.
 *
 * @since 0.1.0
 * @relatedTo resolveUnheardReason, createAnnouncementRecorder, createAnnouncementCapture
 */
export function resolveHeardAnnouncements(
  entries: readonly CngxRecordedAnnouncement[],
): readonly CngxRecordedAnnouncement[] {
  return entries.filter((entry) => resolveUnheardReason(entry) === null);
}
