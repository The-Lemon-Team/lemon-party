import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { ArenaActorCard } from '../../core/models/flow.models';
import { NeuronArenaService } from '../../core/services/neuron-arena.service';
import { ArenaHeroesComponent } from './arena-heroes.component';

describe('ArenaHeroesComponent', () => {
  let component: ArenaHeroesComponent;
  let arenaService: NeuronArenaService;
  let router: Router;

  const mockActor: ArenaActorCard = {
    id: 'actor-test',
    handle: 'test_hero',
    flowId: 'flow-test',
    name: 'Тестовый Герой',
    title: 'Мастер Тестов',
    category: 'HUMAN',
    categoryLabel: 'Герой',
    avatarIcon: 'person',
    accentColor: 'indigo',
    rankLabel: 'Генерал',
    quote: 'Тестируй всё!',
    paradoxPhilosophy: 'Баги неизбежны',
    favoriteDesire: 'Чистый код',
    affinities: ['angular', 'tests'],
    traits: {
      charisma: 85,
      analytical: 92,
      rebelVersus: 70,
    },
    voicePitch: 1.0,
    voiceRate: 1.0,
    isLead: false,
    voicesCount: 4,
    sampleVoices: {
      support: 'Поддерживаю тест!',
      counter: 'Протестую против бага!',
      paradox: 'Всё протестировано.',
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArenaHeroesComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ArenaHeroesComponent);
    component = fixture.componentInstance;
    arenaService = TestBed.inject(NeuronArenaService);
    router = TestBed.inject(Router);
  });

  it('should create the heroes page component', () => {
    expect(component).toBeTruthy();
  });

  it('should filter actors by category', () => {
    const mythicActor: ArenaActorCard = { ...mockActor, id: 'actor-myth', category: 'MYTHIC' };
    const list = [mockActor, mythicActor];

    component.selectedActorCategory.set('HUMAN');
    const filteredHuman = component.getFilteredActors(list);
    expect(filteredHuman.length).toBe(1);
    expect(filteredHuman[0].id).toBe('actor-test');

    component.selectedActorCategory.set('ALL');
    const filteredAll = component.getFilteredActors(list);
    expect(filteredAll.length).toBe(2);
  });

  it('should filter actors by search query', () => {
    const secondActor: ArenaActorCard = { ...mockActor, id: 'actor-2', name: 'Берховен' };
    const list = [mockActor, secondActor];

    component.actorSearchQuery = 'Берховен';
    const result = component.getFilteredActors(list);
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Берховен');
  });

  it('should select main actor when requested', () => {
    spyOn(arenaService, 'selectLeadActor');
    component.selectMainActor(mockActor);
    expect(arenaService.selectLeadActor).toHaveBeenCalledWith(mockActor.id);
  });

  it('should select main actor and navigate to /party on enterArenaWithActor', () => {
    spyOn(arenaService, 'selectLeadActor');
    spyOn(router, 'navigate');

    component.enterArenaWithActor(mockActor);

    expect(arenaService.selectLeadActor).toHaveBeenCalledWith(mockActor.id);
    expect(router.navigate).toHaveBeenCalledWith(['/party']);
  });
});
