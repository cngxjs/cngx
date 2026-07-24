import { Component, Directive, computed, contentChildren } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';

import { CNGX_CHART_LAYER, type CngxChartLayer, type LayerGeometry } from './chart-layer';

@Directive({
  selector: '[testChartLayer]',
  standalone: true,
  providers: [{ provide: CNGX_CHART_LAYER, useExisting: TestLayer }],
})
class TestLayer implements CngxChartLayer {
  readonly kind = computed(() => 'line' as const);
  readonly geometry = computed<LayerGeometry>(() => ({
    kind: 'line',
    d: 'M 0 0 L 1 1',
    color: null,
    strokeWidth: null,
    fill: 'none',
  }));
}

@Component({
  selector: 'layer-collector',
  standalone: true,
  template: `<ng-content />`,
})
class Collector {
  readonly layers = contentChildren(CNGX_CHART_LAYER, { descendants: true });
}

@Component({
  standalone: true,
  imports: [Collector, TestLayer],
  template: `<layer-collector><div testChartLayer></div></layer-collector>`,
})
class Host {}

describe('CNGX_CHART_LAYER', () => {
  it('resolves an atom that self-provides via useExisting', () => {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const de = fixture.debugElement.query(By.css('[testChartLayer]'));
    const resolved = de.injector.get(CNGX_CHART_LAYER);
    expect(resolved).toBe(de.injector.get(TestLayer));
    expect(resolved.kind()).toBe('line');
    expect(resolved.geometry().kind).toBe('line');
  });

  it('is collected by a descendants contentChildren query', () => {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const collector = fixture.debugElement.query(
      (el) => el.componentInstance instanceof Collector,
    ).componentInstance as Collector;
    expect(collector.layers().length).toBe(1);
    expect(collector.layers()[0].geometry().kind).toBe('line');
  });
});
