import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NeuralTrainingSample } from '../../core/models/flow.models';
import { NeuronArenaService } from '../../core/services/neuron-arena.service';
import { PartyChronicleComponent } from './party-chronicle.component';

describe('PartyChronicleComponent', () => {
  let component: PartyChronicleComponent;
  let arenaService: NeuronArenaService;

  const mockSample: NeuralTrainingSample = {
    id: 'sample-1',
    timestamp: '2026-11-05T12:00:00Z',
    actorHandle: 'tester',
    actorName: 'Тестер',
    actorCategory: 'HUMAN',
    neuronPath: 'neuron.human.tester',
    activeSessionSnapshot: ['session-1'],
    stimulusParadox: 'Пицца против Суши',
    competingDesires: ['Пицца', 'Суши'],
    intent: 'PARADOX_OPINION',
    chosenThread: 'thread-pizza',
    voiceOutput: 'Я голосую за пиццу!',
    sourceMode: 'AUDIO_VOICE',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartyChronicleComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(PartyChronicleComponent);
    component = fixture.componentInstance;
    arenaService = TestBed.inject(NeuronArenaService);
  });

  it('should create the party chronicle component', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle active section between voices and dataset', () => {
    expect(component.activeSection()).toBe('voices');
    component.activeSection.set('dataset');
    expect(component.activeSection()).toBe('dataset');
  });

  it('should filter training samples by intent', () => {
    const counterSample: NeuralTrainingSample = {
      ...mockSample,
      id: 'sample-2',
      intent: 'COUNTER_PROPOSE',
    };
    const list = [mockSample, counterSample];

    component.selectedIntent.set('COUNTER_PROPOSE');
    const filtered = component.getFilteredSamples(list);
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('sample-2');

    component.selectedIntent.set('ALL');
    expect(component.getFilteredSamples(list).length).toBe(2);
  });

  it('should filter voices by query', () => {
    const voices = [
      { id: 'v1', actorName: 'Боб', text: 'Пойдём гулять', threadTitle: 'Прогулка' },
      { id: 'v2', actorName: 'Алиса', text: 'Лучше кино', threadTitle: 'Кино' },
    ];

    component.voiceFilterQuery = 'кино';
    const filtered = component.getFilteredVoices(voices);
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('v2');
  });
});
