import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NeuronArenaService } from '../../core/services/neuron-arena.service';
import { PartyRealtimeService } from '../../core/services/party-realtime.service';
import { PartyCloudComponent } from './party-cloud.component';

describe('PartyCloudComponent', () => {
  let component: PartyCloudComponent;
  let arena: NeuronArenaService;
  let realtime: PartyRealtimeService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartyCloudComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(PartyCloudComponent);
    component = fixture.componentInstance;
    arena = TestBed.inject(NeuronArenaService);
    realtime = TestBed.inject(PartyRealtimeService);
  });

  it('should create the party cloud component', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle between CLOUD_TIMELINE and DAY_FEED view modes', () => {
    expect(component.isCloudView()).toBeTrue();
    component.viewMode.set('DAY_FEED');
    expect(component.isFeedView()).toBeTrue();
    expect(component.isCloudView()).toBeFalse();

    // Backwards compatible aliases
    component.viewMode.set('ORBIT');
    expect(component.isCloudView()).toBeTrue();
    component.viewMode.set('CALENDAR_TIMELINE');
    expect(component.isFeedView()).toBeTrue();
  });

  it('should switch active filter layer and filter notes accordingly', () => {
    expect(component.activeLayer()).toBe('ALL');
    component.activeLayer.set('THOUGHTS');
    expect(component.activeLayer()).toBe('THOUGHTS');
    for (const note of component.visibleNotes()) {
      expect(note.type).toBe('thought');
    }

    component.activeLayer.set('PROPOSALS');
    for (const note of component.visibleNotes()) {
      expect(note.type).toBe('proposal');
    }

    component.activeLayer.set('ACTIONS');
    for (const note of component.visibleNotes()) {
      expect(note.type).toBe('action');
    }
  });

  it('should switch between dates and load date-attached notes', () => {
    expect(component.selectedDateKey()).toBe('2026-11-06');
    const todayNotes = component.activeDateNotes();
    expect(todayNotes.length).toBeGreaterThan(0);

    component.selectDate('2026-11-05');
    expect(component.selectedDateKey()).toBe('2026-11-05');
    const yesterdayNotes = component.activeDateNotes();
    expect(yesterdayNotes.length).toBeGreaterThan(0);
    expect(yesterdayNotes[0].dateKey).toBe('2026-11-05');
  });

  it('should add a new thought from the active character to the daily cloud timeline', () => {
    spyOn(realtime, 'broadcastEvent');

    let actors: any[] = [];
    arena.actors$.subscribe((a) => (actors = a)).unsubscribe();
    if (actors.length > 0) {
      component.selectPitchActor(actors[0]);
    }

    component.selectedActionType.set('thought');
    component.newNoteTime.set('15:45');
    component.newIdeaTitle.set('Пора заварить горный чай и обсудить идеи!');

    const countBefore = component.activeDateNotes().length;
    component.submitNoteOrIdea();

    expect(component.newIdeaTitle()).toBe('');
    expect(component.activeDateNotes().length).toBe(countBefore + 1);

    const added = component.activeDateNotes().find((n) => n.text.includes('горный чай'));
    expect(added).toBeTruthy();
    expect(added?.time).toBe('15:45');
    expect(added?.type).toBe('thought');
    expect(realtime.broadcastEvent).toHaveBeenCalledWith(
      jasmine.objectContaining({
        type: 'CARD_PLAYED',
      }),
    );
  });

  it('should vote for note and increment vote count and supporters', () => {
    spyOn(realtime, 'broadcastEvent');
    const note = component.activeDateNotes()[0];
    const votesBefore = note.votesCount;

    component.voteForNote(note.id);

    const updated = component.activeDateNotes().find((n) => n.id === note.id);
    expect(updated?.votesCount).toBe(votesBefore + 1);
    expect(realtime.broadcastEvent).toHaveBeenCalledWith(
      jasmine.objectContaining({
        type: 'VOTE_CAST',
      }),
    );
  });

  it('should delete a note from the active date', () => {
    const note = component.activeDateNotes()[0];
    const countBefore = component.activeDateNotes().length;

    component.deleteNote(note.id);
    expect(component.activeDateNotes().length).toBe(countBefore - 1);
  });

  it('should pitch a preset thought and add it to the cloud', () => {
    spyOn(realtime, 'broadcastEvent');
    const countBefore = component.activeDateNotes().length;
    const preset = component.thoughtPresets[0];

    component.pitchPreset(preset);

    expect(component.activeDateNotes().length).toBe(countBefore + 1);
    expect(realtime.broadcastEvent).toHaveBeenCalled();
  });

  it('should calculate tiered stem heights for candlestick columns', () => {
    expect(component.getNoteStemHeight(0)).toBe(40);
    expect(component.getNoteStemHeight(1)).toBe(155);
    expect(component.getNoteStemHeight(2)).toBe(270);
    expect(component.getNoteStemHeight(3)).toBe(40); // cycles back to tier 0
  });

  it('should return accent stem classes and glow classes matching theme', () => {
    expect(component.getAccentStemClasses('amber')).toContain('from-amber-500');
    expect(component.getAccentStemClasses('emerald')).toContain('from-emerald-500');
    expect(component.getAccentStemClasses('cyan')).toContain('from-cyan-500');

    expect(component.getAccentGlowClasses('amber')).toContain('bg-amber-500');
    expect(component.getAccentGlowClasses('rose')).toContain('bg-rose-500');
  });

  it('should partition thoughts into top and bottom lanes for alternating layout', () => {
    const top = component.getTopLaneNotes();
    const bottom = component.getBottomLaneNotes();
    const total = component.visibleNotes().length;

    expect(top.length + bottom.length).toBe(total);
  });

  it('should broadcast real-time event when scheduleActiveToSlot is called', () => {
    spyOn(realtime, 'broadcastEvent');
    const slot = component.timelineSlots[0];

    component.scheduleActiveToSlot(slot);

    expect(realtime.broadcastEvent).toHaveBeenCalled();
  });

  it('should open, reset and close create space modal cleanly', () => {
    expect(component.isCreateSpaceModalOpen()).toBeFalse();

    component.openCreateSpaceModal();
    expect(component.isCreateSpaceModalOpen()).toBeTrue();
    expect(component.newSpaceTitle()).toBeTruthy();

    component.closeCreateSpaceModal();
    expect(component.isCreateSpaceModalOpen()).toBeFalse();
    expect(component.newSpaceTitle()).toBe('');
    expect(component.newSpaceDescription()).toBe('');
  });

  it('should create a new party space from host and update activeSpaceTitle', () => {
    spyOn(realtime, 'createRoom').and.callThrough();

    component.newSpaceTitle.set('Логово Кота');
    component.newSpaceDescription.set('Вечер чилла');
    component.submitCreateSpace();

    expect(component.activeSpaceTitle()).toBe('Логово Кота');
    expect(realtime.createRoom).toHaveBeenCalled();
    expect(component.isCreateSpaceModalOpen()).toBeFalse();
  });

  it('should toggle character picker and allow choosing roleplay actor', () => {
    expect(component.isCharacterPickerOpen()).toBeFalse();
    component.toggleCharacterPicker();
    expect(component.isCharacterPickerOpen()).toBeTrue();

    let actors: any[] = [];
    arena.actors$.subscribe((a) => (actors = a)).unsubscribe();

    if (actors.length > 0) {
      component.selectPitchActor(actors[0]);
      expect(component.activePitchActor()?.id).toBe(actors[0].id);
      expect(component.isCharacterPickerOpen()).toBeFalse();
    }
  });
});
