import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import {
  CngxTimelineConnector,
  type TimelineConnectorPosition,
} from './connector.component';
import type { TimelineStatus } from './marker.component';

function mount(): { host: HTMLElement; set: (name: string, value: unknown) => void } {
  const fixture = TestBed.createComponent(CngxTimelineConnector);
  fixture.detectChanges();
  return {
    host: fixture.nativeElement as HTMLElement,
    set: (name, value) => {
      fixture.componentRef.setInput(name, value);
      fixture.detectChanges();
    },
  };
}

describe('CngxTimelineConnector', () => {
  it('is hidden from assistive tech - the rail repeats what DOM order already says', () => {
    TestBed.configureTestingModule({ imports: [CngxTimelineConnector] });

    expect(mount().host.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders as a full-height middle segment by default', () => {
    TestBed.configureTestingModule({ imports: [CngxTimelineConnector] });

    expect(mount().host.getAttribute('data-position')).toBe('middle');
  });

  it.each<TimelineConnectorPosition>(['middle', 'first', 'last', 'only'])(
    'reflects position "%s" onto data-position',
    (position) => {
      TestBed.configureTestingModule({ imports: [CngxTimelineConnector] });
      const { host, set } = mount();

      set('position', position);

      expect(host.getAttribute('data-position')).toBe(position);
    },
  );

  it('carries no data-status until one is bound', () => {
    TestBed.configureTestingModule({ imports: [CngxTimelineConnector] });

    expect(mount().host.hasAttribute('data-status')).toBe(false);
  });

  it.each<TimelineStatus>(['done', 'active', 'upcoming', 'rejected'])(
    'reflects status "%s" onto data-status',
    (status) => {
      TestBed.configureTestingModule({ imports: [CngxTimelineConnector] });
      const { host, set } = mount();

      set('status', status);

      expect(host.getAttribute('data-status')).toBe(status);
    },
  );

  it('renders nothing inside itself - the rail is the border', () => {
    TestBed.configureTestingModule({ imports: [CngxTimelineConnector] });

    expect(mount().host.childElementCount).toBe(0);
  });
});
