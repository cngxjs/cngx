import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CNGX_SIDENAV_STORAGE } from './sidenav.config.defaults';

function documentWithStorage(read: () => Storage): Document {
  const view = {};
  Object.defineProperty(view, 'localStorage', { get: read });
  return { defaultView: view } as unknown as Document;
}

describe('CNGX_SIDENAV_STORAGE', () => {
  it('resolves to the window localStorage', () => {
    expect(TestBed.inject(CNGX_SIDENAV_STORAGE)).toBe(window.localStorage);
  });

  it('resolves to null when the browser blocks localStorage', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: DOCUMENT,
          useValue: documentWithStorage(() => {
            throw new DOMException('The operation is insecure.', 'SecurityError');
          }),
        },
      ],
    });
    expect(TestBed.inject(CNGX_SIDENAV_STORAGE)).toBeNull();
  });

  it('resolves to null without a window', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: DOCUMENT, useValue: { defaultView: null } }],
    });
    expect(TestBed.inject(CNGX_SIDENAV_STORAGE)).toBeNull();
  });
});
