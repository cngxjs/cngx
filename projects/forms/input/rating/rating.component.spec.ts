import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxLiveAnnouncer } from '@cngx/common/a11y';
import { CngxFormField } from '@cngx/forms/field';
import { createMockField } from '@cngx/forms/field/testing';
import { CngxRating } from './rating.component';
import { CngxRatingItem } from './rating-item.directive';
import { provideInputConfig, withInputAriaLabels } from '../input-config';

@Component({
  template: `
    <cngx-rating
      [(value)]="value"
      [max]="max()"
      [allowHalf]="allowHalf()"
      [disabled]="disabled()"
      [disabledReason]="reason()"
    />
  `,
  imports: [CngxRating],
})
class Host {
  readonly rating = viewChild.required(CngxRating);
  value = 0;
  readonly max = signal(5);
  readonly allowHalf = signal(false);
  readonly disabled = signal(false);
  readonly reason = signal('');
}

function setup(configure?: () => void) {
  configure?.();
  const fixture = TestBed.createComponent(Host);
  document.body.appendChild(fixture.nativeElement);
  fixture.detectChanges();
  TestBed.flushEffects();
  const rating = fixture.componentInstance.rating();
  const host = fixture.nativeElement as HTMLElement;
  const buttons = () =>
    Array.from(host.querySelectorAll<HTMLButtonElement>('.cngx-rating__item'));
  const container = host.querySelector('.cngx-rating__items') as HTMLElement;
  return { fixture, rating, host, buttons, container };
}

