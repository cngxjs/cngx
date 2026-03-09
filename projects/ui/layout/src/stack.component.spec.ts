import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StackComponent } from './stack.component';

describe('StackComponent', () => {
  let fixture: ComponentFixture<StackComponent>;
  let component: StackComponent;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StackComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StackComponent);
    component = fixture.componentInstance;
    host = fixture.nativeElement as HTMLElement;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('defaults to column direction', () => {
    fixture.detectChanges();
    expect(host.style.flexDirection).toBe('column');
  });

  it('applies row direction when set', () => {
    component.direction = 'row';
    fixture.detectChanges();
    expect(host.style.flexDirection).toBe('row');
  });

  it('maps gap "sm" to 8px', () => {
    component.gap = 'sm';
    fixture.detectChanges();
    expect(host.style.gap).toBe('8px');
  });
});
