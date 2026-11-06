import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PartyGameHomeComponent } from './party-game-home.component';

describe('PartyGameHomeComponent', () => {
  let fixture: ComponentFixture<PartyGameHomeComponent>;
  let component: PartyGameHomeComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartyGameHomeComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(PartyGameHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the start screen and main game menu', () => {
    expect(component).toBeTruthy();
  });

  it('should render mode links for field, cloud, cards, heroes, chronicle, and roulette', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const links = Array.from(compiled.querySelectorAll('a')).map((a) => a.getAttribute('routerLink') ?? a.getAttribute('href'));
    expect(links).toContain('/party/field');
    expect(links).toContain('/party/cloud');
    expect(links).toContain('/party/cards');
    expect(links).toContain('/party/heroes');
    expect(links).toContain('/party/chronicle');
    expect(links).toContain('/party/roulette');
  });

  it('should focus prominently on game modes catalog in the foreground', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Каталог Игровых Режимов');
    expect(compiled.textContent).toContain('Игровое Поле & Схватки');
    expect(compiled.textContent).toContain('Хроно-Облако Левитации');
  });
});
