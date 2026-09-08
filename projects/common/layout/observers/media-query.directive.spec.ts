import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMatchMediaMock, type MatchMediaMock } from '@cngx/testing';
import { CngxMediaQuery } from './media-query.directive';

@Component({
  template: `<div cngxMediaQuery="(min-width: 1024px)" #mq="cngxMediaQuery">
    {{ mq.matches() }}
  </div>`,
  imports: [CngxMediaQuery],
})
class TestHost {}

describe('CngxMediaQuery', () => {
  let mmMock: MatchMediaMock;

  beforeEach(() => {
    // window.matchMedia may not exist in the test env; install the shared mock
    mmMock = createMatchMediaMock();
    mmMock.install(window);
  });

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    const dir = fixture.debugElement
      .query(By.directive(CngxMediaQuery))
      .injector.get(CngxMediaQuery);
    return { fixture, dir };
  }

  it('reads initial matches value', () => {
    const { dir } = setup();
    expect(dir.matches()).toBe(false);
  });

  it('updates matches when media query changes', () => {
    const { dir } = setup();
    mmMock.trigger(true);
    expect(dir.matches()).toBe(true);
  });

  it('cleans up listener on destroy', () => {
    const { fixture, dir } = setup();
    fixture.destroy();
    mmMock.trigger(true);
    expect(dir.matches()).toBe(false);
  });
});
