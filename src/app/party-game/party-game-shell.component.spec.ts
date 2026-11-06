import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PartyGameShellComponent } from './party-game-shell.component';

describe('PartyGameShellComponent', () => {
  let fixture: ComponentFixture<PartyGameShellComponent>;
  let component: PartyGameShellComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartyGameShellComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(PartyGameShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the standalone game shell', () => {
    expect(component).toBeTruthy();
  });

  it('should render header with game brand and sound toggle', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Lemon Party');
    expect(compiled.querySelector('header')).toBeTruthy();
  });

  it('should render navigation links including roulette and modes', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const links = Array.from(compiled.querySelectorAll('nav a')).map((a) => a.getAttribute('routerLink') ?? a.getAttribute('href'));
    expect(links).toContain('/party');
    expect(links).toContain('/party/field');
    expect(links).toContain('/party/roulette');
  });

  it('should toggle multiroom dropdown menu cleanly', () => {
    expect(component['isRoomMenuOpen']()).toBeFalse();
    component.toggleRoomMenu();
    expect(component['isRoomMenuOpen']()).toBeTrue();
    component.toggleRoomMenu();
    expect(component['isRoomMenuOpen']()).toBeFalse();
  });

  it('should render room selector with centered positioning classes to avoid shifting', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const roomSelector = compiled.querySelector('header button[aria-haspopup="listbox"]')?.parentElement;
    expect(roomSelector).toBeTruthy();
    expect(roomSelector?.className).toContain('lg:absolute');
    expect(roomSelector?.className).toContain('lg:left-1/2');
    expect(roomSelector?.className).toContain('lg:-translate-x-1/2');
  });

  it('should render lead actor button with fixed width classes to prevent header jitter on hero change', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const leadButton = compiled.querySelector('app-actor-avatar')?.nextElementSibling as HTMLButtonElement | null;
    if (leadButton) {
      expect(leadButton.className).toContain('truncate');
      expect(leadButton.className).toContain('w-24');
      expect(leadButton.className).toContain('sm:w-28');
    }
  });
});
