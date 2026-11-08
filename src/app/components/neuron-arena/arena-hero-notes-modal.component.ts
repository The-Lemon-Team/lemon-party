import { AsyncPipe, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalOverlayDirective } from '../../core/directives/modal-overlay.directive';
import {
  ArenaActorCard,
  CloudDayNote,
  CloudItemType,
  NoteActorLike,
  NoteVisibility,
} from '../../core/models/flow.models';
import { NeuronArenaService } from '../../core/services/neuron-arena.service';
import { ProfileService } from '../../core/services/profile.service';
import { ActorAvatarComponent } from './actor-avatar.component';
import {
  detectMentionedActors,
  getAccentAvatarClasses,
  getAccentPillClasses,
} from './arena-ui.utils';

export type HeroNoteFilterTab = 'ALL' | 'PINNED' | 'PRIVATE' | 'PUBLIC' | 'GM_ONLY';
export type HeroModalViewMode = 'FLOATING' | 'TIERS' | 'LIST';

@Component({
  selector: 'app-arena-hero-notes-modal',
  standalone: true,
  imports: [AsyncPipe, DatePipe, FormsModule, ModalOverlayDirective, ActorAvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    @keyframes gentleFloat {
      0%, 100% {
        transform: translateY(0px) rotate(var(--tw-rotate, 0deg));
      }
      50% {
        transform: translateY(-5px) rotate(calc(var(--tw-rotate, 0deg) + 0.3deg));
      }
    }
    .floating-card {
      animation: gentleFloat 5.2s ease-in-out infinite;
      will-change: transform;
      contain: layout style;
    }
    .floating-card:nth-child(2n) {
      animation-duration: 6.4s;
      animation-delay: 0.8s;
    }
    .floating-card:nth-child(3n) {
      animation-duration: 4.8s;
      animation-delay: 1.5s;
    }
    .floating-card:nth-child(4n) {
      animation-duration: 5.8s;
      animation-delay: 2.1s;
    }
    .floating-card:hover {
      animation-play-state: paused;
    }
  `],
  template: `
    @if (isOpen && actor) {
      <div
        appModalOverlay
        (overlayClose)="onDismiss()"
        class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hero-notes-modal-title"
      >
        <div
          class="bg-surface-container-lowest rounded-3xl max-w-5xl w-full p-4 sm:p-5 shadow-2xl border border-outline-variant/30 flex flex-col gap-3.5 max-h-[92vh] overflow-hidden"
          (click)="$event.stopPropagation()"
        >
          <!-- HEADER -->
          <div class="flex items-center justify-between pb-3 border-b border-outline-variant/20 flex-shrink-0">
            <div class="flex items-center gap-3 min-w-0">
              <app-actor-avatar
                [avatar]="actor.avatarIcon"
                [containerClass]="'w-12 h-12 rounded-2xl shadow-xs ring-2 ring-primary/20 flex-shrink-0'"
              />
              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <h3 id="hero-notes-modal-title" class="font-headline-sm text-base font-bold text-on-surface truncate">
                    {{ actor.name }}
                  </h3>
                  <span
                    class="font-label-code-sm text-[10px] px-2 py-0.5 rounded-full font-bold uppercase"
                    [class]="getAccentPillClasses(actor.accentColor)"
                  >
                    {{ actor.categoryLabel }}
                  </span>
                  <span class="font-label-code-sm text-[10px] text-outline">
                    {{ actor.rankLabel }}
                  </span>
                </div>
                <p class="font-body-sm text-xs text-on-surface-variant truncate">
                  Персональный Workspace героя · Свободное парящее пространство без привязки ко времени
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <!-- View Mode Toggle: Floating Space vs 3 Tiers vs List View -->
              <div class="flex items-center gap-1 bg-surface-container-high/80 p-1 rounded-xl border border-outline-variant/30 text-xs">
                <button
                  type="button"
                  (click)="modalViewMode.set('FLOATING')"
                  class="px-2.5 py-1 rounded-lg font-label-ui text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                  [class]="
                    modalViewMode() === 'FLOATING'
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  "
                  title="Свободное пространство без привязки ко времени"
                >
                  <span class="material-symbols-rounded text-sm">bubble_chart</span>
                  <span>🌌 Парящий холст</span>
                </button>

                <button
                  type="button"
                  (click)="modalViewMode.set('TIERS')"
                  class="px-2.5 py-1 rounded-lg font-label-ui text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                  [class]="
                    modalViewMode() === 'TIERS'
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  "
                  title="3 зоны доступа: Public, Private, Архаичный лор"
                >
                  <span class="material-symbols-rounded text-sm">cloud</span>
                  <span>☁️ 3 Острова</span>
                </button>

                <button
                  type="button"
                  (click)="modalViewMode.set('LIST')"
                  class="px-2.5 py-1 rounded-lg font-label-ui text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                  [class]="
                    modalViewMode() === 'LIST'
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  "
                  title="Табличный список заметок"
                >
                  <span class="material-symbols-rounded text-sm">format_list_bulleted</span>
                  <span>📋 Список</span>
                </button>
              </div>

              <button
                type="button"
                (click)="onDismiss()"
                class="p-1.5 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
                aria-label="Закрыть модальное окно"
              >
                <span class="material-symbols-rounded text-xl">close</span>
              </button>
            </div>
          </div>

          <!-- QUICK ADD NOTE INPUT BAR (WITH PARTY HEROES SELECTION & VISIBILITY) -->
          <div class="p-3 rounded-2xl bg-surface-container/60 border border-outline-variant/30 flex flex-col gap-2.5 flex-shrink-0">
            <div class="flex items-center gap-2">
              <span class="text-base select-none">
                {{ getMoodEmoji(newNoteType()) }}
              </span>
              <textarea
                [(ngModel)]="newNoteText"
                rows="2"
                placeholder="Записать мысль, тактику, архаичный секрет или совместную активность в пати..."
                class="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline text-xs rounded-xl p-2.5 border border-outline-variant/40 focus:border-primary focus:outline-hidden transition-colors resize-none font-body-sm"
              ></textarea>
            </div>

            @if (detectedActorsFromText.length > 0) {
              <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[10px] font-label-ui text-amber-900 dark:text-amber-200 animate-fade-in flex-wrap">
                <span class="text-xs">✨</span>
                <span class="font-bold">Распознаны в тексте:</span>
                <div class="flex items-center gap-1 flex-wrap">
                  @for (dHero of detectedActorsFromText; track dHero.id) {
                    <button
                      type="button"
                      (click)="setSubActor(dHero.id)"
                      class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-surface-container-lowest text-on-surface font-label-code-sm text-[9px] font-bold shadow-2xs border border-amber-500/30 cursor-pointer hover:border-amber-500 transition-colors"
                      [class]="selectedSubActorId() === dHero.id ? 'ring-1 ring-amber-500 bg-amber-500/20 text-amber-900 dark:text-amber-200' : ''"
                      title="Нажмите, чтобы сделать субперсонажем"
                    >
                      <app-actor-avatar [avatar]="dHero.avatarIcon" containerClass="w-3 h-3 rounded-full flex-shrink-0" />
                      <span>{{ dHero.name }}</span>
                      @if (selectedSubActorId() === dHero.id) {
                        <span class="text-[8px] text-amber-600 font-bold">✓ субперсонаж</span>
                      }
                    </button>
                  }
                </div>
                <span class="text-[9px] opacity-75 ml-auto">автоматически отобразится в ленте обоих персонажей</span>
              </div>
            }

            <!-- SUB-CHARACTER (СОАВТОР) SELECTION -->
            <div class="flex items-center gap-1.5 text-xs font-label-ui text-on-surface-variant flex-wrap pt-1 border-t border-outline-variant/15">
              <span class="font-bold flex items-center gap-1 text-[11px] text-on-surface">
                <span class="text-xs">🎭</span>
                <span>Субперсонаж:</span>
              </span>
              @if (selectedSubActor(); as subHero) {
                <div class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/60 font-label-code-sm text-[10px] font-bold shadow-2xs">
                  <app-actor-avatar [avatar]="subHero.avatarIcon" containerClass="w-3.5 h-3.5 rounded-full flex-shrink-0" />
                  <span>{{ subHero.name }}</span>
                  <button type="button" (click)="selectedSubActorId.set(null)" class="ml-0.5 text-xs font-bold hover:opacity-70 cursor-pointer" title="Убрать субперсонажа">✕</button>
                </div>
              } @else {
                <div class="flex items-center gap-1 flex-wrap">
                  @for (hero of (arena.actors$ | async); track hero.id) {
                    @if (hero.id !== actor.id) {
                      <button
                        type="button"
                        (click)="setSubActor(hero.id)"
                        class="px-2 py-0.5 rounded-full text-[10px] font-label-code-sm border transition-all inline-flex items-center gap-1 cursor-pointer bg-surface-container-lowest text-on-surface-variant border-outline-variant/30 hover:border-amber-500/50 hover:bg-amber-500/10"
                        title="Указать {{ hero.name }} субперсонажем"
                      >
                        <app-actor-avatar [avatar]="hero.avatarIcon" containerClass="w-3.5 h-3.5 rounded-full flex-shrink-0" />
                        <span>+ {{ hero.name }}</span>
                      </button>
                    }
                  }
                </div>
              }
            </div>

            <!-- HEROES IN PARTY SELECTION -->
            <div class="flex items-center gap-1.5 text-xs font-label-ui text-on-surface-variant flex-wrap pt-1 border-t border-outline-variant/15">
              <span class="font-bold flex items-center gap-1 text-[11px] text-on-surface">
                <span class="text-xs">👥</span>
                <span>В пати с:</span>
              </span>
              <div class="flex items-center gap-1 flex-wrap">
                @for (hero of (arena.actors$ | async); track hero.id) {
                  @if (hero.id !== actor.id) {
                    <button
                      type="button"
                      (click)="togglePartyActor(hero.id)"
                      class="px-2 py-0.5 rounded-full text-[10px] font-label-code-sm border transition-all inline-flex items-center gap-1 cursor-pointer"
                      [class]="
                        isPartyActorSelected(hero.id)
                          ? 'bg-amber-500/20 text-amber-900 dark:text-amber-200 border-amber-500/60 font-bold shadow-2xs'
                          : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/30 hover:border-primary/40'
                      "
                      title="Добавить {{ hero.name }} в пати события"
                    >
                      <app-actor-avatar [avatar]="hero.avatarIcon" containerClass="w-3.5 h-3.5 rounded-full flex-shrink-0" />
                      <span>{{ hero.name }}</span>
                      @if (isPartyActorSelected(hero.id)) {
                        <span class="text-[9px]">✓</span>
                      }
                    </button>
                  }
                }
              </div>
            </div>

            <!-- Controls Row: Type + Visibility + Pins + Submit -->
            <div class="flex items-center justify-between gap-2 flex-wrap">
              <!-- Type & Visibility -->
              <div class="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  (click)="newNoteType.set('thought')"
                  class="px-2 py-1 rounded-lg text-[11px] font-label-ui border transition-colors inline-flex items-center gap-1 cursor-pointer"
                  [class]="newNoteType() === 'thought' ? 'bg-primary text-on-primary border-primary font-bold' : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/30'"
                >
                  <span>💭</span>
                  <span>Мысль</span>
                </button>
                <button
                  type="button"
                  (click)="newNoteType.set('proposal')"
                  class="px-2 py-1 rounded-lg text-[11px] font-label-ui border transition-colors inline-flex items-center gap-1 cursor-pointer"
                  [class]="newNoteType() === 'proposal' ? 'bg-primary text-on-primary border-primary font-bold' : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/30'"
                >
                  <span>💡</span>
                  <span>Идея</span>
                </button>
                <button
                  type="button"
                  (click)="newNoteType.set('action')"
                  class="px-2 py-1 rounded-lg text-[11px] font-label-ui border transition-colors inline-flex items-center gap-1 cursor-pointer"
                  [class]="newNoteType() === 'action' ? 'bg-primary text-on-primary border-primary font-bold' : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/30'"
                >
                  <span>⚡</span>
                  <span>Действие</span>
                </button>

                <div class="h-4 w-px bg-outline-variant/30 mx-1 hidden sm:block"></div>

                <!-- 3 Visibility Tiers -->
                <button
                  type="button"
                  (click)="newNoteVisibility.set('PUBLIC')"
                  class="px-2 py-1 rounded-lg text-[11px] font-label-ui font-bold border transition-colors inline-flex items-center gap-1 cursor-pointer"
                  [class]="newNoteVisibility() === 'PUBLIC' ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-500/40' : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/30'"
                  title="Видно всей партии"
                >
                  <span class="material-symbols-rounded text-xs">public</span>
                  <span>🌐 Публично</span>
                </button>

                <button
                  type="button"
                  (click)="newNoteVisibility.set('PRIVATE')"
                  class="px-2 py-1 rounded-lg text-[11px] font-label-ui font-bold border transition-colors inline-flex items-center gap-1 cursor-pointer"
                  [class]="newNoteVisibility() === 'PRIVATE' ? 'bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 border-indigo-500/40' : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/30'"
                  title="Видно только вам"
                >
                  <span class="material-symbols-rounded text-xs">lock</span>
                  <span>🔒 Лично</span>
                </button>

                <button
                  type="button"
                  (click)="newNoteVisibility.set('GM_ONLY')"
                  class="px-2 py-1 rounded-lg text-[11px] font-label-ui font-bold border transition-colors inline-flex items-center gap-1 cursor-pointer"
                  [class]="newNoteVisibility() === 'GM_ONLY' ? 'bg-purple-500/20 text-purple-800 dark:text-purple-300 border-purple-500/40' : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/30'"
                  title="Архаичный лор мастера (GM Only)"
                >
                  <span class="material-symbols-rounded text-xs">auto_awesome</span>
                  <span>📜 Архаика</span>
                </button>
              </div>

              <!-- Pin Options & Submit -->
              <div class="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                <label class="inline-flex items-center gap-1 cursor-pointer text-[11px] font-label-ui text-on-surface">
                  <input
                    type="checkbox"
                    [(ngModel)]="newNotePinToHero"
                    class="rounded text-primary focus:ring-primary h-3.5 w-3.5"
                  />
                  <span>📌 В героя</span>
                </label>

                <label class="inline-flex items-center gap-1 cursor-pointer text-[11px] font-label-ui text-on-surface">
                  <input
                    type="checkbox"
                    [(ngModel)]="newNotePinToCloud"
                    class="rounded text-primary focus:ring-primary h-3.5 w-3.5"
                  />
                  <span>☁️ В облака</span>
                </label>

                <button
                  type="button"
                  (click)="submitNote()"
                  [disabled]="!newNoteText.trim()"
                  class="px-3.5 py-1.5 rounded-xl bg-primary text-on-primary font-label-ui text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-95 shadow-xs cursor-pointer"
                >
                  Запустить мысль
                </button>
              </div>
            </div>
          </div>

          <!-- ============================================================== -->
          <!-- MODE 1: FLOATING CANVAS (ПАРЯЩЕЕ ПРОСТРАНСТВО БЕЗ ВРЕМЕНИ)     -->
          <!-- ============================================================== -->
          @if (modalViewMode() === 'FLOATING') {
            <div class="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 min-h-[320px]">
              <!-- Atmospheric Sky / Nebula Outer Frame -->
              <div
                class="rounded-3xl bg-gradient-to-b from-sky-100/70 via-indigo-50/40 to-purple-100/50 dark:from-[#0b101e] dark:via-[#131b2f] dark:to-[#1a152e] border-2 border-primary/20 p-3 sm:p-5 shadow-inner relative isolate overflow-hidden"
              >
                <!-- Space Header & Filter Lens -->
                <div class="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-outline-variant/20 flex-wrap">
                  <div class="flex items-center gap-2">
                    <span class="text-2xl animate-pulse select-none">🌌</span>
                    <div>
                      <h4 class="font-headline-sm text-xs sm:text-sm font-black text-on-surface">
                        Парящее пространство мыслей: {{ actor.name }}
                      </h4>
                      <p class="font-body-sm text-[11px] text-on-surface-variant">
                        Свободный полёт записей без привязки ко времени · Взаимные лайки богов и героев
                      </p>
                    </div>
                  </div>

                  <!-- Floating Lens Filters -->
                  <div class="flex items-center gap-1 bg-surface-container-high/90 p-1 rounded-xl border border-outline-variant/30 text-[11px]">
                    <button
                      type="button"
                      (click)="floatingFilter.set('ALL')"
                      class="px-2 py-0.5 rounded-lg font-label-ui font-bold transition-colors cursor-pointer"
                      [class]="floatingFilter() === 'ALL' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'"
                    >
                      Все
                    </button>
                    <button
                      type="button"
                      (click)="floatingFilter.set('PUBLIC')"
                      class="px-2 py-0.5 rounded-lg font-label-ui font-bold transition-colors cursor-pointer"
                      [class]="floatingFilter() === 'PUBLIC' ? 'bg-emerald-600 text-white' : 'text-on-surface-variant hover:text-on-surface'"
                    >
                      🌐 Публичные
                    </button>
                    <button
                      type="button"
                      (click)="floatingFilter.set('PRIVATE')"
                      class="px-2 py-0.5 rounded-lg font-label-ui font-bold transition-colors cursor-pointer"
                      [class]="floatingFilter() === 'PRIVATE' ? 'bg-indigo-600 text-white' : 'text-on-surface-variant hover:text-on-surface'"
                    >
                      🔒 Личные
                    </button>
                    <button
                      type="button"
                      (click)="floatingFilter.set('GM_ONLY')"
                      class="px-2 py-0.5 rounded-lg font-label-ui font-bold transition-colors cursor-pointer"
                      [class]="floatingFilter() === 'GM_ONLY' ? 'bg-purple-600 text-white' : 'text-on-surface-variant hover:text-on-surface'"
                    >
                      📜 Архаика
                    </button>
                    <button
                      type="button"
                      (click)="floatingFilter.set('PARTY')"
                      class="px-2 py-0.5 rounded-lg font-label-ui font-bold transition-colors cursor-pointer"
                      [class]="floatingFilter() === 'PARTY' ? 'bg-amber-600 text-white' : 'text-on-surface-variant hover:text-on-surface'"
                    >
                      👥 Только Пати
                    </button>
                  </div>
                </div>

                <!-- FLOATING CARDS CLUSTER (ORGANIC GRID WITH TILTS & FLOAT ANIMATIONS) -->
                @if ((heroNotes$ | async); as allNotes) {
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    @for (note of filterFloatingNotes(allNotes); track note.id; let idx = $index) {
                      <div
                        class="floating-card rounded-2xl p-3.5 bg-white dark:bg-slate-800 border-2 transition-colors flex flex-col justify-between gap-2.5 shadow-sm hover:shadow-md relative isolate"
                        [class]="getCardTierClasses(note)"
                        [style.--tw-rotate]="(note.floatingTilt || getDynamicTilt(idx)) + 'deg'"
                        [style.animation-delay]="(note.floatingDelay || (idx * 0.3) % 2) + 's'"
                      >
                        <!-- Top Row: Mood, Tier Badge & Pins -->
                        <div class="flex items-center justify-between gap-1 text-[11px] font-label-code-sm">
                          <div class="flex items-center gap-1.5 min-w-0">
                            <span class="text-base select-none">{{ note.moodEmoji || getMoodFallback(note.type) }}</span>
                            <span
                              class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                              [class]="getTierBadgeClasses(note.visibility)"
                            >
                              {{ getTierLabel(note.visibility) }}
                            </span>
                            <span class="truncate max-w-[120px] text-outline text-[10px]">
                              {{ isMyNote(note) ? 'Вы' : (note.subActorName ? (note.actorName + ' & ' + note.subActorName) : (note.authorProfileName || note.actorName)) }}
                            </span>
                          </div>

                          <!-- Pin Toggles -->
                          <div class="flex items-center gap-1 flex-shrink-0">
                            <button
                              type="button"
                              (click)="arena.togglePinToHero(note.id)"
                              class="p-1 rounded text-xs transition-colors cursor-pointer"
                              [class]="note.isPinnedToHero ? 'text-primary bg-primary/10' : 'text-outline hover:text-on-surface'"
                              title="Закрепить в карточке героя"
                            >
                              <span>📌</span>
                            </button>
                            <button
                              type="button"
                              (click)="arena.togglePinToCloud(note.id)"
                              class="p-1 rounded text-xs transition-colors cursor-pointer"
                              [class]="note.isPinnedToCloud ? 'text-sky-500 bg-sky-500/10' : 'text-outline hover:text-on-surface'"
                              title="Закрепить в общем небе партии"
                            >
                              <span>☁️</span>
                            </button>
                          </div>
                        </div>

                        <!-- Reply Context Badge (if note is a reply) -->
                        @if (note.replyToAuthorName) {
                          <div class="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface-container-high/60 border-l-2 border-primary text-[10px] text-on-surface-variant font-label-ui truncate mb-1">
                            <span class="material-symbols-rounded text-xs text-primary flex-shrink-0">reply</span>
                            <span class="font-bold text-on-surface truncate">Ответ для {{ note.replyToAuthorName }}:</span>
                            @if (note.replyToTextSnippet) {
                              <span class="truncate italic opacity-85">«{{ note.replyToTextSnippet }}»</span>
                            }
                          </div>
                        }

                        <!-- Thought Text -->
                        <p class="font-body-sm text-xs text-on-surface leading-relaxed whitespace-pre-wrap select-text">
                          {{ note.text }}
                        </p>

                        <!-- Sub-character (Co-participant) Banner -->
                        @if (note.subActorName) {
                          <div class="flex items-center gap-1.5 p-1.5 rounded-xl bg-amber-500/15 dark:bg-amber-400/15 border border-amber-500/35 text-[10px] font-label-ui text-amber-900 dark:text-amber-200">
                            <span class="text-xs select-none">🎭</span>
                            <span class="font-bold">Субперсонаж:</span>
                            <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-surface-container text-on-surface font-label-code-sm text-[9px] shadow-2xs border border-outline-variant/30 font-bold">
                              <app-actor-avatar [avatar]="note.subActorAvatar || 'person'" containerClass="w-3.5 h-3.5 rounded-full flex-shrink-0" />
                              <span>{{ note.subActorName }}</span>
                            </span>
                          </div>
                        }

                        <!-- Party Synergy Banner -->
                        @if (note.partyActorIds && note.partyActorIds.length > 0) {
                          <div class="flex items-center gap-1.5 p-1.5 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/30 text-[10px] font-label-ui text-amber-900 dark:text-amber-200">
                            <span class="text-xs select-none">👥</span>
                            <span class="font-bold">В пати с:</span>
                            <div class="flex items-center gap-1 flex-wrap">
                              @for (partnerId of note.partyActorIds; track partnerId) {
                                @if (getActor(partnerId); as partner) {
                                  <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-surface-container text-on-surface font-label-code-sm text-[9px] shadow-2xs border border-outline-variant/30">
                                    <app-actor-avatar [avatar]="partner.avatarIcon" containerClass="w-3.5 h-3.5 rounded-full flex-shrink-0" />
                                    <span class="font-bold">{{ partner.name }}</span>
                                  </span>
                                }
                              }
                            </div>
                          </div>
                        }

                        <!-- Character Likes Bar (+ N Collapsing) -->
                        <div class="flex items-center justify-between gap-1 pt-2 border-t border-outline-variant/20 flex-wrap">
                          <div class="flex items-center gap-1.5 flex-wrap">
                            <!-- Toggle Like from Active Hero -->
                            <button
                              type="button"
                              (click)="toggleLike(note.id)"
                              class="px-2 py-0.5 rounded-lg font-label-ui border transition-all inline-flex items-center gap-1 cursor-pointer text-[11px]"
                              [class]="
                                hasActorLiked(note)
                                  ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40 font-bold'
                                  : 'bg-surface-container text-on-surface-variant border-outline-variant/30 hover:bg-rose-500/10'
                              "
                              title="Поставить / снять лайк героя {{ actor.name }}"
                            >
                              <span>{{ hasActorLiked(note) ? '❤️' : '🤍' }}</span>
                              <span>{{ note.likedByActors?.length || note.votesCount || 0 }}</span>
                            </button>

                            <!-- First 2-3 Hero Like Avatars -->
                            @for (like of getVisibleLikes(note); track like.actorId) {
                              <span
                                class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-surface-container text-on-surface text-[10px] font-label-code-sm shadow-2xs border border-outline-variant/25"
                                title="Лайк от {{ like.actorName }}"
                              >
                                <app-actor-avatar [avatar]="like.avatarIcon || 'person'" containerClass="w-3.5 h-3.5 rounded-full flex-shrink-0" />
                                <span class="font-bold">{{ like.actorName }}</span>
                              </span>
                            }

                            <!-- Collapsed Label: + N лайка (Алиса, Акин) with Hover Popover -->
                            @if (getHiddenLikes(note).length > 0) {
                              <div class="relative group/modalhiddenlikes inline-flex items-center">
                                <button
                                  type="button"
                                  (click)="toggleExpandedLikes(note.id)"
                                  class="px-1.5 py-0.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary font-label-code-sm text-[10px] font-bold border border-primary/25 transition-colors cursor-pointer"
                                  [title]="getHiddenLikesTooltip(note)"
                                >
                                  +{{ getHiddenLikes(note).length }} {{ getLikesWord(getHiddenLikes(note).length) }} ({{ getHiddenLikesNames(note) }})
                                </button>
                                <!-- Rich Hover Popover showing all remaining characters -->
                                <div
                                  class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/modalhiddenlikes:flex flex-col rounded-xl bg-slate-900/95 dark:bg-slate-950/95 text-white p-2 shadow-2xl border border-slate-700/60 z-50 min-w-[150px] max-w-[210px] pointer-events-none animate-fadeIn backdrop-blur-md"
                                >
                                  <div class="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1 border-b border-slate-700/60 pb-1 flex items-center justify-between">
                                    <span>Оценили:</span>
                                    <span class="text-primary font-mono font-bold">+{{ getHiddenLikes(note).length }}</span>
                                  </div>
                                  <div class="flex flex-col gap-1 max-h-[130px] overflow-y-auto pr-0.5">
                                    @for (hiddenLike of getHiddenLikes(note); track hiddenLike.actorId) {
                                      <div class="flex items-center gap-1.5 text-[10px]">
                                        <div class="w-3.5 h-3.5 rounded-full overflow-hidden flex-shrink-0 bg-slate-800">
                                          <app-actor-avatar [avatar]="hiddenLike.avatarIcon || 'person'" containerClass="w-full h-full" />
                                        </div>
                                        <span class="truncate text-slate-100">{{ hiddenLike.actorName }}</span>
                                      </div>
                                    }
                                  </div>
                                  <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900/95 dark:bg-slate-950/95 rotate-45 border-b border-r border-slate-700/60"></div>
                                </div>
                              </div>
                            }
                          </div>

                          <!-- Adopt Action (if public) -->
                          @if (!isMyNote(note) && (note.visibility === 'PUBLIC' || !note.visibility)) {
                            <button
                              type="button"
                              (click)="adoptToPrivate(note.id)"
                              class="px-2 py-0.5 rounded-lg bg-surface-container-high hover:bg-primary-container text-on-surface text-[10px] font-label-ui transition-colors inline-flex items-center gap-1 cursor-pointer"
                              title="Забрать мысль себе в приватный workspace"
                            >
                              <span>📥 Забрать</span>
                            </button>
                          }
                        </div>

                        <!-- Expanded Full Likes Popover -->
                        @if (expandedLikesNoteId() === note.id) {
                          <div class="mt-1 p-2 rounded-xl bg-surface-container-high border border-primary/30 flex flex-col gap-1 text-[10px] animate-fadeIn">
                            <div class="flex items-center justify-between text-primary font-bold">
                              <span>Все оценившие персонажи:</span>
                              <button type="button" (click)="toggleExpandedLikes(note.id)" class="text-xs hover:text-on-surface cursor-pointer">✕</button>
                            </div>
                            <div class="flex items-center gap-1.5 flex-wrap">
                              @for (l of (note.likedByActors || []); track l.actorId) {
                                <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-surface-container-lowest text-on-surface text-[9px] font-label-code-sm border border-outline-variant/30">
                                  <app-actor-avatar [avatar]="l.avatarIcon || 'person'" containerClass="w-3.5 h-3.5 rounded-full flex-shrink-0" />
                                  <span class="font-bold">{{ l.actorName }}</span>
                                </span>
                              }
                            </div>
                          </div>
                        }
                      </div>
                    } @empty {
                      <div class="col-span-full p-8 text-center text-on-surface-variant flex flex-col items-center justify-center gap-2">
                        <span class="text-3xl opacity-40">🌌</span>
                        <span class="font-body-sm text-xs">
                          В парящем пространстве пока нет мыслей по этому фильтру. Запустите первую мысль выше!
                        </span>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          }

          <!-- ============================================================== -->
          <!-- MODE 2: 3 TIERS ISLANDS (ПО УРОВНЯМ ДОСТУПА)                   -->
          <!-- ============================================================== -->
          @if (modalViewMode() === 'TIERS') {
            <div class="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 min-h-[280px]">
              <div
                class="rounded-3xl bg-gradient-to-b from-sky-100/60 via-amber-50/30 to-purple-100/40 dark:from-slate-900/90 dark:via-[#151a29] dark:to-slate-950 border-2 border-primary/20 p-3 sm:p-4 shadow-inner relative isolate overflow-hidden"
              >
                <div class="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-outline-variant/20 flex-wrap">
                  <div class="flex items-center gap-2">
                    <span class="text-xl">☁️</span>
                    <div>
                      <h4 class="font-headline-sm text-xs sm:text-sm font-black text-on-surface">
                        3 Острова доступа: {{ actor.name }}
                      </h4>
                      <p class="font-body-sm text-[10px] text-on-surface-variant">
                        Публичный Хаб · Личный Workspace · Архаичный лор мастера
                      </p>
                    </div>
                  </div>
                </div>

                @if ((heroNotes$ | async); as allNotes) {
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <!-- ISLAND 1: PUBLIC HUB -->
                    <div class="rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-xs border-2 border-emerald-500/35 p-3 flex flex-col gap-2.5 shadow-sm">
                      <div class="flex items-center justify-between pb-2 border-b border-emerald-500/20">
                        <div class="flex items-center gap-1.5">
                          <span class="material-symbols-rounded text-emerald-600 dark:text-emerald-400 text-base">public</span>
                          <span class="font-headline-sm text-xs font-bold text-on-surface">Публичный Хаб</span>
                        </div>
                        <span class="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-label-code-sm text-[10px] font-bold">
                          {{ getNotesByVisibility(allNotes, 'PUBLIC').length }}
                        </span>
                      </div>
                      <p class="font-body-sm text-[10px] text-on-surface-variant">
                        Синхронизируется в общее Хроно-Облако партии.
                      </p>

                      <div class="flex flex-col gap-2 overflow-y-auto max-h-[300px] pr-0.5">
                        @for (note of getNotesByVisibility(allNotes, 'PUBLIC'); track note.id) {
                          <div
                            class="p-2.5 rounded-xl bg-surface-container-lowest border transition-all flex flex-col gap-1.5 shadow-2xs"
                            [class]="note.isPinnedToHero ? 'border-primary ring-1 ring-primary/20' : 'border-outline-variant/30'"
                          >
                            <div class="flex items-center justify-between gap-1 text-[10px] font-label-code-sm text-outline">
                              <span>{{ note.moodEmoji || getMoodFallback(note.type) }}</span>
                              <span class="truncate max-w-[90px]">{{ isMyNote(note) ? 'Вы' : (note.authorProfileName || 'Хаб') }}</span>
                            </div>
                            @if (note.replyToAuthorName) {
                              <div class="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-surface-container-high/60 border-l-2 border-primary text-[9px] text-on-surface-variant font-label-ui truncate mb-1">
                                <span class="material-symbols-rounded text-xs text-primary flex-shrink-0">reply</span>
                                <span class="font-bold text-on-surface truncate">Ответ: {{ note.replyToAuthorName }}</span>
                              </div>
                            }
                            <p class="font-body-sm text-[11px] text-on-surface leading-snug whitespace-pre-wrap">
                              {{ note.text }}
                            </p>
                            @if (note.subActorName) {
                              <div class="text-[9px] font-label-code-sm text-amber-700 dark:text-amber-300 font-bold flex items-center gap-1">
                                <span>🎭</span>
                                <span>Субперсонаж: {{ note.subActorName }}</span>
                              </div>
                            }
                            @if (note.partyActorIds && note.partyActorIds.length > 0) {
                              <div class="text-[9px] font-label-code-sm text-amber-700 dark:text-amber-300">
                                👥 Пати: {{ getPartyNames(note) }}
                              </div>
                            }
                            <div class="flex items-center justify-between gap-1 pt-1 border-t border-outline-variant/15 text-[10px]">
                              <button
                                type="button"
                                (click)="toggleLike(note.id)"
                                class="inline-flex items-center gap-0.5 text-rose-600 font-bold"
                              >
                                <span>❤️</span>
                                <span>{{ note.likedByActors?.length || note.votesCount || 0 }}</span>
                              </button>
                              <div class="flex items-center gap-1">
                                <button type="button" (click)="arena.togglePinToHero(note.id)" class="text-xs">📌</button>
                                <button type="button" (click)="arena.togglePinToCloud(note.id)" class="text-xs">☁️</button>
                              </div>
                            </div>
                          </div>
                        } @empty {
                          <div class="p-4 text-center text-on-surface-variant text-[11px]">Нет публичных заметок</div>
                        }
                      </div>
                    </div>

                    <!-- ISLAND 2: PRIVATE WORKSPACE -->
                    <div class="rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-xs border-2 border-indigo-500/35 p-3 flex flex-col gap-2.5 shadow-sm">
                      <div class="flex items-center justify-between pb-2 border-b border-indigo-500/20">
                        <div class="flex items-center gap-1.5">
                          <span class="material-symbols-rounded text-indigo-600 dark:text-indigo-400 text-base">lock</span>
                          <span class="font-headline-sm text-xs font-bold text-on-surface">Личный Workspace</span>
                        </div>
                        <span class="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 font-label-code-sm text-[10px] font-bold">
                          {{ getNotesByVisibility(allNotes, 'PRIVATE').length }}
                        </span>
                      </div>
                      <p class="font-body-sm text-[10px] text-on-surface-variant">
                        Видно только вам. Скрытые тактики и черновики.
                      </p>

                      <div class="flex flex-col gap-2 overflow-y-auto max-h-[300px] pr-0.5">
                        @for (note of getNotesByVisibility(allNotes, 'PRIVATE'); track note.id) {
                          <div
                            class="p-2.5 rounded-xl bg-surface-container-lowest border transition-all flex flex-col gap-1.5 shadow-2xs"
                            [class]="note.isPinnedToHero ? 'border-indigo-500 ring-1 ring-indigo-500/20' : 'border-outline-variant/30'"
                          >
                            <div class="flex items-center justify-between gap-1 text-[10px] font-label-code-sm text-outline">
                              <span>{{ note.moodEmoji || getMoodFallback(note.type) }}</span>
                              <span>🔒 Приватно</span>
                            </div>
                            @if (note.replyToAuthorName) {
                              <div class="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-surface-container-high/60 border-l-2 border-primary text-[9px] text-on-surface-variant font-label-ui truncate mb-1">
                                <span class="material-symbols-rounded text-xs text-primary flex-shrink-0">reply</span>
                                <span class="font-bold text-on-surface truncate">Ответ: {{ note.replyToAuthorName }}</span>
                              </div>
                            }
                            <p class="font-body-sm text-[11px] text-on-surface leading-snug whitespace-pre-wrap">
                              {{ note.text }}
                            </p>
                            <div class="flex items-center justify-between gap-1 pt-1 border-t border-outline-variant/15 text-[10px]">
                              <button type="button" (click)="toggleLike(note.id)" class="text-rose-600 font-bold">
                                ❤️ {{ note.likedByActors?.length || note.votesCount || 0 }}
                              </button>
                              <div class="flex items-center gap-1">
                                <button type="button" (click)="arena.togglePinToHero(note.id)" class="text-xs">📌</button>
                                <button type="button" (click)="arena.togglePinToCloud(note.id)" class="text-xs">☁️</button>
                              </div>
                            </div>
                          </div>
                        } @empty {
                          <div class="p-4 text-center text-on-surface-variant text-[11px]">Нет личных заметок</div>
                        }
                      </div>
                    </div>

                    <!-- ISLAND 3: ARCHAIC GM LORE -->
                    <div class="rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-xs border-2 border-purple-500/35 p-3 flex flex-col gap-2.5 shadow-sm">
                      <div class="flex items-center justify-between pb-2 border-b border-purple-500/20">
                        <div class="flex items-center gap-1.5">
                          <span class="material-symbols-rounded text-purple-600 dark:text-purple-400 text-base">auto_awesome</span>
                          <span class="font-headline-sm text-xs font-bold text-on-surface">Архаичный лор (GM)</span>
                        </div>
                        <span class="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-800 dark:text-purple-300 font-label-code-sm text-[10px] font-bold">
                          {{ getNotesByVisibility(allNotes, 'GM_ONLY').length }}
                        </span>
                      </div>
                      <p class="font-body-sm text-[10px] text-on-surface-variant">
                        Древние реликвии и скрытый лор мастера.
                      </p>

                      <div class="flex flex-col gap-2 overflow-y-auto max-h-[300px] pr-0.5">
                        @for (note of getNotesByVisibility(allNotes, 'GM_ONLY'); track note.id) {
                          <div
                            class="p-2.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border transition-all flex flex-col gap-1.5 shadow-2xs border-purple-300/40 dark:border-purple-800/40"
                          >
                            <div class="flex items-center justify-between gap-1 text-[10px] font-label-code-sm text-purple-800 dark:text-purple-300">
                              <span>📜 Архаика</span>
                              <span>Мастер (GM)</span>
                            </div>
                            @if (note.replyToAuthorName) {
                              <div class="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-surface-container-high/60 border-l-2 border-primary text-[9px] text-on-surface-variant font-label-ui truncate mb-1">
                                <span class="material-symbols-rounded text-xs text-primary flex-shrink-0">reply</span>
                                <span class="font-bold text-on-surface truncate">Ответ: {{ note.replyToAuthorName }}</span>
                              </div>
                            }
                            <p class="font-body-sm text-[11px] text-on-surface leading-snug whitespace-pre-wrap">
                              {{ note.text }}
                            </p>
                            <div class="flex items-center justify-between gap-1 pt-1 border-t border-purple-200/40 text-[10px]">
                              <button type="button" (click)="toggleLike(note.id)" class="text-rose-600 font-bold">
                                ❤️ {{ note.likedByActors?.length || note.votesCount || 0 }}
                              </button>
                              <button type="button" (click)="arena.togglePinToHero(note.id)" class="text-xs">📌</button>
                            </div>
                          </div>
                        } @empty {
                          <div class="p-4 text-center text-on-surface-variant text-[11px]">Архаичный лор не записан</div>
                        }
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- ============================================================== -->
          <!-- MODE 3: TABBED LIST VIEW (ДЕТАЛЬНЫЙ СПИСОК)                    -->
          <!-- ============================================================== -->
          @if (modalViewMode() === 'LIST') {
            @if ((heroNotes$ | async) ?? []; as allNotes) {
              <div class="flex items-center gap-1.5 border-b border-outline-variant/20 pb-2 flex-shrink-0 flex-wrap">
                <button
                  type="button"
                  (click)="activeTab.set('ALL')"
                  class="px-3 py-1 rounded-lg font-label-ui text-xs font-bold transition-colors cursor-pointer"
                  [class]="activeTab() === 'ALL' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'"
                >
                  Все ({{ getTabCount('ALL', allNotes) }})
                </button>
                <button
                  type="button"
                  (click)="activeTab.set('PINNED')"
                  class="px-3 py-1 rounded-lg font-label-ui text-xs font-bold transition-colors cursor-pointer"
                  [class]="activeTab() === 'PINNED' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'"
                >
                  📌 Закрепленные ({{ getTabCount('PINNED', allNotes) }})
                </button>
                <button
                  type="button"
                  (click)="activeTab.set('PRIVATE')"
                  class="px-3 py-1 rounded-lg font-label-ui text-xs font-bold transition-colors cursor-pointer"
                  [class]="activeTab() === 'PRIVATE' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'"
                >
                  🔒 Личные ({{ getTabCount('PRIVATE', allNotes) }})
                </button>
                <button
                  type="button"
                  (click)="activeTab.set('PUBLIC')"
                  class="px-3 py-1 rounded-lg font-label-ui text-xs font-bold transition-colors cursor-pointer"
                  [class]="activeTab() === 'PUBLIC' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'"
                >
                  🌐 Публичные ({{ getTabCount('PUBLIC', allNotes) }})
                </button>
                <button
                  type="button"
                  (click)="activeTab.set('GM_ONLY')"
                  class="px-3 py-1 rounded-lg font-label-ui text-xs font-bold transition-colors cursor-pointer"
                  [class]="activeTab() === 'GM_ONLY' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'"
                >
                  📜 Архаика ({{ getTabCount('GM_ONLY', allNotes) }})
                </button>
              </div>

              <div class="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-[220px]">
                @for (note of filterNotes(allNotes); track note.id) {
                  <div
                    class="p-3 rounded-2xl bg-surface-container/50 border border-outline-variant/30 flex flex-col gap-2 shadow-2xs"
                    [class]="note.isPinnedToHero ? 'ring-1 ring-primary/40 bg-primary-container/10' : ''"
                  >
                    <div class="flex items-center justify-between gap-2 text-xs">
                      <div class="flex items-center gap-1.5 font-bold">
                        <span>{{ note.moodEmoji || getMoodFallback(note.type) }}</span>
                        <span class="font-headline-sm text-xs text-on-surface">{{ note.title || 'Мысль' }}</span>
                        <span
                          class="text-[10px] px-2 py-0.5 rounded-full font-label-code-sm"
                          [class]="getTierBadgeClasses(note.visibility)"
                        >
                          {{ getTierLabel(note.visibility) }}
                        </span>
                      </div>
                      <div class="flex items-center gap-1">
                        <button
                          type="button"
                          (click)="toggleLike(note.id)"
                          class="px-2 py-0.5 rounded-lg text-rose-600 font-bold border border-rose-500/20 bg-rose-500/10 text-xs"
                        >
                          ❤️ {{ note.likedByActors?.length || note.votesCount || 0 }}
                        </button>
                        <button
                          type="button"
                          (click)="arena.deleteNote(note.id)"
                          class="p-1 rounded text-outline hover:text-error hover:bg-error/10 cursor-pointer"
                          title="Удалить"
                        >
                          <span class="material-symbols-rounded text-xs">delete</span>
                        </button>
                      </div>
                    </div>
                    @if (note.replyToAuthorName) {
                      <div class="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface-container-high/60 border-l-2 border-primary text-[10px] text-on-surface-variant font-label-ui truncate mb-1">
                        <span class="material-symbols-rounded text-xs text-primary flex-shrink-0">reply</span>
                        <span class="font-bold text-on-surface truncate">Ответ для {{ note.replyToAuthorName }}:</span>
                        @if (note.replyToTextSnippet) {
                          <span class="truncate italic opacity-85">«{{ note.replyToTextSnippet }}»</span>
                        }
                      </div>
                    }
                    <p class="font-body-sm text-xs text-on-surface leading-snug whitespace-pre-wrap">
                      {{ note.text }}
                    </p>
                    @if (note.subActorName) {
                      <div class="text-[10px] font-label-ui text-amber-700 dark:text-amber-300 font-bold flex items-center gap-1">
                        <span>🎭</span>
                        <span>Субперсонаж: {{ note.subActorName }}</span>
                      </div>
                    }
                    @if (note.partyActorIds && note.partyActorIds.length > 0) {
                      <div class="text-[10px] font-label-ui text-amber-700 dark:text-amber-300">
                        👥 В пати с: {{ getPartyNames(note) }}
                      </div>
                    }
                  </div>
                } @empty {
                  <div class="p-8 text-center text-on-surface-variant flex flex-col items-center justify-center gap-2">
                    <span class="material-symbols-rounded text-3xl opacity-40">note_alt</span>
                    <span class="font-body-sm text-xs">Заметок пока нет. Напишите первую выше!</span>
                  </div>
                }
              </div>
            }
          }

          <!-- FOOTER -->
          <div class="pt-3 border-t border-outline-variant/20 flex items-center justify-between flex-shrink-0">
            <span class="font-label-code-sm text-[11px] text-outline">
              💡 Парящие мысли и лайки персонажей синхронизируются в реальном времени
            </span>
            <button
              type="button"
              (click)="onDismiss()"
              class="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-ui text-xs font-bold transition-colors cursor-pointer"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ArenaHeroNotesModalComponent {
  protected readonly arena = inject(NeuronArenaService);
  protected readonly profile = inject(ProfileService);
  protected readonly getAccentAvatarClasses = getAccentAvatarClasses;
  protected readonly getAccentPillClasses = getAccentPillClasses;

  @Input() actor: ArenaActorCard | null = null;
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  readonly modalViewMode = signal<HeroModalViewMode>('FLOATING');
  readonly activeTab = signal<HeroNoteFilterTab>('ALL');
  readonly floatingFilter = signal<'ALL' | 'PUBLIC' | 'PRIVATE' | 'GM_ONLY' | 'PARTY'>('ALL');

  newNoteText = '';
  readonly newNoteType = signal<CloudItemType>('thought');
  readonly newNoteVisibility = signal<NoteVisibility>('PUBLIC');
  newNotePinToHero = true;
  newNotePinToCloud = false;
  readonly selectedPartyActorIds = signal<string[]>([]);
  readonly selectedSubActorId = signal<string | null>(null);
  readonly expandedLikesNoteId = signal<string | null>(null);

  selectedSubActor(): ArenaActorCard | null {
    const id = this.selectedSubActorId();
    if (!id) return null;
    return this.arena.getActor(id) ?? null;
  }

  setSubActor(actorId: string): void {
    if (this.selectedSubActorId() === actorId) {
      this.selectedSubActorId.set(null);
    } else {
      this.selectedSubActorId.set(actorId);
    }
  }

  private detectedCacheKey = '';
  private detectedCacheList: ArenaActorCard[] = [];
  private detectedCacheIds = new Set<string>();

  get heroNotes$() {
    return this.actor ? this.arena.getHeroNotes(this.actor.id) : null;
  }

  onDismiss(): void {
    this.resetForm();
    this.close.emit();
  }

  resetForm(): void {
    this.newNoteText = '';
    this.newNoteType.set('thought');
    this.newNoteVisibility.set('PUBLIC');
    this.newNotePinToHero = true;
    this.newNotePinToCloud = false;
    this.selectedPartyActorIds.set([]);
    this.selectedSubActorId.set(null);
    this.expandedLikesNoteId.set(null);
    this.detectedCacheKey = '';
    this.detectedCacheList = [];
    this.detectedCacheIds.clear();
  }

  private updateDetectedActorsCache(): void {
    const actorId = this.actor?.id ?? '';
    const key = `${actorId}::${this.newNoteText}`;
    if (this.detectedCacheKey === key) {
      return;
    }
    this.detectedCacheKey = key;
    this.detectedCacheList = detectMentionedActors(this.newNoteText, this.arena.getActors(), this.actor?.id);
    this.detectedCacheIds = new Set(this.detectedCacheList.map((a) => a.id));
  }

  get detectedActorsFromText(): ArenaActorCard[] {
    this.updateDetectedActorsCache();
    return this.detectedCacheList;
  }

  togglePartyActor(actorId: string): void {
    const current = this.selectedPartyActorIds();
    if (current.includes(actorId)) {
      this.selectedPartyActorIds.set(current.filter((id) => id !== actorId));
    } else {
      this.selectedPartyActorIds.set([...current, actorId]);
    }
  }

  isPartyActorSelected(actorId: string): boolean {
    this.updateDetectedActorsCache();
    return this.selectedPartyActorIds().includes(actorId) || this.detectedCacheIds.has(actorId);
  }

  toggleExpandedLikes(noteId: string): void {
    this.expandedLikesNoteId.update((curr) => (curr === noteId ? null : noteId));
  }

  getActor(actorId: string): ArenaActorCard | undefined {
    return this.arena.getActor(actorId);
  }

  hasActorLiked(note: CloudDayNote): boolean {
    const actorId = this.actor?.id;
    if (!actorId || !note.likedByActors) return false;
    return note.likedByActors.some((l) => l.actorId === actorId);
  }

  toggleLike(noteId: string): void {
    this.arena.toggleNoteLike(noteId, this.actor?.id);
  }

  getVisibleLikes(note: CloudDayNote): NoteActorLike[] {
    return note.likedByActors ? note.likedByActors.slice(0, 3) : [];
  }

  getHiddenLikes(note: CloudDayNote): NoteActorLike[] {
    return note.likedByActors && note.likedByActors.length > 3
      ? note.likedByActors.slice(3)
      : [];
  }

  getHiddenLikesNames(note: CloudDayNote): string {
    const hidden = this.getHiddenLikes(note);
    return hidden.map((l) => l.actorName).join(', ');
  }

  getHiddenLikesTooltip(note: CloudDayNote): string {
    const hidden = this.getHiddenLikes(note);
    return 'Также оценили: ' + hidden.map((l) => l.actorName).join(', ');
  }

  getLikesWord(count: number): string {
    if (count % 10 === 1 && count % 100 !== 11) return 'лайк';
    if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'лайка';
    return 'лайков';
  }

  getPartyNames(note: CloudDayNote): string {
    if (!note.partyActorIds || note.partyActorIds.length === 0) return '';
    return note.partyActorIds
      .map((id) => this.getActor(id)?.name || id)
      .join(', ');
  }

  isMyNote(note: CloudDayNote): boolean {
    return note.authorProfileId === this.profile.currentProfileId;
  }

  submitNote(): void {
    if (!this.actor || !this.newNoteText.trim()) return;

    const detectedIds = this.detectedActorsFromText.map((a) => a.id);
    const explicitSub = this.selectedSubActorId();
    const subActorId = explicitSub || (detectedIds.length > 0 ? detectedIds[0] : undefined);

    const initialParty = [...this.selectedPartyActorIds(), ...detectedIds];
    if (subActorId && !initialParty.includes(subActorId)) {
      initialParty.push(subActorId);
    }
    const combinedIds = Array.from(new Set(initialParty));

    this.arena.addHeroNote({
      actorId: this.actor.id,
      text: this.newNoteText,
      type: this.newNoteType(),
      visibility: this.newNoteVisibility(),
      isPinnedToHero: this.newNotePinToHero,
      isPinnedToCloud: this.newNotePinToCloud,
      partyActorIds: combinedIds,
      subActorId,
    });

    this.resetForm();
  }

  adoptToPrivate(noteId: string): void {
    this.arena.adoptNoteToPrivate(noteId);
  }

  getNotesByVisibility(notes: CloudDayNote[], visibility: NoteVisibility): CloudDayNote[] {
    if (visibility === 'PUBLIC') {
      return notes.filter((n) => n.visibility === 'PUBLIC' || !n.visibility);
    }
    return notes.filter((n) => n.visibility === visibility);
  }

  filterFloatingNotes(notes: CloudDayNote[]): CloudDayNote[] {
    const filter = this.floatingFilter();
    if (filter === 'PARTY') {
      return notes.filter((n) => n.partyActorIds && n.partyActorIds.length > 0);
    }
    if (filter === 'PUBLIC') {
      return this.getNotesByVisibility(notes, 'PUBLIC');
    }
    if (filter === 'PRIVATE') {
      return this.getNotesByVisibility(notes, 'PRIVATE');
    }
    if (filter === 'GM_ONLY') {
      return this.getNotesByVisibility(notes, 'GM_ONLY');
    }
    return notes;
  }

  filterNotesByTab(tab: HeroNoteFilterTab, notes: CloudDayNote[]): CloudDayNote[] {
    if (tab === 'PINNED') {
      return notes.filter((n) => Boolean(n.isPinnedToHero));
    }
    if (tab === 'PRIVATE') {
      return notes.filter((n) => n.visibility === 'PRIVATE');
    }
    if (tab === 'PUBLIC') {
      return notes.filter((n) => n.visibility === 'PUBLIC' || !n.visibility);
    }
    if (tab === 'GM_ONLY') {
      return notes.filter((n) => n.visibility === 'GM_ONLY');
    }
    return notes;
  }

  filterNotes(notes: CloudDayNote[]): CloudDayNote[] {
    return this.filterNotesByTab(this.activeTab(), notes);
  }

  getTabCount(tab: HeroNoteFilterTab, notes: CloudDayNote[]): number {
    return this.filterNotesByTab(tab, notes).length;
  }

  getMoodEmoji(type: CloudItemType): string {
    return type === 'proposal' ? '💡' : type === 'action' ? '⚡' : '💭';
  }

  getMoodFallback(type?: CloudItemType): string {
    return type === 'proposal' ? '💡' : type === 'action' ? '⚡' : '💭';
  }

  getTierLabel(visibility?: NoteVisibility): string {
    if (visibility === 'PRIVATE') return 'Лично';
    if (visibility === 'GM_ONLY') return 'Архаика';
    return 'Публично';
  }

  getTierBadgeClasses(visibility?: NoteVisibility): string {
    if (visibility === 'PRIVATE') {
      return 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30';
    }
    if (visibility === 'GM_ONLY') {
      return 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30';
    }
    return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30';
  }

  getCardTierClasses(note: CloudDayNote): string {
    if (note.visibility === 'PRIVATE') {
      return 'border-indigo-400/40 hover:border-indigo-500 hover:ring-2 hover:ring-indigo-500/20';
    }
    if (note.visibility === 'GM_ONLY') {
      return 'border-purple-400/40 hover:border-purple-500 hover:ring-2 hover:ring-purple-500/20 bg-purple-50/40 dark:bg-purple-950/20';
    }
    return 'border-emerald-400/40 hover:border-emerald-500 hover:ring-2 hover:ring-emerald-500/20';
  }

  getDynamicTilt(index: number): number {
    const tilts = [-1.4, 0.8, -0.6, 1.2, -1.0, 1.4];
    return tilts[index % tilts.length];
  }
}
