import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PartyRouletteComponent } from './party-roulette.component';

describe('PartyRouletteComponent', () => {
  let fixture: ComponentFixture<PartyRouletteComponent>;
  let component: PartyRouletteComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartyRouletteComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(PartyRouletteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the roulette component with sectors', () => {
    expect(component).toBeTruthy();
    expect(component.sectors.length).toBeGreaterThan(0);
    expect(component.isSpinning()).toBeFalse();
  });

  it('should have 5 mood filters', () => {
    expect(component.moodFilters.length).toBe(5);
  });

  it('should trigger spin and change rotation degrees', () => {
    const initialDegrees = component.rotationDegrees();
    component.spin();
    expect(component.isSpinning()).toBeTrue();
    expect(component.rotationDegrees()).toBeGreaterThan(initialDegrees);
  });

  it('should generate svg sector path without crashing', () => {
    const path = component.getSectorSvgPath(0, 8);
    expect(path).toContain('M 100 100');
    expect(path).toContain('A 98 98');
  });
});
