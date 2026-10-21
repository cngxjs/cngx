import { signal, type TemplateRef } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { createDecorationTemplates } from './decoration-templates';
import type {
  CngxMatTabAggregatorContent,
  CngxMatTabAggregatorContentContext,
} from './mat-tab-aggregator-content.directive';
import type {
  CngxMatTabRejectionContent,
  CngxMatTabRejectionContentContext,
} from './mat-tab-rejection-content.directive';

const aggregatorTpl = {} as TemplateRef<CngxMatTabAggregatorContentContext>;
const slotRejectionTpl = {} as TemplateRef<CngxMatTabRejectionContentContext>;
const configRejectionTpl = {} as TemplateRef<CngxMatTabRejectionContentContext>;

function setup(rejectionDefault?: TemplateRef<CngxMatTabRejectionContentContext>) {
  const aggregatorSlot = signal<CngxMatTabAggregatorContent | undefined>(undefined);
  const rejectionSlot = signal<CngxMatTabRejectionContent | undefined>(undefined);
  const templates = createDecorationTemplates(aggregatorSlot, rejectionSlot, {
    templates: { rejection: rejectionDefault },
  });
  return { aggregatorSlot, rejectionSlot, templates };
}

describe('createDecorationTemplates', () => {
  it('resolves both slots to null when nothing is projected or configured', () => {
    const { templates } = setup();
    expect(templates.aggregator()).toBeNull();
    expect(templates.rejection()).toBeNull();
  });

  it('follows the projected aggregator slot', () => {
    const { aggregatorSlot, templates } = setup();
    aggregatorSlot.set({ templateRef: aggregatorTpl } as CngxMatTabAggregatorContent);
    expect(templates.aggregator()).toBe(aggregatorTpl);
    aggregatorSlot.set(undefined);
    expect(templates.aggregator()).toBeNull();
  });

  it('prefers a projected rejection slot over the config default', () => {
    const { rejectionSlot, templates } = setup(configRejectionTpl);
    expect(templates.rejection()).toBe(configRejectionTpl);
    rejectionSlot.set({ templateRef: slotRejectionTpl } as CngxMatTabRejectionContent);
    expect(templates.rejection()).toBe(slotRejectionTpl);
  });
});
