import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxAutosize } from './autosize.directive';

@Component({
  template: `<textarea cngxAutosize [minRows]="minRows" [maxRows]="maxRows"></textarea>`,
  imports: [CngxAutosize],
})
class Host {
  minRows = 1;
  maxRows: number | undefined = undefined;
  readonly directive = viewChild.required(CngxAutosize);
}


@Component({
  template: `<textarea
    cngxAutosize
    [minRows]="10"
    [maxRows]="5"
    style="line-height: 10px; font-size: 10px; padding: 0; border: 0"
  ></textarea>`,
  imports: [CngxAutosize],
})
class InvertedBoundsHost {
  readonly directive = viewChild.required(CngxAutosize);
}

// line-height 10px, padding 3+3, border 2+2: one row = 10 + 6 + 4 = 20px.
@Component({
  template: `<textarea
    cngxAutosize
    [minRows]="2"
    [maxRows]="4"
    style="line-height: 10px; font-size: 10px; padding: 3px 0; border: 2px solid black"
  ></textarea>`,
  imports: [CngxAutosize],
})
class BoxModelHost {
  readonly directive = viewChild.required(CngxAutosize);
}

function setupBoxModel(scrollHeight: number) {
  const fixture = TestBed.createComponent(BoxModelHost);
  fixture.detectChanges();
  TestBed.flushEffects();
  const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
  // jsdom has no layout; scrollHeight is content + padding, never border.
  Object.defineProperty(textarea, 'scrollHeight', {
    configurable: true,
    get: () => scrollHeight,
  });
  const directive = fixture.componentInstance.directive();
  directive.resize();
  return { fixture, textarea, directive };
}

function setup(overrides: Partial<Host> = {}) {
  const fixture = TestBed.createComponent(Host);
  Object.assign(fixture.componentInstance, overrides);
  fixture.detectChanges();
  TestBed.flushEffects();

  const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
  const directive = fixture.componentInstance.directive();
  return { fixture, textarea, directive };
}

describe('CngxAutosize', () => {
  it('should be created', () => {
    const { directive } = setup();
    expect(directive).toBeTruthy();
  });

  it('should set resize to none', () => {
    const { textarea } = setup();
    expect(textarea.style.resize).toBe('none');
  });

  it('should set box-sizing to border-box', () => {
    const { textarea } = setup();
    expect(textarea.style.boxSizing).toBe('border-box');
  });

  it('should expose height signal', () => {
    const { directive } = setup();
    // In JSDOM, scrollHeight is 0, so height will be computed from minRows
    expect(typeof directive.height()).toBe('number');
  });

  it('should expose resize() method', () => {
    const { directive } = setup();
    expect(typeof directive.resize).toBe('function');
    // Should not throw
    directive.resize();
  });

  it('should set overflow-y to hidden when no maxRows', () => {
    const { textarea } = setup();
    expect(textarea.style.overflowY).toBe('hidden');
  });

  it('lets minRows win when maxRows is configured below it (CSS min/max-height resolution)', () => {
    const fixture = TestBed.createComponent(InvertedBoundsHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    const directive = fixture.componentInstance.directive();
    directive.resize();
    // minH = 10 rows x 10px, maxH = 5 rows x 10px; the minimum wins.
    expect(directive.height()).toBe(100);
  });

  describe('row bounds include padding and border', () => {
    it('floors the height at minRows rows plus padding and border', () => {
      const { directive, textarea } = setupBoxModel(0);
      expect(directive.height()).toBe(2 * 10 + 6 + 4);
      expect(textarea.style.height).toBe('30px');
    });

    it('caps the height at maxRows rows plus padding and border', () => {
      const { directive } = setupBoxModel(500);
      expect(directive.height()).toBe(4 * 10 + 6 + 4);
    });

    it('scrolls once the cap is reached', () => {
      const { fixture, directive, textarea } = setupBoxModel(500);
      fixture.detectChanges();
      expect(directive.height()).toBe(50);
      expect(textarea.style.overflowY).toBe('auto');
    });

    it('adds the border to scrollHeight when the content grows between the bounds', () => {
      // 3 rows of content: scrollHeight = 30 content + 6 padding. The host is
      // border-box, so the border-box height must also hold the 4px border.
      const { directive } = setupBoxModel(36);
      expect(directive.height()).toBe(36 + 4);
    });
  });
});