function arrow(container: HTMLElement, key: 'ArrowRight' | 'ArrowLeft'): void {
  container.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

afterEach(() => {
  document.body.replaceChildren();
});

describe('CngxRating', () => {
  it('renders one role=radio button per step and a labelled radiogroup', () => {
    const { rating, host, buttons } = setup();
    expect(buttons().length).toBe(5);
    expect((host.querySelector('cngx-rating') ?? host).getAttribute('role')).toBe(
      'radiogroup',
    );
    expect(rating.steps()).toEqual([1, 2, 3, 4, 5]);
    for (const button of buttons()) {
      expect(button.getAttribute('role')).toBe('radio');
    }
  });

  it('selects on click and reflects aria-checked / posinset / setsize', () => {
    const { fixture, rating, buttons } = setup();
    buttons()[2].click();
    fixture.detectChanges();

    expect(rating.value()).toBe(3);
    const b = buttons();
    expect(b[2].getAttribute('aria-checked')).toBe('true');
    expect(b[0].getAttribute('aria-checked')).toBe('false');
    expect(b[2].getAttribute('aria-posinset')).toBe('3');
    expect(b[2].getAttribute('aria-setsize')).toBe('5');
  });

  it('auto-selects via the roving consumeNavigationKey handshake on arrow nav', () => {
    const { fixture, rating, container } = setup();

    arrow(container, 'ArrowRight');
    fixture.detectChanges();
    expect(rating.value()).toBe(2);

    arrow(container, 'ArrowLeft');
    fixture.detectChanges();
    expect(rating.value()).toBe(1);
  });

  it('drives cumulative fill - every step <= value is filled, not exact-match', () => {
    @Component({
      template: `
        <cngx-rating [value]="3" [max]="5">
          <ng-template cngxRatingItem let-filled="filled" let-index="index">
            <i class="glyph" [class.is-filled]="filled" [attr.data-index]="index"></i>
          </ng-template>
        </cngx-rating>
      `,
      imports: [CngxRating, CngxRatingItem],
    })
    class SlotHost {}

    const fixture = TestBed.createComponent(SlotHost);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    const glyphs = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('.glyph'),
    );
    const filled = glyphs.filter((g) => g.classList.contains('is-filled'));
    expect(filled.length).toBe(3);
    expect(glyphs.slice(0, 3).every((g) => g.classList.contains('is-filled'))).toBe(true);
    expect(glyphs.slice(3).some((g) => g.classList.contains('is-filled'))).toBe(false);
  });

  it('changes step count and granularity with max and allowHalf', () => {
    const { fixture, rating, buttons } = setup();
    expect(buttons().length).toBe(5);

    fixture.componentInstance.allowHalf.set(true);
    fixture.detectChanges();
    expect(buttons().length).toBe(10);
    expect(rating.steps()[0]).toBe(0.5);
  });

  it('announces once per committed change and not on re-selecting the same value', () => {
    const announcer = TestBed.inject(CngxLiveAnnouncer);
    const announce = vi.spyOn(announcer, 'announce').mockImplementation(() => {});
    const { fixture, buttons } = setup();

    buttons()[2].click();
    fixture.detectChanges();
    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenCalledWith('3 of 5');

    buttons()[2].click();
    fixture.detectChanges();
    expect(announce).toHaveBeenCalledTimes(1);

    buttons()[4].click();
    fixture.detectChanges();
    expect(announce).toHaveBeenCalledTimes(2);
    expect(announce).toHaveBeenLastCalledWith('5 of 5');
  });

  it('announces through the configured ratingValue label', () => {
    const { fixture, buttons } = setup(() => {
      TestBed.configureTestingModule({
        providers: [
          provideInputConfig(
            withInputAriaLabels({ ratingValue: (v, m) => `Rated ${v}/${m}` }),
          ),
        ],
      });
    });
    const announcer = TestBed.inject(CngxLiveAnnouncer);
    const announce = vi.spyOn(announcer, 'announce').mockImplementation(() => {});

    buttons()[3].click();
    fixture.detectChanges();
    expect(announce).toHaveBeenCalledWith('Rated 4/5');
  });

  it('syncs the value bidirectionally inside cngx-form-field', () => {
    const { accessor, ref } = createMockField<number>({ name: 'score', value: 0 });

    @Component({
      template: `
        <cngx-form-field [field]="field">
          <cngx-rating [(value)]="value" />
        </cngx-form-field>
      `,
      imports: [CngxFormField, CngxRating],
    })
    class FieldHost {
      readonly rating = viewChild.required(CngxRating);
      readonly field = accessor;
      value = 0;
    }

    const fixture = TestBed.createComponent(FieldHost);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    TestBed.flushEffects();

    // field -> control
    ref.value.set(4);
    TestBed.flushEffects();
    expect(fixture.componentInstance.rating().value()).toBe(4);

    // control -> field
    fixture.componentInstance.rating().value.set(2);
    TestBed.flushEffects();
    expect(ref.value()).toBe(2);
  });

  describe('disabled', () => {
    it('no-ops selection, skips arrow nav, and announces nothing', () => {
      const announcer = TestBed.inject(CngxLiveAnnouncer);
      const announce = vi.spyOn(announcer, 'announce').mockImplementation(() => {});
      const { fixture, rating, buttons, container } = setup(() => undefined);
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();

      buttons()[2].click();
      fixture.detectChanges();
      expect(rating.value()).toBe(0);

      arrow(container, 'ArrowRight');
      fixture.detectChanges();
      expect(rating.value()).toBe(0);
      expect(announce).not.toHaveBeenCalled();
    });

    it('marks the host aria-disabled and exposes a described-by reason', () => {
      const { fixture, host, buttons } = setup();
      fixture.componentInstance.disabled.set(true);
      fixture.componentInstance.reason.set('Rating locked until sign-in');
      fixture.detectChanges();

      const group = host.querySelector('cngx-rating') as HTMLElement;
      expect(group.getAttribute('aria-disabled')).toBe('true');
      for (const button of buttons()) {
        expect(button.getAttribute('aria-disabled')).toBe('true');
      }

      const describedBy = group.getAttribute('aria-describedby') ?? '';
      const reason = host.querySelector('.cngx-rating__disabled-reason') as HTMLElement;
      expect(describedBy).toContain(reason.id);
      expect(reason.textContent).toContain('Rating locked until sign-in');
      expect(reason.getAttribute('aria-hidden')).toBeNull();
    });
  });

  it('exposes the form-field control contract signals', () => {
    const { rating } = setup();
    expect(rating.empty()).toBe(true);
    rating.value.set(2);
    expect(rating.empty()).toBe(false);
    expect(rating.errorState()).toBe(false);
    expect(typeof rating.id()).toBe('string');
    expect(rating.id().length).toBeGreaterThan(0);
  });

  it('returns a stable steps reference until max or allowHalf change', () => {
    const { fixture, rating } = setup();
    const first = rating.steps();
    expect(rating.steps()).toBe(first);

    fixture.componentInstance.max.set(7);
    fixture.detectChanges();
    const grown = rating.steps();
    expect(grown).not.toBe(first);
    expect(rating.steps()).toBe(grown);
  });
});
