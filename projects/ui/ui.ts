/**
 * @cngx/ui
 *
 * Organism layer of cngx: 26 secondary entry points (layout, overlay,
 * feedback, stepper/mat-stepper, tabs/mat-tabs, accordion/mat-accordion,
 * paginator/mat-paginator, sidenav, breadcrumb, timeline, toc,
 * command-palette, context-menu, collection, stat-card, chart-panel,
 * data-grid-accordion, empty-state, action-button, skeleton, speak, a11y).
 * Import from the specific entry point; the root barrel keeps only a
 * small backwards-compat set (see public-api.ts).
 */

import { makeVersion } from '@cngx/utils';

/** @internal - replaced at publish time, not part of consumer API. */
export const VERSION = makeVersion('0.0.0-PLACEHOLDER');
