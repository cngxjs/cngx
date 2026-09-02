import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CngxBanner } from './banner.service';
import { CngxBannerTrigger } from './banner-trigger';

@Component({
  template: `<cngx-banner-trigger [when]="show()" [message]="message()" [id]="key()" />`,
  imports: [CngxBannerTrigger],
})
class TriggerHost {
  readonly show = signal(false);
  readonly message = signal('Offline');
  readonly key = signal('net:offline');
}

function setup() {
  TestBed.configureTestingModule({ imports: [TriggerHost], providers: [CngxBanner] });
  const banner = TestBed.inject(CngxBanner);
  const fixture = TestBed.createComponent(TriggerHost);
  fixture.detectChanges();
  return { banner, fixture };
}

describe('CngxBannerTrigger', () => {
  it('shows the banner on true and dismisses it on false', () => {
    const { banner, fixture } = setup();
    expect(banner.banners().length).toBe(0);

    fixture.componentInstance.show.set(true);
    fixture.detectChanges();
    expect(banner.banners().length).toBe(1);
    expect(banner.banners()[0].id).toBe('net:offline');

    fixture.componentInstance.show.set(false);
    fixture.detectChanges();
    expect(banner.banners().length).toBe(0);
  });

  it('dismisses the previous key when [id] rebinds while shown', () => {
    const { banner, fixture } = setup();
    fixture.componentInstance.show.set(true);
    fixture.detectChanges();
    expect(banner.banners()[0].id).toBe('net:offline');

    fixture.componentInstance.key.set('net:degraded');
    fixture.detectChanges();

    expect(banner.banners().length).toBe(1);
    expect(banner.banners()[0].id).toBe('net:degraded');
  });

  it('dismisses on destroy', () => {
    const { banner, fixture } = setup();
    fixture.componentInstance.show.set(true);
    fixture.detectChanges();
    fixture.destroy();
    expect(banner.banners().length).toBe(0);
  });
});
