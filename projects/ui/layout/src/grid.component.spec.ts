import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GridComponent } from './grid.component';

describe('GridComponent', () => {
  let fixture: ComponentFixture<GridComponent>;
  let component: GridComponent;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GridComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GridComponent);
    component = fixture.componentInstance;
    host = fixture.nativeElement as HTMLElement;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('generates repeat() template for numeric columns', () => {
    component.columns = 3;
    fixture.detectChanges();
    expect(host.style.gridTemplateColumns).toBe('repeat(3, 1fr)');
  });

  it('passes through string column definitions', () => {
    component.columns = '200px 1fr';
    fixture.detectChanges();
    expect(host.style.gridTemplateColumns).toBe('200px 1fr');
  });
});
