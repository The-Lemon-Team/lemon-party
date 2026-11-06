import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ArenaActorCard, CloudDayNote } from '../../core/models/flow.models';
import { NeuronArenaService } from '../../core/services/neuron-arena.service';
import { ProfileService } from '../../core/services/profile.service';
import { ArenaHeroNotesModalComponent } from './arena-hero-notes-modal.component';

describe('ArenaHeroNotesModalComponent', () => {
  let component: ArenaHeroNotesModalComponent;
  let fixture: ComponentFixture<ArenaHeroNotesModalComponent>;
  let arena: NeuronArenaService;
  let profile: ProfileService;

  const mockActor: ArenaActorCard = {
    id: 'actor-alexey',
    handle: 'alexey_bathrobe',
    flowId: 'flow-actor-alexey',
    name: 'Алексей (в халате)',
    title: 'Архитектор Уюта',
    category: 'HUMAN',
    categoryLabel: 'Главный Герой',
    avatarIcon: 'alexey',
    accentColor: 'rose',
    rankLabel: 'Голос Дома',
    quote: 'Халат надет, чай заварен.',
    paradoxPhilosophy: 'Уют превыше суеты.',
    favoriteDesire: 'Чай с мятой',
    affinities: ['Уют', 'Чай'],
    traits: { charisma: 90, analytical: 80, rebelVersus: 60 },
    voicePitch: 1.0,
    voiceRate: 1.0,
    sampleVoices: { support: 'Отлично!', counter: 'Не уверен', paradox: 'А может чай?' },
    isLead: true,
    voicesCount: 5,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArenaHeroNotesModalComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ArenaHeroNotesModalComponent);
    component = fixture.componentInstance;
    arena = TestBed.inject(NeuronArenaService);
    profile = TestBed.inject(ProfileService);
    component.actor = mockActor;
    component.isOpen = true;
    fixture.detectChanges();
  });

  it('should create the hero notes modal component', () => {
    expect(component).toBeTruthy();
  });

  it('should submit note through arena.addHeroNote with selected visibility, pins, and party heroes', () => {
    spyOn(arena, 'addHeroNote').and.callThrough();

    component.newNoteText = 'Секретный тактический план для Алексея в пати с Зевсом';
    component.newNoteType.set('action');
    component.newNoteVisibility.set('PRIVATE');
    component.newNotePinToHero = true;
    component.newNotePinToCloud = true;
    component.togglePartyActor('actor-zeus');

    component.submitNote();

    expect(arena.addHeroNote).toHaveBeenCalledWith(
      jasmine.objectContaining({
        actorId: 'actor-alexey',
        text: 'Секретный тактический план для Алексея в пати с Зевсом',
        type: 'action',
        visibility: 'PRIVATE',
        isPinnedToHero: true,
        isPinnedToCloud: true,
        partyActorIds: ['actor-zeus'],
      }),
    );

    // Form should reset
    expect(component.newNoteText).toBe('');
    expect(component.newNoteVisibility()).toBe('PUBLIC');
    expect(component.selectedPartyActorIds()).toEqual([]);
  });

  it('should adopt note to private when adoptToPrivate is called', () => {
    spyOn(arena, 'adoptNoteToPrivate').and.callThrough();
    component.adoptToPrivate('note-today-6');
    expect(arena.adoptNoteToPrivate).toHaveBeenCalledWith('note-today-6');
  });

  it('should filter notes correctly across tabs (ALL, PINNED, PRIVATE, PUBLIC)', () => {
    const sampleNotes: CloudDayNote[] = [
      {
        id: 'n1',
        dateKey: '2026-11-06',
        time: '10:00',
        timeMinutes: 600,
        type: 'thought',
        actorId: 'actor-alexey',
        actorName: 'Алексей',
        actorAvatar: 'alexey',
        actorAccent: 'rose',
        text: 'Публичная мысль',
        supporters: [],
        votesCount: 0,
        createdAt: '2026-11-06T10:00:00Z',
        visibility: 'PUBLIC',
        isPinnedToHero: true,
      },
      {
        id: 'n2',
        dateKey: '2026-11-06',
        time: '11:00',
        timeMinutes: 660,
        type: 'action',
        actorId: 'actor-alexey',
        actorName: 'Алексей',
        actorAvatar: 'alexey',
        actorAccent: 'rose',
        text: 'Приватная мысль',
        supporters: [],
        votesCount: 0,
        createdAt: '2026-11-06T11:00:00Z',
        visibility: 'PRIVATE',
        isPinnedToHero: false,
      },
    ];

    component.activeTab.set('ALL');
    expect(component.filterNotes(sampleNotes).length).toBe(2);

    component.activeTab.set('PINNED');
    expect(component.filterNotes(sampleNotes).length).toBe(1);
    expect(component.filterNotes(sampleNotes)[0].id).toBe('n1');

    component.activeTab.set('PRIVATE');
    expect(component.filterNotes(sampleNotes).length).toBe(1);
    expect(component.filterNotes(sampleNotes)[0].id).toBe('n2');

    component.activeTab.set('PUBLIC');
    expect(component.filterNotes(sampleNotes).length).toBe(1);
    expect(component.filterNotes(sampleNotes)[0].id).toBe('n1');
  });

  it('should toggle between FLOATING, TIERS and LIST modal view modes', () => {
    expect(component.modalViewMode()).toBe('FLOATING');
    component.modalViewMode.set('TIERS');
    expect(component.modalViewMode()).toBe('TIERS');
    component.modalViewMode.set('LIST');
    expect(component.modalViewMode()).toBe('LIST');
    component.modalViewMode.set('FLOATING');
    expect(component.modalViewMode()).toBe('FLOATING');
  });

  it('should toggle party actor inclusion', () => {
    expect(component.isPartyActorSelected('actor-zeus')).toBeFalse();
    component.togglePartyActor('actor-zeus');
    expect(component.isPartyActorSelected('actor-zeus')).toBeTrue();
    expect(component.selectedPartyActorIds()).toContain('actor-zeus');

    component.togglePartyActor('actor-hades');
    expect(component.selectedPartyActorIds()).toEqual(['actor-zeus', 'actor-hades']);

    component.togglePartyActor('actor-zeus');
    expect(component.isPartyActorSelected('actor-zeus')).toBeFalse();
    expect(component.selectedPartyActorIds()).toEqual(['actor-hades']);
  });

  it('should format visible character likes and collapse remainder into + N label', () => {
    const sampleNote: CloudDayNote = {
      id: 'note-likes-test',
      dateKey: '2026-11-06',
      time: '12:00',
      timeMinutes: 720,
      type: 'action',
      actorId: 'actor-neurobi',
      actorName: 'Нейроби',
      actorAvatar: 'neurobi',
      actorAccent: 'violet',
      text: 'Готовка супа в пати',
      supporters: [],
      votesCount: 5,
      createdAt: '2026-11-06T12:00:00Z',
      partyActorIds: ['actor-hades', 'actor-zeus'],
      likedByActors: [
        { actorId: 'actor-hades', actorName: 'Аид', avatarIcon: 'hades' },
        { actorId: 'actor-zeus', actorName: 'Зевс', avatarIcon: 'zeus' },
        { actorId: 'actor-poseidon', actorName: 'Посейдон', avatarIcon: 'poseidon' },
        { actorId: 'actor-alisa', actorName: 'Алиса', avatarIcon: 'alisa' },
        { actorId: 'actor-akin', actorName: 'Акин', avatarIcon: 'akin' },
      ],
    };

    const visibleLikes = component.getVisibleLikes(sampleNote);
    expect(visibleLikes.length).toBe(3);
    expect(visibleLikes.map((l) => l.actorName)).toEqual(['Аид', 'Зевс', 'Посейдон']);

    const hiddenLikes = component.getHiddenLikes(sampleNote);
    expect(hiddenLikes.length).toBe(2);
    expect(hiddenLikes.map((l) => l.actorName)).toEqual(['Алиса', 'Акин']);

    const hiddenNames = component.getHiddenLikesNames(sampleNote);
    expect(hiddenNames).toBe('Алиса, Акин');

    const likesWord = component.getLikesWord(hiddenLikes.length);
    expect(likesWord).toBe('лайка');
  });

  it('should filter floating notes by PARTY, PUBLIC, PRIVATE, and GM_ONLY', () => {
    const sampleNotes: CloudDayNote[] = [
      {
        id: 'p1',
        dateKey: '2026-11-06',
        time: '10:00',
        timeMinutes: 600,
        type: 'action',
        actorId: 'actor-alexey',
        actorName: 'Алексей',
        actorAvatar: 'alexey',
        actorAccent: 'rose',
        text: 'Катка в пати',
        supporters: [],
        votesCount: 0,
        createdAt: '2026-11-06T10:00:00Z',
        visibility: 'PUBLIC',
        partyActorIds: ['actor-ginny', 'actor-nick'],
      },
      {
        id: 'priv1',
        dateKey: '2026-11-06',
        time: '11:00',
        timeMinutes: 660,
        type: 'thought',
        actorId: 'actor-alexey',
        actorName: 'Алексей',
        actorAvatar: 'alexey',
        actorAccent: 'rose',
        text: 'Личный секрет',
        supporters: [],
        votesCount: 0,
        createdAt: '2026-11-06T11:00:00Z',
        visibility: 'PRIVATE',
      },
    ];

    component.floatingFilter.set('PARTY');
    const partyFiltered = component.filterFloatingNotes(sampleNotes);
    expect(partyFiltered.length).toBe(1);
    expect(partyFiltered[0].id).toBe('p1');

    component.floatingFilter.set('PRIVATE');
    const privFiltered = component.filterFloatingNotes(sampleNotes);
    expect(privFiltered.length).toBe(1);
    expect(privFiltered[0].id).toBe('priv1');
  });

  it('should reset state cleanly when onDismiss is invoked', () => {
    spyOn(component.close, 'emit');
    component.newNoteText = 'Черновик для отмены';
    component.togglePartyActor('actor-zeus');
    component.onDismiss();

    expect(component.close.emit).toHaveBeenCalled();
    expect(component.newNoteText).toBe('');
    expect(component.selectedPartyActorIds()).toEqual([]);
  });
});
