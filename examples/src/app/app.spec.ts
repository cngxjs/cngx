import { TestBed } from '@angular/core/testing';
import { provideFeedback, withBanners, withToasts } from '@cngx/ui/feedback';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      // The shell renders the banner/toast outlets; their scoped services
      // come from provideFeedback, mirroring app.config.ts.
      providers: [provideFeedback(withBanners(), withToasts())],
    }).compileComponents();
  });

  it('renders router outlet', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.querySelector('router-outlet')).not.toBeNull();
  });
});
