import { computed, type Signal } from '@angular/core';
import {
  createAnnouncementRecorder,
  resolveHeardAnnouncements,
  type CngxRecordedAnnouncement,
} from '@cngx/core/utils';
import { arrayEqual } from '@cngx/utils';

/**
 * Options for {@link createAnnouncementCapture}.
 *
 * @category core/testing
 * @since 0.1.0
 */
export interface CngxAnnouncementCaptureOptions {
  /** Subtree to observe. Defaults to the global `document`. */
  readonly root?: Node;
  /**
   * Maximum entries kept, and maximum writes a region defers while busy; the
   * oldest are dropped first, so a busy flip after more busy writes than
   * `limit` leaves the earliest out of the heard text. Defaults to 200.
   */
  readonly limit?: number;
}

/**
 * The handle {@link createAnnouncementCapture} returns.
 *
 * @category core/testing
 * @since 0.1.0
 */
export interface CngxAnnouncementCapture {
  /**
   * The recorded writes, heard or not, oldest first: each non-empty text a
   * live region exposed after the capture started, up to `limit`. Writing
   * the same text again counts once unless the region was emptied between.
   */
  readonly entries: Signal<readonly CngxRecordedAnnouncement[]>;
  /**
   * The texts assistive technology is expected to speak, oldest first:
   * `entries` filtered through `resolveHeardAnnouncements`. Keeps its array
   * reference while the heard texts do not change.
   */
  readonly heard: Signal<readonly string[]>;
  /** Empties `entries` and `heard`. Recording continues. */
  clear(): void;
  /** Stops recording. `entries` and `heard` keep what they hold. */
  stop(): void;
}

/**
 * Captures what a screen reader is expected to hear while a spec runs, by
 * observing every live region in the DOM. `heard` is the assertion target;
 * `entries` holds the recorded writes, including the ones not heard, with
 * the facts (`origin`, `role`, `busy`, `suppressedBy`) the judgement reads;
 * `resolveUnheardReason(entry)` names why one is not heard.
 *
 * What counts as heard is decided by `resolveHeardAnnouncements`: a text
 * change in a live region and the text read when `aria-busy` clears are
 * heard; a write that is hidden, inert, outside an open `aria-modal` element
 * or under `aria-busy` is not; a region inserted already holding its text,
 * or made live while holding it, is heard only for `role="alert"`, because
 * `status`, `log` and bare `aria-live` regions are announced inconsistently
 * when they appear.
 *
 * ```ts
 * const capture = createAnnouncementCapture();
 * TestBed.inject(CngxLiveAnnouncer).announce('Saved');
 * vi.advanceTimersByTime(16);
 * await Promise.resolve();
 *
 * expect(capture.heard()).toEqual(['Saved']);
 * capture.stop();
 * ```
 *
 * Timing: writes are seen when the `MutationObserver` callback runs, a
 * microtask after the write, and `CngxLiveAnnouncer` writes 16 ms after
 * `announce()`. Under fake timers, advance the clock by 16 ms and then
 * `await Promise.resolve()` before reading; with real timers, await a timeout
 * longer than 16 ms. Writes made directly into a region (a template binding
 * after change detection, or plain DOM) need only the microtask. Under
 * Jasmine, advance with `jasmine.clock().tick`; the capture uses no runner
 * API.
 *
 * Text already in a region when the capture starts is not recorded, so start
 * it after mounting and before acting. Call `stop()` in `afterEach`: the
 * observer otherwise keeps running into later specs that share the document.
 *
 * @param options The subtree to observe and how many entries to keep.
 *
 * @category core/testing
 * @since 0.1.0
 * @relatedTo resolveHeardAnnouncements, createAnnouncementRecorder
 */
export function createAnnouncementCapture(
  options: CngxAnnouncementCaptureOptions = {},
): CngxAnnouncementCapture {
  const recorder = createAnnouncementRecorder({ root: options.root, limit: options.limit });
  const heard = computed(
    () => resolveHeardAnnouncements(recorder.entries()).map((entry) => entry.text),
    { equal: arrayEqual },
  );
  return {
    entries: recorder.entries,
    heard,
    clear: () => recorder.clear(),
    stop: () => recorder.destroy(),
  };
}
