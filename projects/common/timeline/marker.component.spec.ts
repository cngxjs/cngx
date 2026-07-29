import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxAvatar } from '@cngx/common/display';
import { describe, expect, it } from 'vitest';

import { CngxTimelineMarker, type TimelineStatus } from './marker.component';

function mount(): { host: HTMLElement; set: (name: string, value: unknown) => void } {
  const fixture = TestBed.createComponent(CngxTimelineMarker);
  fixture.detectChanges();
  return {
    host: fixture.nativeElement as HTMLElement,
    set: (name, value) => {
      fixture.componentRef.setInput(name, value);
      fixture.detectChanges();
    },
  };
}

describe('CngxTimelineMarker', () => {
  it('is hidden from assistive tech - the item carries the status semantically', () => {
    TestBed.configureTestingModule({ imports: [CngxTimelineMarker] });

    expect(mount().host.getAttribute('aria-hidden')).toBe('true');
  });

  it('carries no data-status until one is bound', () => {
    TestBed.configureTestingModule({ imports: [CngxTimelineMarker] });

    expect(mount().host.hasAttribute('data-status')).toBe(false);
  });

  it.each<TimelineStatus>(['done', 'active', 'upcoming', 'rejected'])(
    'reflects status "%s" onto data-status',
    (status) => {
      TestBed.configureTestingModule({ imports: [CngxTimelineMarker] });
      const { host, set } = mount();

      set('status', status);

      expect(host.getAttribute('data-status')).toBe(status);
    },
  );

  it('drops data-status again when the status is cleared', () => {
    TestBed.configureTestingModule({ imports: [CngxTimelineMarker] });
    const { host, set } = mount();

    set('status', 'done');
    set('status', undefined);

    expect(host.hasAttribute('data-status')).toBe(false);
  });

  describe('busy', () => {
    it('is off by default', () => {
      TestBed.configureTestingModule({ imports: [CngxTimelineMarker] });

      expect(mount().host.classList.contains('cngx-timeline-marker--busy')).toBe(false);
    });

    it('toggles the pulse class', () => {
      TestBed.configureTestingModule({ imports: [CngxTimelineMarker] });
      const { host, set } = mount();

      set('busy', true);
      expect(host.classList.contains('cngx-timeline-marker--busy')).toBe(true);

      set('busy', false);
      expect(host.classList.contains('cngx-timeline-marker--busy')).toBe(false);
    });

    it('coerces a bare attribute to true', () => {
      TestBed.configureTestingModule({ imports: [CngxTimelineMarker] });
      const { host, set } = mount();

      set('busy', '');

      expect(host.classList.contains('cngx-timeline-marker--busy')).toBe(true);
    });
  });

  /**
   * DOM only. Fit and size are CSS, and the stylesheet lives inside
   * `@layer` / `@scope`, which jsdom's CSSOM does not parse - the sizing
   * contract is demonstrated by the `media-markers` story and pinned in
   * `e2e/timeline-layout.spec.ts`.
   */
  describe('media content', () => {
    it('takes a bare image, which the marker sizes itself', () => {
      TestBed.resetTestingModule();

      @Component({
        selector: 'cngx-timeline-marker-media-host',
        standalone: true,
        imports: [CngxTimelineMarker],
        template: `<cngx-timeline-marker><img src="avatar.png" alt="" /></cngx-timeline-marker>`,
      })
      class MediaHost {}

      TestBed.configureTestingModule({ imports: [MediaHost] });
      const fixture = TestBed.createComponent(MediaHost);
      fixture.detectChanges();
      const marker = (fixture.nativeElement as HTMLElement).querySelector('cngx-timeline-marker');

      expect(marker?.querySelector('img')).not.toBeNull();
    });

    it('takes a projected atom, which carries its own size token', () => {
      TestBed.resetTestingModule();

      @Component({
        selector: 'cngx-timeline-marker-atom-host',
        standalone: true,
        imports: [CngxTimelineMarker, CngxAvatar],
        template: `<cngx-timeline-marker><cngx-avatar size="lg" /></cngx-timeline-marker>`,
      })
      class AtomHost {}

      TestBed.configureTestingModule({ imports: [AtomHost] });
      const fixture = TestBed.createComponent(AtomHost);
      fixture.detectChanges();
      const avatar = (fixture.nativeElement as HTMLElement).querySelector(
        'cngx-timeline-marker cngx-avatar',
      );

      // The size stays the atom's own concern - the marker never reaches
      // for its classes, so enlarging one means setting both.
      expect(avatar?.classList.contains('cngx-avatar--lg')).toBe(true);
    });
  });

  it('projects consumer content into the dot', () => {
    TestBed.configureTestingModule({ imports: [CngxTimelineMarker] });
    const fixture = TestBed.createComponent(CngxTimelineMarker);
    const host = fixture.nativeElement as HTMLElement;
    host.appendChild(document.createTextNode('!'));
    fixture.detectChanges();

    expect(host.textContent).toContain('!');
  });
});
