import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, test } from 'vitest';

import { CngxPaginate } from './paginate.directive';
import { CngxPaginateResetOn } from './paginate-reset.directive';

@Component({
  standalone: true,
  imports: [CngxPaginate, CngxPaginateResetOn],
  template: `<div cngxPaginate [total]="100" [cngxPaginateResetOn]="key()"></div>`,
})
class HostCmp {
  readonly key = signal<string | undefined>(undefined);
}

function setup(): { fixture: ReturnType<typeof TestBed.createComponent<HostCmp>>; paginate: CngxPaginate; host: HostCmp } {
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  const fixture = TestBed.createComponent(HostCmp);
  fixture.detectChanges();
  const paginate = fixture.debugElement.query(By.directive(CngxPaginate)).injector.get(CngxPaginate);
  return { fixture, paginate, host: fixture.componentInstance };
}

describe('CngxPaginateResetOn', () => {
  test('mounting does not reset the page', () => {
    const { fixture, paginate } = setup();
    paginate.setPage(3);
    fixture.detectChanges();
    expect(paginate.pageIndex()).toBe(3);
  });

  test('changing the key jumps to the first page', () => {
    const { fixture, paginate, host } = setup();
    paginate.setPage(3);
    fixture.detectChanges();
    expect(paginate.pageIndex()).toBe(3);

    host.key.set('filtered');
    fixture.detectChanges();
    expect(paginate.pageIndex()).toBe(0);
  });
});
