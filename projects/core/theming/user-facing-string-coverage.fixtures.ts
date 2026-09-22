/**
 * Manifests for `user-facing-string-coverage.spec.ts`.
 *
 * Kept beside the guard rather than inside it: the three lists are the
 * auditable artefact of the i18n coverage program, they change on a different
 * cadence than the scanner, and a reviewer should be able to read the ratchet
 * without paging past 200 lines of regex.
 *
 * A row is keyed by `file` + `value`, never by line - a string that moves
 * within its file is the same gap, and a ratchet keyed on line numbers would
 * fail on every unrelated edit above it.
 */

/** One row of any of the three manifests. */
export interface StringManifestEntry {
  /** Repo-relative path, exactly as the scanner reports it. */
  readonly file: string;
  /** The literal, verbatim. */
  readonly value: string;
  /** Why this row exists. One clause, no prose. */
  readonly note: string;
}

/**
 * The gap list: user-facing strings that ship with no override path.
 *
 * Shrinks to empty across the program; the suite asserts every row still
 * matches a real hit, so a fixed string cannot linger here.
 */
export const RATCHET: readonly StringManifestEntry[] = [
  // @cngx/ui/feedback - the two region labels are closed (CNGX_FEEDBACK_I18N).
  // What is left announces state rather than naming a landmark, so it wants an
  // announcement bundle rather than two more region keys.
  {
    file: 'projects/ui/feedback/alert/alert-stack.ts',
    value: 'Show ',
    note: 'overflowTrigger - "Show N more alerts" is assembled in the template',
  },
  {
    file: 'projects/ui/feedback/alert/alert.ts',
    value: 'Alert dismissed',
    note: 'alertDismissed - SR announcement on dismiss',
  },
  {
    file: 'projects/ui/feedback/async-container/async-container.ts',
    value: 'Loading content',
    note: 'asyncLoading - status announcement off the state bridge',
  },
  {
    file: 'projects/ui/feedback/async-container/async-container.ts',
    value: 'Content loaded',
    note: 'asyncLoaded - status announcement off the state bridge',
  },
  {
    file: 'projects/ui/feedback/async-container/async-container.ts',
    value: 'Error loading content',
    note: 'asyncError - status announcement off the state bridge',
  },
  {
    file: 'projects/ui/feedback/async-container/async-container.ts',
    value: 'Refreshing content',
    note: 'asyncRefreshing - status announcement off the state bridge',
  },
  {
    file: 'projects/ui/feedback/async-container/async-container.ts',
    value: 'Content refreshed',
    note: 'asyncRefreshed - status announcement off the state bridge',
  },
  {
    file: 'projects/ui/feedback/async-container/async-container.ts',
    value: 'Refresh failed',
    note: 'asyncRefreshFailed - status announcement off the state bridge',
  },

  // @cngx/common - the dialog strings are closed (CNGX_DIALOG_CONFIG.labels).
  // The card announcement phrases have no phase of their own yet.
  {
    file: 'projects/common/card/card.component.ts',
    value: 'Selected',
    note: 'selected - armed selection phrase on the card live region',
  },
  {
    file: 'projects/common/card/card.component.ts',
    value: 'Deselected',
    note: 'deselected - armed selection phrase on the card live region',
  },
  {
    file: 'projects/common/card/card.component.ts',
    value: 'Loading',
    note: 'loading - live-region text while the card loads',
  },

];

/**
 * Strings the scanner cannot prove are covered, but which are - the override
 * read happens through an indirection the regex does not follow.
 *
 * Not a parking lot: every row names the token that overrides it.
 */
export const ALREADY_COVERED: readonly StringManifestEntry[] = [
  {
    file: 'projects/forms/input/phone-input/countries.ts',
    value: 'United States',
    note: 'default row of CNGX_PHONE_COUNTRIES, replaced wholesale via CngxPhoneInput [countries]',
  },
  {
    file: 'projects/forms/input/phone-input/countries.ts',
    value: 'United Kingdom',
    note: 'default row of CNGX_PHONE_COUNTRIES, replaced wholesale via CngxPhoneInput [countries]',
  },
  {
    file: 'projects/forms/input/phone-input/countries.ts',
    value: 'Germany',
    note: 'default row of CNGX_PHONE_COUNTRIES, replaced wholesale via CngxPhoneInput [countries]',
  },
  {
    file: 'projects/forms/input/phone-input/countries.ts',
    value: 'Austria',
    note: 'default row of CNGX_PHONE_COUNTRIES, replaced wholesale via CngxPhoneInput [countries]',
  },
  {
    file: 'projects/forms/input/phone-input/countries.ts',
    value: 'Switzerland',
    note: 'default row of CNGX_PHONE_COUNTRIES, replaced wholesale via CngxPhoneInput [countries]',
  },
  {
    file: 'projects/forms/input/phone-input/countries.ts',
    value: 'France',
    note: 'default row of CNGX_PHONE_COUNTRIES, replaced wholesale via CngxPhoneInput [countries]',
  },
  {
    file: 'projects/forms/input/phone-input/countries.ts',
    value: 'Italy',
    note: 'default row of CNGX_PHONE_COUNTRIES, replaced wholesale via CngxPhoneInput [countries]',
  },
  {
    file: 'projects/forms/input/phone-input/countries.ts',
    value: 'Spain',
    note: 'default row of CNGX_PHONE_COUNTRIES, replaced wholesale via CngxPhoneInput [countries]',
  },
  {
    file: 'projects/forms/input/phone-input/countries.ts',
    value: 'Slovenia',
    note: 'default row of CNGX_PHONE_COUNTRIES, replaced wholesale via CngxPhoneInput [countries]',
  },
  {
    file: 'projects/forms/input/phone-input/countries.ts',
    value: 'Croatia',
    note: 'default row of CNGX_PHONE_COUNTRIES, replaced wholesale via CngxPhoneInput [countries]',
  },
  {
    file: 'projects/forms/input/phone-input/countries.ts',
    value: 'Poland',
    note: 'default row of CNGX_PHONE_COUNTRIES, replaced wholesale via CngxPhoneInput [countries]',
  },
  {
    file: 'projects/forms/input/phone-input/countries.ts',
    value: 'Japan',
    note: 'default row of CNGX_PHONE_COUNTRIES, replaced wholesale via CngxPhoneInput [countries]',
  },
  {
    file: 'projects/forms/input/phone-input/countries.ts',
    value: 'Brazil',
    note: 'default row of CNGX_PHONE_COUNTRIES, replaced wholesale via CngxPhoneInput [countries]',
  },
  {
    file: 'projects/ui/action-button/action-button.ts',
    value: 'Action succeeded',
    note: 'overridden per instance by [succeededAnnouncement] then [succeededLabel]',
  },
  {
    file: 'projects/ui/action-button/action-button.ts',
    value: 'Action failed',
    note: 'overridden per instance by [failedAnnouncement] then [failedLabel]',
  },
];

/**
 * Deliberate non-hooks. Each row cites the accepted-debt entry that settled
 * it, so the guard does not re-raise a closed decision on every run.
 */
export const EXCLUDED: readonly StringManifestEntry[] = [
  {
    file: 'projects/common/interactive/guard/can-deactivate.ts',
    value: 'You have unsaved changes. Leave anyway?',
    note: 'default parameter of canDeactivateWhenClean - the caller passes its own message',
  },
];
