import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { NeuronArenaService } from '../../core/services/neuron-arena.service';
import { ArenaFieldComponent } from './arena-field.component';

describe('ArenaFieldComponent', () => {
  let component: ArenaFieldComponent;
  let arenaService: NeuronArenaService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArenaFieldComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ArenaFieldComponent);
    component = fixture.componentInstance;
    arenaService = TestBed.inject(NeuronArenaService);
    router = TestBed.inject(Router);
  });

  it('should create the arena field component', () => {
    expect(component).toBeTruthy();
  });

  it('should switch game sub mode between COMBINE and VERSUS', () => {
    expect(component.gameSubMode()).toBe('COMBINE');
    component.gameSubMode.set('VERSUS');
    expect(component.gameSubMode()).toBe('VERSUS');
  });

  it('should inspect desire card and navigate to /party/cards on openCardHistory', () => {
    spyOn(arenaService, 'inspectDesireCard');
    spyOn(router, 'navigate');

    component.openCardHistory('card-123');

    expect(arenaService.inspectDesireCard).toHaveBeenCalledWith('card-123');
    expect(router.navigate).toHaveBeenCalledWith(['/party/cards']);
  });
});
