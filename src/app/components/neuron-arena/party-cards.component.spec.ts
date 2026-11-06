import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { ArenaDesireCard } from '../../core/models/flow.models';
import { NeuronArenaService } from '../../core/services/neuron-arena.service';
import { PartyCardsComponent } from './party-cards.component';

describe('PartyCardsComponent', () => {
  let component: PartyCardsComponent;
  let arenaService: NeuronArenaService;
  let router: Router;

  const mockCard: ArenaDesireCard = {
    id: 'card-board-games',
    flowId: 'flow-card-board-games',
    title: 'Настольные Игры & Пицца',
    description: 'Вечер настолок с друзьями',
    category: 'Игры & Драйв',
    icon: 'casino',
    colorTheme: 'amber',
    tags: ['#настолки', '#игры'],
    gamesPlayed: 10,
    winsCount: 7,
    lossesCount: 3,
    winRatePercent: 70,
    totalHistoricalVotes: 25,
    analyticsInsight: 'Высокий винрейт в выходные дни',
    createdByActorName: 'Тестер',
    isInCurrentField: false,
    matchHistory: [],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartyCardsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(PartyCardsComponent);
    component = fixture.componentInstance;
    arenaService = TestBed.inject(NeuronArenaService);
    router = TestBed.inject(Router);
  });

  it('should create party cards component', () => {
    expect(component).toBeTruthy();
  });

  it('should filter cards by category', () => {
    const foodCard: ArenaDesireCard = { ...mockCard, id: 'card-food', category: 'Еда & Напитки' };
    const list = [mockCard, foodCard];

    component.selectedCategory.set('Еда & Напитки');
    const filtered = component.getFilteredCards(list);
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('card-food');

    component.selectedCategory.set('ALL');
    expect(component.getFilteredCards(list).length).toBe(2);
  });

  it('should filter cards by search query', () => {
    const movieCard: ArenaDesireCard = { ...mockCard, id: 'card-movie', title: 'Кинопоказ классики' };
    const list = [mockCard, movieCard];

    component.searchQuery = 'Кино';
    const filtered = component.getFilteredCards(list);
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('card-movie');
  });

  it('should play card to field and navigate to /party', () => {
    spyOn(arenaService, 'playDesireCardToField');
    spyOn(router, 'navigate');

    component.playCardAndNavigate(mockCard);

    expect(arenaService.playDesireCardToField).toHaveBeenCalledWith(mockCard.id);
    expect(router.navigate).toHaveBeenCalledWith(['/party']);
  });
});
