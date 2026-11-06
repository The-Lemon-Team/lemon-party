import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PartyRoulettePageComponent } from './party-roulette-page.component';

describe('PartyRoulettePageComponent', () => {
  let fixture: ComponentFixture<PartyRoulettePageComponent>;
  let component: PartyRoulettePageComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartyRoulettePageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(PartyRoulettePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the standalone roulette page', () => {
    expect(component).toBeTruthy();
  });

  it('should render the roulette centerpiece and back link to game home', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-party-roulette')).toBeTruthy();
    const backLink = compiled.querySelector('a[routerLink="/party"]');
    expect(backLink).toBeTruthy();
  });
});
