import { AsyncPipe, DatePipe, SlicePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  NgZone,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { combineLatest } from 'rxjs';
import { ModalOverlayDirective } from '../../core/directives/modal-overlay.directive';
import {
  ArenaAccentColor,
  ArenaActorCard,
  ArenaDesireCard,
  CloudDateTab,
  CloudDayNote,
  CloudItemType,
  NoteActorLike,
} from '../../core/models/flow.models';
import { NeuronArenaService } from '../../core/services/neuron-arena.service';
import { SEED_HERO_CLOUD_NOTES } from '../../core/services/hero-notes.seeds';
import { PartyRealtimeService } from '../../core/services/party-realtime.service';
import { PartySoundService } from '../../party-game/party-sound.service';
import { ActorAvatarComponent } from './actor-avatar.component';
import { ArenaHeroNotesModalComponent } from './arena-hero-notes-modal.component';
import {
  detectMentionedActors,
  getAccentAvatarClasses,
  getAccentPillClasses,
} from './arena-ui.utils';

export type CloudViewMode = 'CLOUD_TIMELINE' | 'DAY_FEED' | 'ORBIT' | 'CALENDAR_TIMELINE';
export type CloudFilterLayer =
  | 'ALL'
  | 'THOUGHTS'
  | 'PROPOSALS'
  | 'ACTIONS'
  | 'CHARACTERS'
  | 'ACTIVITIES';

export interface CalendarCoordinateSlot {
  id: string;
  dateKey: string;
  dayLabel: string;
  dateNumber: string;
  timeSlot: string;
  title: string;
  isToday: boolean;
  assignedCards: string[];
  assignedActors: string[];
}

export interface IdeaPitchPreset {
  title: string;
  icon: string;
  category: string;
  colorTheme: ArenaAccentColor;
}

export type CloudDayVibeId = 'CHRONO_DAYFLOW' | 'COZY_CHILL' | 'SYNTHWAVE' | 'NATURE_ZEN';

export interface CloudDayVibe {
  id: CloudDayVibeId;
  name: string;
  icon: string;
  badge: string;
  description: string;
  skyGradient: string;
  stageBorderClass: string;
  atmosphereEmoji: string[];
}

export interface TimelineCluster {
  id: string;
  timeMinutes: number;
  time: string;
  timeSpanLabel?: string;
  notes: CloudDayNote[];
  isCluster: boolean;
}

export const CLOUD_DAY_VIBES: CloudDayVibe[] = [
  {
    id: 'CHRONO_DAYFLOW',
    name: 'Хроно-День (Рассвет → Ночь)',
    icon: '🌅',
    badge: 'Живой Градиент',
    description: 'Плавный суточный переход от утренней зари через полуденное солнце к закату и ночному небу с пунктирными меридианами.',
    skyGradient: 'bg-gradient-to-r from-amber-100/60 via-sky-100/40 via-purple-100/45 to-indigo-900/25 dark:from-amber-950/30 dark:via-sky-950/20 dark:via-purple-950/35 dark:to-slate-950/80',
    stageBorderClass: 'border-amber-300/60 dark:border-amber-400/30',
    atmosphereEmoji: ['🌅', '☀️', '🌆', '🌙'],
  },
  {
    id: 'COZY_CHILL',
    name: 'Пятничный Чилл & Уют',
    icon: '🛋️',
    badge: 'Тёплый вечер',
    description: 'Пастельные кофейные и персиковые тона, атмосфера пледа, горячего чая и дружеских посиделок.',
    skyGradient: 'bg-gradient-to-r from-orange-100/70 via-rose-100/50 via-amber-100/60 to-purple-200/40 dark:from-amber-950/40 dark:via-rose-950/30 dark:to-purple-950/40',
    stageBorderClass: 'border-rose-300/60 dark:border-rose-400/30',
    atmosphereEmoji: ['☕', '🕯️', '🍕', '🛋️'],
  },
  {
    id: 'SYNTHWAVE',
    name: 'Неоновый Космос & Синтвейв',
    icon: '🌌',
    badge: 'Cyber Party',
    description: 'Глубокий неоновый космос, фиолетовые закатные градиенты и синтвейв-вайб под треки DJ Pixel.',
    skyGradient: 'bg-gradient-to-r from-indigo-200/50 via-purple-200/60 via-pink-200/40 to-slate-900/60 dark:from-[#0f1123] dark:via-[#1c1236] dark:via-[#2b1040] dark:to-[#0a0c1a]',
    stageBorderClass: 'border-purple-400/60 dark:border-purple-500/40',
    atmosphereEmoji: ['🕹️', '✨', '🎧', '🪐'],
  },
  {
    id: 'NATURE_ZEN',
    name: 'Горный Дзен & Свежесть',
    icon: '🌲',
    badge: 'Эко-Баланс',
    description: 'Свежие бирюзовые и изумрудные тона утреннего леса, чистый воздух и кристальная ясность мыслей.',
    skyGradient: 'bg-gradient-to-r from-emerald-100/60 via-teal-100/50 via-cyan-100/45 to-sky-200/50 dark:from-emerald-950/35 dark:via-teal-950/25 dark:to-cyan-950/40',
    stageBorderClass: 'border-emerald-300/60 dark:border-emerald-400/30',
    atmosphereEmoji: ['🍃', '☀️', '🌲', '✨'],
  },
];

const STORAGE_NOTES_KEY = 'lemon-party:cloud-notes-v8';

const SEED_NOTES: Record<string, CloudDayNote[]> = SEED_HERO_CLOUD_NOTES;




@Component({
  selector: 'app-party-cloud',
  standalone: true,
  imports: [
    AsyncPipe,
    DatePipe,
    SlicePipe,
    FormsModule,
    RouterLink,
    ActorAvatarComponent,
    ModalOverlayDirective,
    ArenaHeroNotesModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      @keyframes thoughtPopIn {
        0% {
          transform: scale(0.92) translateY(6px);
          opacity: 0;
        }
        100% {
          transform: scale(1) translateY(0);
          opacity: 1;
        }
      }

      @keyframes pulseGlowRing {
        0%,
        100% {
          opacity: 0.55;
          transform: scale(1);
        }
        50% {
          opacity: 0.95;
          transform: scale(1.05);
        }
      }

      .thought-pop {
        animation: thoughtPopIn 0.22s cubic-bezier(0.2, 0.8, 0.2, 1);
      }

      .now-sun-glow {
        animation: pulseGlowRing 2.8s ease-in-out infinite;
        will-change: transform, opacity;
      }

      .cloud-sky-canvas {
        contain: layout paint;
      }
    `,
  ],
  template: `
    <div class="flex flex-col gap-space-lg pb-16">
      <!-- 1. TOP BREADCRUMB & ROOM REAL-TIME HUD -->
      <nav class="flex items-center justify-between gap-space-md flex-wrap">
        <div class="flex items-center gap-2 text-xs font-label-ui">
          <a
            routerLink="/party"
            class="text-on-surface-variant hover:text-primary transition-colors inline-flex items-center gap-1 font-semibold no-underline"
          >
            <span class="material-symbols-rounded text-base">arrow_back</span>
            <span>Главное Меню</span>
          </a>
          <span class="text-outline-variant">/</span>
          <span class="text-primary font-bold flex items-center gap-1">
            <span class="material-symbols-rounded text-base">cloud</span>
            <span>Хроно-Облако: День Персонажей</span>
          </span>
          <span
            class="font-label-code-sm text-[10px] px-2 py-0.2 rounded-full bg-amber-400/20 text-amber-800 dark:text-amber-300 font-extrabold uppercase ml-1"
          >
            ⭐ Главная Игра
          </span>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <div
            class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-label-code-sm text-emerald-700 dark:text-emerald-300 font-bold"
          >
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Лобби Активно ({{ realtime.latencyMs() }}ms)</span>
          </div>

          <button
            type="button"
            (click)="openCreateSpaceModal()"
            class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-ui text-xs font-bold transition-colors border border-outline-variant/30 shadow-xs cursor-pointer"
          >
            <span class="material-symbols-rounded text-base text-primary">add_circle</span>
            <span>+ Новое Пространство</span>
          </button>
        </div>
      </nav>

      <!-- 2. DATE SELECTOR & CLOUD CONTROLS STRIP (CLEAN & SPACIOUS) -->
      <section
        class="bg-surface-container-lowest rounded-3xl p-4 sm:p-5 shadow-xs border border-outline-variant/30 flex flex-col gap-4"
      >
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <!-- Date Tabs Attached to Date -->
          <div class="flex items-center gap-2 overflow-x-auto py-1">
            <span class="font-label-ui text-xs font-bold text-on-surface-variant uppercase tracking-wider mr-1 flex-shrink-0 flex items-center gap-1">
              <span class="material-symbols-rounded text-base text-primary">calendar_today</span>
              День:
            </span>

            @for (tab of dateTabs(); track tab.dateKey) {
              <button
                type="button"
                (click)="selectDate(tab.dateKey)"
                class="px-3.5 py-2 rounded-2xl font-label-ui text-xs font-bold transition-colors flex items-center gap-2 border flex-shrink-0 cursor-pointer"
                [class]="
                  selectedDateKey() === tab.dateKey
                    ? 'bg-primary text-on-primary border-primary shadow-sm'
                    : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface border-outline-variant/30 hover:bg-surface-container-high'
                "
              >
                <span>{{ tab.label }}</span>
                <span
                  class="text-[10px] px-1.5 py-0.2 rounded-full font-label-code-sm"
                  [class]="
                    selectedDateKey() === tab.dateKey
                      ? 'bg-on-primary/20 text-on-primary'
                      : 'bg-surface-container-highest text-outline font-semibold'
                  "
                >
                  {{ tab.notesCount }} мыслей
                </span>
              </button>
            }
          </div>

          <!-- View Mode Toggle: Interactive Cloud Canvas vs Daily Feed -->
          <div class="flex items-center gap-1.5 bg-surface-container-low p-1.5 rounded-2xl border border-outline-variant/30 self-start lg:self-center">
            <button
              type="button"
              (click)="viewMode.set('CLOUD_TIMELINE')"
              class="px-3.5 py-1.5 rounded-xl font-label-ui text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              [class]="
                isCloudView()
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              "
            >
              <span class="material-symbols-rounded text-base">cloud</span>
              <span>☁️ Мультяшное Облако</span>
            </button>

            <button
              type="button"
              (click)="viewMode.set('DAY_FEED')"
              class="px-3.5 py-1.5 rounded-xl font-label-ui text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              [class]="
                isFeedView()
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              "
            >
              <span class="material-symbols-rounded text-base">format_list_bulleted</span>
              <span>📋 Хроника Дня</span>
            </button>
          </div>
        </div>

        <!-- Filter Action Types & Subtitle -->
        <div class="flex items-center justify-between gap-3 pt-3 border-t border-outline-variant/20 flex-wrap">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="font-label-ui text-xs font-bold text-on-surface-variant uppercase tracking-wider mr-1">
              Фильтр записей:
            </span>
            <button
              type="button"
              (click)="activeLayer.set('ALL')"
              class="px-3 py-1 rounded-xl font-label-ui text-xs font-semibold transition-colors border cursor-pointer"
              [class]="
                activeLayer() === 'ALL'
                  ? 'bg-primary-container text-on-primary-container border-primary font-bold shadow-xs'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface border-outline-variant/25'
              "
            >
              Все ({{ activeDateNotes().length }})
            </button>

            <button
              type="button"
              (click)="activeLayer.set('THOUGHTS')"
              class="px-3 py-1 rounded-xl font-label-ui text-xs font-semibold transition-colors border cursor-pointer"
              [class]="
                activeLayer() === 'THOUGHTS'
                  ? 'bg-amber-400/20 text-amber-900 dark:text-amber-200 border-amber-400 font-bold shadow-xs'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface border-outline-variant/25'
              "
            >
              💭 Мысли ({{ noteCountsByType().thought }})
            </button>

            <button
              type="button"
              (click)="activeLayer.set('PROPOSALS')"
              class="px-3 py-1 rounded-xl font-label-ui text-xs font-semibold transition-colors border cursor-pointer"
              [class]="
                activeLayer() === 'PROPOSALS'
                  ? 'bg-emerald-500/20 text-emerald-900 dark:text-emerald-200 border-emerald-500 font-bold shadow-xs'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface border-outline-variant/25'
              "
            >
              💡 Предложения ({{ noteCountsByType().proposal }})
            </button>

            <button
              type="button"
              (click)="activeLayer.set('ACTIONS')"
              class="px-3 py-1 rounded-xl font-label-ui text-xs font-semibold transition-colors border cursor-pointer"
              [class]="
                activeLayer() === 'ACTIONS'
                  ? 'bg-indigo-500/20 text-indigo-900 dark:text-indigo-200 border-indigo-500 font-bold shadow-xs'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface border-outline-variant/25'
              "
            >
              ⚡ Экшены ({{ noteCountsByType().action }})
            </button>
          </div>

          <div class="text-[11px] font-label-code-sm text-on-surface-variant flex items-center gap-2">
            <span>{{ visibleNotes().length }} записей отображается</span>
            <span class="text-outline">·</span>
            <span>Кликните по таймлайну внизу для выбора часа</span>
          </div>
        </div>

        <!-- CHARACTER FOCUS STRIP: QUICK SELECT HERO OR OPEN PERSONAL 3-TIER WORKSPACE -->
        <div class="flex items-center gap-2 pt-2.5 border-t border-outline-variant/15 overflow-x-auto py-1">
          <span class="font-label-ui text-xs font-bold text-on-surface-variant uppercase tracking-wider flex-shrink-0 flex items-center gap-1">
            <span class="material-symbols-rounded text-sm text-primary">person_search</span>
            <span>Герой в облаке:</span>
          </span>

          <button
            type="button"
            (click)="selectActorFilter(null)"
            class="px-3 py-1 rounded-xl text-xs font-label-ui font-bold border transition-colors flex-shrink-0 cursor-pointer"
            [class]="
              selectedActorFilter() === null
                ? 'bg-primary text-on-primary border-primary shadow-xs'
                : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface border-outline-variant/30'
            "
          >
            Все герои ({{ allActors().length }})
          </button>

          @for (actor of allActors(); track actor.id) {
            <button
              type="button"
              (click)="selectActorFilter(actor.id)"
              class="px-2.5 py-1 rounded-xl text-xs font-label-ui font-semibold border transition-colors inline-flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
              [class]="
                selectedActorFilter() === actor.id
                  ? 'bg-primary text-on-primary border-primary shadow-xs font-bold'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface border-outline-variant/30 hover:bg-surface-container'
              "
            >
              <app-actor-avatar [avatar]="actor.avatarIcon" containerClass="w-4 h-4 rounded-full flex-shrink-0" />
              <span>{{ actor.name }}</span>
              @if (actorNotesCountMap()[actor.id]; as aCount) {
                @if (aCount > 0) {
                  <span
                    class="text-[9px] px-1.5 py-0.2 rounded-full font-mono"
                    [class]="selectedActorFilter() === actor.id ? 'bg-on-primary/25 text-on-primary' : 'bg-surface-container-highest text-primary font-bold'"
                  >
                    {{ aCount }}
                  </span>
                }
              }
            </button>
          }
        </div>

        <!-- FOCUSED CHARACTER CLOUD WORKSPACE CALLOUT BANNER -->
        @if (filteredActor(); as fActor) {
          <div class="p-3 rounded-2xl bg-primary-container/20 border border-primary/30 flex items-center justify-between gap-3 flex-wrap">
            <div class="flex items-center gap-3 min-w-0">
              <app-actor-avatar [avatar]="fActor.avatarIcon" containerClass="w-10 h-10 rounded-2xl shadow-xs ring-2 ring-primary/40 flex-shrink-0" />
              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <h3 class="font-headline-sm text-sm font-bold text-on-surface truncate">
                    Фокус облака: {{ fActor.name }}
                  </h3>
                  <span class="font-label-code-sm text-[10px] px-2 py-0.5 rounded-full font-bold uppercase" [class]="getAccentPillClasses(fActor.accentColor)">
                    {{ fActor.categoryLabel }}
                  </span>
                </div>
                <p class="font-body-sm text-[11px] text-on-surface-variant truncate">
                  Показаны мысли героя. Вы можете открыть персональный Workspace героя с 3 уровнями (Public, Private, Архаичный лор).
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="openCharacterWorkspace(fActor)"
                class="px-3.5 py-1.5 rounded-xl bg-primary text-on-primary font-label-ui text-xs font-bold shadow-xs hover:opacity-95 transition-opacity inline-flex items-center gap-1.5 cursor-pointer"
                title="Открыть персональный Workspace героя (3 уровня: Public, Private, Архаичный лор)"
              >
                <span class="material-symbols-rounded text-sm">cloud</span>
                <span>☁️ Открыть Workspace героя</span>
              </button>

              <button
                type="button"
                (click)="selectActorFilter(null)"
                class="px-2.5 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-ui text-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                title="Сбросить фильтр и показать всех персонажей"
              >
                <span class="material-symbols-rounded text-sm">close</span>
                <span>Все</span>
              </button>
            </div>
          </div>
        }
      </section>

      <!-- 3. MAIN CARTOON CLOUD STAGE (STATIC CONTAINER, BOTTOM TIMELINE WITH CANDLESTICK COLUMNS) -->
      @if (isCloudView()) {
        <div
          class="relative w-full rounded-[44px] bg-gradient-to-b from-sky-100/70 via-amber-50/40 to-sky-100/50 dark:from-slate-950 dark:via-[#161b2b] dark:to-slate-900 border-3 border-amber-300/50 dark:border-amber-400/25 p-4 sm:p-6 lg:p-8 overflow-hidden shadow-xl isolate select-none"
        >
          <!-- Background Atmospheric Sparks & Companion Clouds (Static) -->
          <div class="absolute top-4 left-6 pointer-events-none opacity-40">
            <span class="text-4xl">☁️</span>
          </div>
          <div class="absolute top-8 right-12 pointer-events-none opacity-35">
            <span class="text-3xl">✨</span>
          </div>
          <div class="absolute bottom-6 left-16 pointer-events-none opacity-30">
            <span class="text-2xl">⭐</span>
          </div>

          <!-- THE GRAND FLUFFY CARTOON CLOUD CONTAINER (STATIC - CRISP & HIGH PERFORMANCE) -->
          <div
            class="relative w-full min-h-[640px] bg-white dark:bg-[#1b1e2a] rounded-[48px] border-4 border-amber-300 dark:border-amber-400/50 shadow-xl p-5 sm:p-7 flex flex-col justify-between overflow-x-auto"
          >
            <!-- Decorative Puffy Lobes on Top of Cloud (Static SVG/CSS) -->
            <div class="absolute -top-6 left-12 w-20 h-14 bg-white dark:bg-[#1b1e2a] rounded-t-full border-t-4 border-l-4 border-r-4 border-amber-300 dark:border-amber-400/50 pointer-events-none"></div>
            <div class="absolute -top-10 left-36 w-32 h-20 bg-white dark:bg-[#1b1e2a] rounded-t-full border-t-4 border-l-4 border-r-4 border-amber-300 dark:border-amber-400/50 pointer-events-none"></div>
            <div class="absolute -top-7 right-32 w-24 h-16 bg-white dark:bg-[#1b1e2a] rounded-t-full border-t-4 border-l-4 border-r-4 border-amber-300 dark:border-amber-400/50 pointer-events-none"></div>

            <!-- In-Cloud Header Strip -->
            <div class="relative z-10 flex items-center justify-between gap-3 border-b border-amber-200/60 dark:border-outline-variant/30 pb-3 flex-wrap">
              <div class="flex items-center gap-2.5">
                <div class="w-10 h-10 rounded-2xl bg-amber-400/25 text-amber-800 dark:text-amber-300 flex items-center justify-center text-xl shadow-xs">
                  ☁️
                </div>
                <div>
                  <h2 class="font-headline-sm text-base sm:text-lg font-black text-on-surface">
                    Хроно-Облако Дня: {{ activeDateFormatted() }}
                  </h2>
                  <p class="font-body-sm text-[11px] text-on-surface-variant">
                    Таймлайн мыслей и предложений с 08:00 до 24:00 · График временных столбцов
                  </p>
                </div>
              </div>

              <!-- Day Mood & Vibe Badges -->
              <div class="flex items-center gap-2 flex-wrap">
                <!-- Vibe Selector Button -->
                <button
                  type="button"
                  (click)="toggleVibePicker()"
                  class="px-3 py-1.5 rounded-full bg-surface-container-high/90 hover:bg-surface-container-highest text-on-surface border border-outline-variant/30 text-xs font-bold font-label-ui flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  title="Настроить вайб и атмосферный фон дня"
                >
                  <span>{{ currentVibe().icon }}</span>
                  <span>Вайб: {{ currentVibe().name.split(' (')[0] }}</span>
                  <span class="material-symbols-rounded text-sm text-outline">tune</span>
                </button>

                <!-- Synergy Badge -->
                <span class="px-3 py-1.5 rounded-full bg-amber-400/15 text-amber-800 dark:text-amber-300 border border-amber-400/30 text-xs font-bold font-label-code-sm flex items-center gap-1.5 shadow-2xs">
                  <span class="text-sm">☀️</span>
                  <span>{{ synergyPercent() }}% Синергия</span>
                </span>
              </div>
            </div>

            <!-- CENTRAL IN-CLOUD TIMELINE SKY (CANDLESTICK STEM CHART WITH ATMOSPHERIC DAY SECTORS) -->
            <div class="cloud-sky-canvas relative z-10 flex-1 my-4 min-h-[520px] flex flex-col justify-end min-w-[920px] px-8 pb-3 pt-4 rounded-3xl overflow-hidden border border-outline-variant/20 shadow-inner isolate">
              <!-- 1. DYNAMIC SKY GRADIENT & TIME-OF-DAY ATMOSPHERIC SECTORS -->
              <div class="absolute inset-0 pointer-events-none -z-10" [class]="currentVibe().skyGradient">
                <!-- Ambient sky lighting wash -->
                <div class="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/40 dark:to-slate-950/50"></div>

                <!-- TIME OF DAY DIVIDERS WITH DASHED MERIDIANS & SECTOR CHIPS -->
                <!-- Sector 1: Morning (08:00 — 12:00 = 25% width) -->
                <div class="absolute inset-y-0 left-0 w-[25%] flex flex-col justify-between p-3 border-r-2 border-dashed border-amber-500/35 pointer-events-none">
                  <div class="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-900 dark:text-amber-200 border border-amber-400/40 text-[10px] font-bold font-label-code-sm self-start shadow-2xs">
                    <span>🌅</span>
                    <span>Утро (08:00 — 12:00)</span>
                  </div>
                  <div class="text-3xl opacity-15 self-center mb-16 select-none">{{ currentVibe().atmosphereEmoji[0] }}</div>
                </div>

                <!-- Sector 2: Midday / Afternoon (12:00 — 17:00 = 31.25% width) -->
                <div class="absolute inset-y-0 left-[25%] w-[31.25%] flex flex-col justify-between p-3 border-r-2 border-dashed border-sky-500/35 pointer-events-none">
                  <div class="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-400/20 text-sky-900 dark:text-sky-200 border border-sky-400/40 text-[10px] font-bold font-label-code-sm self-start shadow-2xs">
                    <span>☀️</span>
                    <span>День (12:00 — 17:00)</span>
                  </div>
                  <div class="text-3xl opacity-15 self-center mb-16 select-none">{{ currentVibe().atmosphereEmoji[1] }}</div>
                </div>

                <!-- Sector 3: Evening / Sunset (17:00 — 21:00 = 25% width) -->
                <div class="absolute inset-y-0 left-[56.25%] w-[25%] flex flex-col justify-between p-3 border-r-2 border-dashed border-purple-500/35 pointer-events-none">
                  <div class="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-400/20 text-purple-900 dark:text-purple-200 border border-purple-400/40 text-[10px] font-bold font-label-code-sm self-start shadow-2xs">
                    <span>🌆</span>
                    <span>Вечер (17:00 — 21:00)</span>
                  </div>
                  <div class="text-3xl opacity-15 self-center mb-16 select-none">{{ currentVibe().atmosphereEmoji[2] }}</div>
                </div>

                <!-- Sector 4: Night / Starlight (21:00 — 24:00 = 18.75% width) -->
                <div class="absolute inset-y-0 left-[81.25%] right-0 flex flex-col justify-between p-3 pointer-events-none">
                  <div class="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-900 dark:text-indigo-200 border border-indigo-400/40 text-[10px] font-bold font-label-code-sm self-start shadow-2xs">
                    <span>🌙</span>
                    <span>Ночь (21:00 — 24:00)</span>
                  </div>
                  <div class="text-3xl opacity-15 self-center mb-16 select-none">{{ currentVibe().atmosphereEmoji[3] }}</div>
                </div>
              </div>

              <!-- CANDLESTICK TIME GRID COLUMNS (BACKGROUND SUBTLE TICKS) -->
              <div class="absolute inset-0 bottom-16 flex pointer-events-none opacity-20 -z-5">
                @for (m of hourMilestones; track m.label; let midx = $index) {
                  <div
                    class="h-full border-r border-dotted border-outline-variant/40 flex-1 relative flex flex-col justify-between"
                  >
                    <span class="text-[9px] font-mono text-outline/60 p-2 font-semibold">{{ m.label }}</span>
                  </div>
                }
              </div>

              <!-- FLOATING THOUGHTS ANCHORED BY VERTICAL CANDLESTICK COLUMNS (WITH 30-MIN STACK CLUSTERING) -->
              @for (cluster of groupedTimelineNotes(); track cluster.id; let idx = $index) {
                @if (getClusterActiveNote(cluster); as note) {
                  <div
                    class="absolute bottom-11 -translate-x-1/2 flex flex-col items-center group z-10 hover:z-30 pointer-events-none"
                    [style.left.%]="getTimelinePercent(cluster.timeMinutes)"
                  >
                    <!-- 1. THOUGHT / PROPOSAL BUBBLE (FLOATING IN THE AIR WITH CARD STACK) -->
                    <div class="relative w-[230px] sm:w-[265px] pointer-events-auto thought-pop">
                      <!-- Back Stack Layer 2 (If 3+ notes in cluster) -->
                      @if (cluster.isCluster && cluster.notes.length > 2) {
                        <div
                          class="absolute inset-0 rounded-2xl bg-amber-100/80 dark:bg-slate-700/80 border-2 border-outline-variant/30 shadow-2xs pointer-events-none -translate-x-1.5 translate-y-2.5 -rotate-2 -z-20 transition-transform duration-150 group-hover:-translate-x-2.5 group-hover:translate-y-3.5"
                        ></div>
                      }

                      <!-- Back Stack Layer 1 (If cluster) -->
                      @if (cluster.isCluster) {
                        <div
                          class="absolute inset-0 rounded-2xl bg-white/90 dark:bg-slate-800/90 border-2 border-outline-variant/40 shadow-xs pointer-events-none translate-x-1.5 translate-y-1.5 rotate-2 -z-10 transition-transform duration-150 group-hover:translate-x-2.5 group-hover:translate-y-2.5"
                        ></div>
                      }

                      <!-- Main Active Note Card (GPU-composited transform on hover, no backdrop-blur or box-shadow interpolation) -->
                      <div
                        (click)="inspectNote(note)"
                        class="relative p-3 rounded-2xl bg-white dark:bg-slate-800 shadow-md group-hover:shadow-lg group-hover:-translate-y-0.5 group-hover:scale-[1.03] transition-transform duration-150 ease-out will-change-transform border-2 w-full cursor-pointer"
                        [class]="getNoteBorderClass(note.actorAccent)"
                      >
                        <!-- Mini Header: Avatar + Name + Stack Paginator + Emoji -->
                        <div class="flex items-center gap-1.5 mb-1.5">
                          <div class="flex items-center -space-x-2 flex-shrink-0">
                            <app-actor-avatar
                              [avatar]="note.actorAvatar"
                              containerClass="w-7 h-7 rounded-xl shadow-xs ring-2 ring-surface z-10 flex-shrink-0"
                            />
                            @if (note.subActorAvatar) {
                              <app-actor-avatar
                                [avatar]="note.subActorAvatar"
                                containerClass="w-7 h-7 rounded-xl shadow-xs ring-2 ring-amber-500/50 z-20 flex-shrink-0"
                                [title]="'Субперсонаж: ' + note.subActorName"
                              />
                            }
                          </div>
                          <div class="flex flex-col truncate min-w-0 flex-1">
                            <div class="flex items-center gap-1 truncate">
                              <span class="text-xs font-bold text-on-surface truncate">{{ note.actorName }}</span>
                              @if (note.subActorName) {
                                <span class="text-[10px] text-primary font-black">&</span>
                                <span class="text-xs font-bold text-primary truncate" [title]="'Субперсонаж: ' + note.subActorName">{{ note.subActorName }}</span>
                              }
                            </div>
                            <span class="text-[10px] font-mono text-outline font-semibold">{{ note.time }}</span>
                          </div>

                          <!-- Mini Stack Paginator -->
                          @if (cluster.isCluster) {
                            <div
                              (click)="$event.stopPropagation()"
                              class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/15 dark:bg-amber-400/20 text-amber-800 dark:text-amber-300 font-mono text-[10px] font-bold shadow-2xs flex-shrink-0 select-none"
                              [title]="'Стопка: 30-минутное окно (' + cluster.notes.length + ' мыслей)'"
                            >
                              <button
                                type="button"
                                (click)="prevClusterNote(cluster.id, cluster.notes.length, $event)"
                                class="w-4 h-4 rounded hover:bg-amber-500/30 flex items-center justify-center transition-colors cursor-pointer text-xs font-black"
                                title="Предыдущая мысль в стопке"
                              >
                                ‹
                              </button>
                              <span class="px-0.5">{{ getClusterActiveIndex(cluster.id) + 1 }}/{{ cluster.notes.length }}</span>
                              <button
                                type="button"
                                (click)="nextClusterNote(cluster.id, cluster.notes.length, $event)"
                                class="w-4 h-4 rounded hover:bg-amber-500/30 flex items-center justify-center transition-colors cursor-pointer text-xs font-black"
                                title="Следующая мысль в стопке"
                              >
                                ›
                              </button>
                            </div>
                          }

                          <span class="ml-0.5 text-sm flex-shrink-0" [title]="getTypeLabel(note.type)">
                            {{ getTypeEmoji(note.type) }}
                          </span>
                        </div>

                        <!-- Reply Context Badge (if note is a reply) -->
                        @if (note.replyToAuthorName) {
                          <div
                            (click)="jumpToRepliedNote(note.replyToNoteId, $event)"
                            class="flex items-center gap-1 px-2 py-0.5 mb-1.5 rounded-lg bg-surface-container-high/60 border-l-2 border-primary text-[10px] text-on-surface-variant font-label-ui truncate cursor-pointer hover:bg-surface-container-high transition-colors"
                            [title]="'Ответ на мысль: ' + note.replyToAuthorName + (note.replyToTextSnippet ? ' — ' + note.replyToTextSnippet : '') + '. Нажмите, чтобы перейти.'"
                          >
                            <span class="material-symbols-rounded text-xs text-primary flex-shrink-0">reply</span>
                            <span class="font-bold text-on-surface truncate">Ответ: {{ note.replyToAuthorName }}</span>
                            @if (note.replyToTextSnippet) {
                              <span class="truncate italic opacity-85">«{{ note.replyToTextSnippet }}»</span>
                            }
                          </div>
                        }

                        <!-- Thought Text -->
                        <p class="text-xs font-body-sm text-on-surface leading-snug line-clamp-3 italic min-h-[2.5rem]">
                          «{{ note.text }}»
                        </p>

                        <!-- Bubble Footer with Personalized Likes, Stack Indicators & Delete -->
                        <div class="flex items-center justify-between gap-1 mt-2 pt-1.5 border-t border-outline-variant/20 flex-wrap">
                          <!-- Personalized Likes Section -->
                          <div class="flex items-center gap-1 min-w-0" (click)="$event.stopPropagation()">
                            <!-- Like Heart Toggle Button -->
                            <button
                              type="button"
                              (click)="voteForNote(note.id, $event)"
                              class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold font-label-code-sm transition-all active:scale-95 cursor-pointer border"
                              [class]="
                                hasActorLiked(note)
                                  ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 border-rose-500/30'
                                  : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                              "
                              [title]="
                                hasActorLiked(note)
                                  ? 'Вы оценили мысль (нажмите чтобы снять лайк)'
                                  : 'Поддержать мысль персонажа (+1)'
                              "
                            >
                              <span class="text-xs transition-transform" [class.scale-110]="hasActorLiked(note)">
                                {{ hasActorLiked(note) ? '❤️' : '❤️' }}
                              </span>
                              <span>{{ getResolvedLikes(note).length || note.votesCount || 0 }}</span>
                            </button>

                            <!-- Visible Character Avatars (Overlapping circular stack) -->
                            @if (getVisibleLikes(note).length > 0) {
                              <div class="flex items-center -space-x-1.5 overflow-visible pl-0.5">
                                @for (like of getVisibleLikes(note); track like.actorId) {
                                  <div
                                    class="relative group/avatar cursor-pointer"
                                    [title]="'Лайк от: ' + like.actorName"
                                  >
                                    <div class="w-5 h-5 rounded-full ring-2 ring-white dark:ring-slate-800 shadow-2xs overflow-hidden flex items-center justify-center bg-surface-container">
                                      <app-actor-avatar [avatar]="like.avatarIcon || 'person'" containerClass="w-full h-full" />
                                    </div>
                                    <!-- Tiny Tooltip on Hover for individual avatar -->
                                    <div
                                      class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/avatar:flex flex-col items-center pointer-events-none z-50 whitespace-nowrap animate-fadeIn"
                                    >
                                      <div class="px-2 py-0.5 rounded-md bg-slate-900/90 text-white text-[9px] font-medium shadow-md">
                                        {{ like.actorName }}
                                      </div>
                                      <div class="w-1.5 h-1.5 bg-slate-900/90 rotate-45 -mt-0.5"></div>
                                    </div>
                                  </div>
                                }
                              </div>
                            }

                            <!-- Collapsed Remaining Likes Badge (+ N лайка) with Hover Tooltip Popover -->
                            @if (getHiddenLikes(note).length > 0) {
                              <div class="relative group/hiddenlikes inline-flex items-center">
                                <button
                                  type="button"
                                  (click)="inspectNote(note); $event.stopPropagation()"
                                  class="px-1.5 py-0.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary font-label-code-sm text-[10px] font-bold border border-primary/25 cursor-pointer transition-all select-none hover:scale-105 active:scale-95"
                                  [title]="getHiddenLikesTooltip(note)"
                                >
                                  +{{ getHiddenLikes(note).length }} {{ getLikesWord(getHiddenLikes(note).length) }}
                                </button>

                                <!-- Rich Hover Popover showing all remaining characters -->
                                <div
                                  class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/hiddenlikes:flex flex-col rounded-xl bg-slate-900/95 dark:bg-slate-950/95 text-white p-2 shadow-2xl border border-slate-700/60 z-50 min-w-[150px] max-w-[210px] pointer-events-none animate-fadeIn backdrop-blur-md"
                                >
                                  <div class="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between border-b border-slate-700/60 pb-1">
                                    <span>Ещё оценили:</span>
                                    <span class="text-primary font-mono font-bold">+{{ getHiddenLikes(note).length }}</span>
                                  </div>
                                  <div class="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto pr-0.5">
                                    @for (hiddenLike of getHiddenLikes(note); track hiddenLike.actorId) {
                                      <div class="flex items-center gap-1.5 text-[10px] leading-tight">
                                        <div class="w-4 h-4 rounded-full ring-1 ring-white/20 overflow-hidden flex-shrink-0 bg-slate-800">
                                          <app-actor-avatar [avatar]="hiddenLike.avatarIcon || 'person'" containerClass="w-full h-full" />
                                        </div>
                                        <span class="font-medium truncate text-slate-100">{{ hiddenLike.actorName }}</span>
                                      </div>
                                    }
                                  </div>
                                  <!-- Little bottom arrow -->
                                  <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900/95 dark:bg-slate-950/95 rotate-45 border-b border-r border-slate-700/60"></div>
                                </div>
                              </div>
                            }
                          </div>

                          <!-- Dot indicators for direct jumps inside stack -->
                          @if (cluster.isCluster) {
                            <div class="flex items-center gap-1" (click)="$event.stopPropagation()">
                              @for (item of cluster.notes; track item.id; let dotIdx = $index) {
                                <button
                                  type="button"
                                  (click)="setClusterIndex(cluster.id, dotIdx, $event)"
                                  class="h-1.5 rounded-full transition-colors cursor-pointer"
                                  [class]="dotIdx === getClusterActiveIndex(cluster.id) ? 'w-3.5 bg-amber-500' : 'w-1.5 bg-outline-variant/60 hover:bg-outline-variant'"
                                  [title]="'Мысль ' + (dotIdx + 1) + ': ' + item.actorName + ' (' + item.time + ')'"
                                ></button>
                              }
                            </div>
                          }

                          <!-- Reply Button & Thread Count -->
                          <div class="flex items-center gap-1" (click)="$event.stopPropagation()">
                            <button
                              type="button"
                              (click)="startReply(note, $event)"
                              class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold text-outline hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                              title="Ответить на мысль (реплей)"
                            >
                              <span class="material-symbols-rounded text-xs">reply</span>
                              <span>Ответить</span>
                            </button>

                            @if (getRepliesForNote(note.id).length > 0) {
                              <span
                                class="inline-flex items-center gap-0.5 text-[9px] font-bold text-primary font-mono bg-primary/10 px-1 rounded"
                                [title]="'Ответов на эту мысль: ' + getRepliesForNote(note.id).length"
                              >
                                <span class="material-symbols-rounded text-[11px]">forum</span>
                                <span>{{ getRepliesForNote(note.id).length }}</span>
                              </span>
                            }
                          </div>

                          <button
                            type="button"
                            (click)="deleteNote(note.id, $event)"
                            class="opacity-0 group-hover:opacity-100 p-0.5 rounded text-outline hover:text-rose-500 transition-opacity cursor-pointer"
                            title="Удалить мысль"
                          >
                            <span class="material-symbols-rounded text-sm">close</span>
                          </button>
                        </div>

                        <!-- Triangular bottom tail pointing to candlestick column -->
                        <div
                          class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-slate-800 rotate-45 border-b-2 border-r-2"
                          [class]="getNoteBorderClass(note.actorAccent)"
                        ></div>
                      </div>
                    </div>

                    <!-- 2. VERTICAL CANDLESTICK COLUMN / STEM (CONNECTS BUBBLE DOWN TO TIMELINE) -->
                    <div
                      class="w-1.5 rounded-full transition-transform duration-150 ease-out group-hover:scale-x-150 will-change-transform shadow-xs my-0.5 pointer-events-none"
                      [class]="getAccentStemClasses(note.actorAccent)"
                      [style.height.px]="getNoteStemHeight(idx)"
                    ></div>

                    <!-- 3. BASE PIN ON THE TIMELINE ROAD -->
                    <div class="flex flex-col items-center pointer-events-auto cursor-pointer" (click)="inspectNote(note)">
                      <div
                        class="rounded-full ring-2 ring-white dark:ring-slate-900 shadow-xs flex items-center justify-center transition-transform duration-150 group-hover:scale-125"
                        [class]="getClusterPinClasses(cluster.isCluster, note.actorAccent)"
                      >
                        @if (cluster.isCluster) {
                          <span>{{ cluster.notes.length }}</span>
                        } @else {
                          <span class="w-1.5 h-1.5 rounded-full bg-white"></span>
                        }
                      </div>
                      <span class="text-[9px] font-mono font-bold text-on-surface-variant bg-white/95 dark:bg-slate-900/95 px-1 py-0.2 rounded shadow-2xs mt-0.5 whitespace-nowrap">
                        {{ cluster.time }}
                      </span>
                    </div>
                  </div>
                }
              }

              <!-- THE BOTTOM TIMELINE AXIS (TRADING CHART FLOOR) -->
              <div class="relative w-full mt-auto pt-8 pb-1">
                <!-- Horizontal Road Bar -->
                <div
                  (click)="onTimelineRoadClick($event)"
                  class="relative w-full h-5 rounded-full bg-gradient-to-r from-amber-400 via-orange-300 via-sky-400 to-indigo-500 shadow-inner flex items-center cursor-pointer group"
                  title="Кликните в любую точку шкалы, чтобы выбрать время для мысли"
                >
                  <!-- Dashed Center Lane of Cartoon Road -->
                  <div class="absolute inset-x-2 border-t-2 border-dashed border-white/70 pointer-events-none"></div>

                  <!-- Milestone Hour Nodes Along Road -->
                  @for (m of hourMilestones; track m.label) {
                    <div
                      class="absolute -translate-x-1/2 flex flex-col items-center pointer-events-none"
                      [style.left.%]="getTimelinePercent(m.minutes)"
                    >
                      <div class="w-3.5 h-3.5 rounded-full bg-white dark:bg-slate-900 border-2 border-amber-600 shadow-xs"></div>
                      <span class="text-[10px] font-mono font-bold text-on-surface-variant mt-2 whitespace-nowrap bg-white/95 dark:bg-slate-900/95 px-1.5 py-0.2 rounded-md shadow-2xs">
                        {{ m.icon }} {{ m.label }}
                      </span>
                    </div>
                  }

                  <!-- "СЕЙЧАС" (NOW) INDICATOR PIN -->
                  @if (isTodaySelected()) {
                    <div
                      class="absolute -translate-x-1/2 flex flex-col items-center pointer-events-none z-20"
                      [style.left.%]="nowTimePercent()"
                    >
                      <!-- Vertical dashed line rising through the sky -->
                      <div class="w-0.5 h-80 border-l-2 border-dashed border-amber-500/50 -mb-2"></div>
                      <div class="w-6 h-6 rounded-full bg-amber-400 border-2 border-white shadow-md flex items-center justify-center text-xs now-sun-glow">
                        ☀️
                      </div>
                      <span class="text-[9px] font-label-code-sm font-extrabold text-amber-900 dark:text-amber-200 bg-amber-300 dark:bg-amber-600 px-1.5 py-0.2 rounded-full shadow-xs -mt-1 whitespace-nowrap">
                        Сейчас {{ nowTimeText() }}
                      </span>
                    </div>
                  }
                </div>
              </div>
            </div>

            <!-- In-Cloud Bottom Info Strip -->
            <div class="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-amber-200/50 dark:border-outline-variant/30 text-xs text-on-surface-variant">
              <div class="flex items-center gap-2">
                <span class="text-base">✨</span>
                <span>Каждая мысль прикреплена столбцом ко времени на нижней линии. Кликните по линии времени для выбора часа.</span>
              </div>
              <div class="flex items-center gap-2 font-mono text-[11px] font-bold text-amber-800 dark:text-amber-300">
                <span>Хроно-Шкала: 08:00 — 24:00</span>
              </div>
            </div>
          </div>
        </div>
      } @else {
        <!-- 4. CHRONOLOGICAL DAY FEED (ALTERNATIVE LIST VIEW) -->
        <div class="flex flex-col gap-4">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            @for (period of dayPeriods; track period.id) {
              @if (notesByPeriod()[period.id]; as periodNotes) {
                <div class="bg-surface-container-lowest rounded-3xl p-5 shadow-xs border border-outline-variant/30 flex flex-col justify-between min-h-[440px]">
                  <div class="flex flex-col gap-3">
                    <div class="flex items-center justify-between border-b border-outline-variant/20 pb-2.5">
                      <div class="flex items-center gap-1.5">
                        <span class="text-lg">{{ period.icon }}</span>
                        <h3 class="font-headline-sm text-sm font-bold text-on-surface">{{ period.title }}</h3>
                      </div>
                      <span class="font-mono text-[10px] text-outline font-semibold">{{ period.hours }}</span>
                    </div>

                    <!-- Notes in this Period -->
                    <div class="flex flex-col gap-2.5 overflow-y-auto max-h-[320px] pr-1">
                      @for (note of periodNotes; track note.id) {
                        <div
                          class="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/30 hover:border-primary/50 transition-colors flex flex-col gap-2"
                        >
                          <div class="flex items-center justify-between gap-2">
                            <div class="flex items-center gap-2 truncate">
                              <div class="flex items-center -space-x-1.5 flex-shrink-0">
                                <app-actor-avatar
                                  [avatar]="note.actorAvatar"
                                  containerClass="w-6 h-6 rounded-lg ring-1 ring-outline-variant/30 z-10 flex-shrink-0"
                                />
                                @if (note.subActorAvatar) {
                                  <app-actor-avatar
                                    [avatar]="note.subActorAvatar"
                                    containerClass="w-6 h-6 rounded-lg ring-1 ring-amber-500/50 z-20 flex-shrink-0"
                                    [title]="'Субперсонаж: ' + note.subActorName"
                                  />
                                }
                              </div>
                              <div class="flex items-center gap-1 truncate">
                                <span class="text-xs font-bold text-on-surface truncate">{{ note.actorName }}</span>
                                @if (note.subActorName) {
                                  <span class="text-[10px] text-primary font-black">&</span>
                                  <span class="text-xs font-bold text-primary truncate" [title]="'Субперсонаж: ' + note.subActorName">{{ note.subActorName }}</span>
                                }
                              </div>
                            </div>
                            <span class="font-mono text-[10px] text-outline">{{ note.time }}</span>
                          </div>

                          <!-- Reply Context Badge (if note is a reply) -->
                          @if (note.replyToAuthorName) {
                            <div
                              (click)="jumpToRepliedNote(note.replyToNoteId, $event)"
                              class="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface-container-high/60 border-l-2 border-primary text-[10px] text-on-surface-variant font-label-ui truncate cursor-pointer hover:bg-surface-container-high transition-colors"
                              [title]="'Ответ на мысль: ' + note.replyToAuthorName + (note.replyToTextSnippet ? ' — ' + note.replyToTextSnippet : '')"
                            >
                              <span class="material-symbols-rounded text-xs text-primary flex-shrink-0">reply</span>
                              <span class="font-bold text-on-surface truncate">Ответ для {{ note.replyToAuthorName }}:</span>
                              @if (note.replyToTextSnippet) {
                                <span class="truncate italic opacity-85">«{{ note.replyToTextSnippet }}»</span>
                              }
                            </div>
                          }

                          <p class="text-xs font-body-sm text-on-surface italic leading-snug">
                            «{{ note.text }}»
                          </p>

                          @if (note.subActorName) {
                            <div class="flex items-center gap-1 text-[10px] font-label-code-sm text-amber-800 dark:text-amber-200">
                              <span>🎭</span>
                              <span class="font-bold">Субперсонаж: {{ note.subActorName }}</span>
                            </div>
                          }

                          <div class="flex items-center justify-between pt-1 border-t border-outline-variant/15 text-[11px] gap-1 flex-wrap">
                            <div class="flex items-center gap-1.5" (click)="$event.stopPropagation()">
                              <span class="font-label-code-sm text-[10px] text-outline uppercase">{{ getTypeLabel(note.type) }}</span>
                              <button
                                type="button"
                                (click)="startReply(note, $event)"
                                class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold text-outline hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                                title="Ответить на мысль (реплей)"
                              >
                                <span class="material-symbols-rounded text-xs">reply</span>
                                <span>Ответить</span>
                              </button>
                              @if (getRepliesForNote(note.id).length > 0) {
                                <span
                                  class="inline-flex items-center gap-0.5 text-[9px] font-bold text-primary font-mono bg-primary/10 px-1 rounded"
                                  [title]="'Ответов на эту мысль: ' + getRepliesForNote(note.id).length"
                                >
                                  <span class="material-symbols-rounded text-[11px]">forum</span>
                                  <span>{{ getRepliesForNote(note.id).length }}</span>
                                </span>
                              }
                            </div>

                            <div class="flex items-center gap-1.5" (click)="$event.stopPropagation()">
                              <button
                                type="button"
                                (click)="voteForNote(note.id, $event)"
                                class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold font-label-code-sm transition-all active:scale-95 cursor-pointer border"
                                [class]="
                                  hasActorLiked(note)
                                    ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
                                    : 'bg-surface-container-high/80 text-outline hover:text-rose-600 border-outline-variant/30'
                                "
                                [title]="hasActorLiked(note) ? 'Снять лайк' : 'Поставить лайк'"
                              >
                                <span>{{ hasActorLiked(note) ? '❤️' : '❤️' }}</span>
                                <span>{{ getResolvedLikes(note).length || note.votesCount || 0 }}</span>
                              </button>

                              @if (getVisibleLikes(note).length > 0) {
                                <div class="flex items-center -space-x-1.5">
                                  @for (like of getVisibleLikes(note); track like.actorId) {
                                    <div class="w-4 h-4 rounded-full ring-1 ring-white dark:ring-slate-800 shadow-2xs overflow-hidden" [title]="'Лайк от: ' + like.actorName">
                                      <app-actor-avatar [avatar]="like.avatarIcon || 'person'" containerClass="w-full h-full" />
                                    </div>
                                  }
                                </div>
                              }

                              @if (getHiddenLikes(note).length > 0) {
                                <div class="relative group/slotlikes inline-flex items-center">
                                  <span
                                    class="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-label-code-sm text-[10px] font-bold border border-primary/25 cursor-help"
                                    [title]="getHiddenLikesTooltip(note)"
                                  >
                                    +{{ getHiddenLikes(note).length }} {{ getLikesWord(getHiddenLikes(note).length) }}
                                  </span>
                                  <div
                                    class="absolute bottom-full right-0 mb-1.5 hidden group-hover/slotlikes:flex flex-col rounded-xl bg-slate-900/95 dark:bg-slate-950/95 text-white p-2 shadow-2xl border border-slate-700/60 z-50 min-w-[140px] pointer-events-none animate-fadeIn backdrop-blur-md"
                                  >
                                    <div class="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1 border-b border-slate-700/60 pb-1">
                                      Оценили (+{{ getHiddenLikes(note).length }}):
                                    </div>
                                    <div class="flex flex-col gap-1 max-h-[120px] overflow-y-auto">
                                      @for (hiddenLike of getHiddenLikes(note); track hiddenLike.actorId) {
                                        <div class="flex items-center gap-1.5 text-[10px]">
                                          <div class="w-3.5 h-3.5 rounded-full overflow-hidden flex-shrink-0">
                                            <app-actor-avatar [avatar]="hiddenLike.avatarIcon || 'person'" containerClass="w-full h-full" />
                                          </div>
                                          <span class="truncate">{{ hiddenLike.actorName }}</span>
                                        </div>
                                      }
                                    </div>
                                  </div>
                                </div>
                              }
                            </div>
                          </div>
                        </div>
                      } @empty {
                        <div class="text-center py-8 text-xs text-outline italic">
                          В этом слоте пока нет мыслей
                        </div>
                      }
                    </div>
                  </div>

                  <div class="pt-3 border-t border-outline-variant/20 flex items-center justify-between">
                    <span class="text-[11px] font-label-code-sm text-outline">
                      {{ periodNotes.length }} записей
                    </span>
                    <button
                      type="button"
                      (click)="setTimeForSlot(period.defaultTime)"
                      class="px-2.5 py-1 rounded-xl bg-surface-container-high hover:bg-primary-container text-on-surface hover:text-on-primary-container text-[11px] font-bold font-label-ui transition-colors"
                    >
                      + В этот слот
                    </button>
                  </div>
                </div>
              }
            }
          </div>
        </div>
      }

      <!-- 5. MULTI-CHARACTER ROLEPLAY ACTION BAR (OPTIMIZED, SLEEK & COMPACT) -->
      <section
        id="cloud-composer"
        class="sticky bottom-4 z-30 p-3 sm:p-3.5 rounded-2xl bg-surface-container-lowest/98 border border-primary/30 shadow-lg flex flex-col gap-2 isolate"
        style="contain: layout style;"
      >
        <!-- Row 1: Hero Selector Chips & Mode Switcher -->
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <!-- Character Chips Strip -->
          <div class="flex items-center gap-1.5 overflow-x-auto py-0.5 flex-1 scrollbar-none">
            <span class="inline-flex items-center gap-1 text-[11px] font-label-ui font-semibold text-on-surface-variant flex-shrink-0 mr-0.5">
              <span class="material-symbols-rounded text-sm text-primary">theater_comedy</span>
              <span>Герой:</span>
            </span>

            @for (actor of quickActors(); track actor.id) {
              <button
                type="button"
                (click)="selectPitchActor(actor)"
                class="px-2.5 py-1 rounded-xl border flex items-center gap-1.5 transition-colors flex-shrink-0 cursor-pointer"
                [class]="
                  activePitchActor()?.id === actor.id
                    ? 'border-primary bg-primary-container text-on-primary-container font-bold shadow-xs ring-1 ring-primary/40'
                    : 'border-outline-variant/30 bg-surface-container-low text-on-surface hover:bg-surface-container-high'
                "
              >
                <app-actor-avatar [avatar]="actor.avatarIcon" containerClass="w-5 h-5 rounded-md flex-shrink-0" />
                <span class="text-xs font-label-ui whitespace-nowrap">{{ actor.name }}</span>
              </button>
            }

            <button
              type="button"
              (click)="openCharacterPickerForMain()"
              class="px-2.5 py-1 rounded-xl border border-dashed border-outline-variant/50 bg-surface-container-low hover:bg-surface-container-high text-on-surface text-xs font-semibold flex items-center gap-1 flex-shrink-0 transition-colors cursor-pointer"
            >
              <span class="material-symbols-rounded text-sm text-primary">groups</span>
              <span>Все 30...</span>
            </button>
          </div>

          <!-- Action Type Segmented Selector -->
          <div class="flex items-center gap-0.5 bg-surface-container-low p-0.5 rounded-xl border border-outline-variant/30 flex-shrink-0">
            <button
              type="button"
              (click)="selectedActionType.set('thought')"
              class="px-2.5 py-1 rounded-lg text-xs font-bold font-label-ui transition-colors flex items-center gap-1 cursor-pointer"
              [class]="
                selectedActionType() === 'thought'
                  ? 'bg-amber-400/25 text-amber-900 dark:text-amber-200 border border-amber-400/40 shadow-2xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              "
            >
              <span>💭</span>
              <span>Мысль</span>
            </button>

            <button
              type="button"
              (click)="selectedActionType.set('proposal')"
              class="px-2.5 py-1 rounded-lg text-xs font-bold font-label-ui transition-colors flex items-center gap-1 cursor-pointer"
              [class]="
                selectedActionType() === 'proposal'
                  ? 'bg-emerald-500/25 text-emerald-900 dark:text-emerald-200 border border-emerald-500/40 shadow-2xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              "
            >
              <span>💡</span>
              <span>Идея</span>
            </button>

            <button
              type="button"
              (click)="selectedActionType.set('action')"
              class="px-2.5 py-1 rounded-lg text-xs font-bold font-label-ui transition-colors flex items-center gap-1 cursor-pointer"
              [class]="
                selectedActionType() === 'action'
                  ? 'bg-indigo-500/25 text-indigo-900 dark:text-indigo-200 border border-indigo-500/40 shadow-2xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              "
            >
              <span>⚡</span>
              <span>Экшен</span>
            </button>
          </div>
        </div>

        <!-- Row 1.5: Sub-character (Субперсонаж / Соавтор) Selector Bar -->
        <div class="flex items-center gap-2 flex-wrap pt-1 border-t border-outline-variant/15 text-xs font-label-ui">
          <span class="inline-flex items-center gap-1 text-[11px] font-bold text-on-surface flex-shrink-0">
            <span class="material-symbols-rounded text-sm text-amber-500">theater_comedy</span>
            <span>Субперсонаж:</span>
          </span>

          @if (activeSubActor(); as sub) {
            <div class="inline-flex items-center gap-1.5 pl-2 pr-1.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-900 dark:text-amber-200 font-label-code-sm text-xs font-bold shadow-2xs">
              <app-actor-avatar [avatar]="sub.avatarIcon" containerClass="w-4 h-4 rounded-full flex-shrink-0" />
              <span>{{ sub.name }}</span>
              <button
                type="button"
                (click)="clearSubActor()"
                class="w-4 h-4 rounded-full hover:bg-amber-500/30 inline-flex items-center justify-center text-[10px] font-bold text-amber-800 dark:text-amber-200 ml-0.5 cursor-pointer"
                title="Убрать субперсонажа"
              >
                ✕
              </button>
            </div>
          } @else {
            <div class="flex items-center gap-1 overflow-x-auto scrollbar-none flex-wrap">
              @for (quickHero of quickActors(); track quickHero.id) {
                @if (quickHero.id !== activePitchActor()?.id) {
                  <button
                    type="button"
                    (click)="setSubActor(quickHero)"
                    class="px-2 py-0.5 rounded-full bg-surface-container-low hover:bg-amber-500/20 hover:text-amber-900 dark:hover:text-amber-200 border border-outline-variant/25 text-on-surface-variant text-[10px] font-label-code-sm font-semibold transition-colors flex-shrink-0 cursor-pointer inline-flex items-center gap-1"
                    title="Указать {{ quickHero.name }} субперсонажем"
                  >
                    <app-actor-avatar [avatar]="quickHero.avatarIcon" containerClass="w-3.5 h-3.5 rounded-full flex-shrink-0" />
                    <span>+ {{ quickHero.name }}</span>
                  </button>
                }
              }
              <button
                type="button"
                (click)="openCharacterPickerForSub()"
                class="px-2 py-0.5 rounded-full border border-dashed border-outline-variant/40 hover:border-amber-500 text-[10px] font-label-code-sm text-outline hover:text-on-surface cursor-pointer"
                title="Выбрать субперсонажа из полного каталога"
              >
                Все 30...
              </button>
            </div>
          }
        </div>

        <!-- Live Replying-To Banner -->
        @if (replyingToNote(); as rep) {
          <div class="flex items-center justify-between px-3 py-1.5 rounded-xl bg-primary/15 border border-primary/35 text-xs font-label-ui animate-fade-in">
            <div class="flex items-center gap-2 truncate">
              <span class="material-symbols-rounded text-sm text-primary">reply</span>
              <span class="font-bold text-primary">Ответ на мысль</span>
              <div class="inline-flex items-center gap-1 font-bold text-on-surface">
                <app-actor-avatar [avatar]="rep.actorAvatar" containerClass="w-4 h-4 rounded-full flex-shrink-0" />
                <span>{{ rep.actorName }}</span>
              </div>
              <span class="text-outline truncate italic max-w-[200px] sm:max-w-md">«{{ rep.text }}»</span>
            </div>
            <button
              type="button"
              (click)="cancelReply()"
              class="text-[11px] font-bold text-outline hover:text-on-surface px-1.5 py-0.5 rounded hover:bg-surface-container transition-colors cursor-pointer flex-shrink-0 ml-2"
              title="Отменить ответ"
            >
              ✕
            </button>
          </div>
        }

        <!-- Row 2: Time, Input & Submit -->
        <div class="flex items-center gap-2">
          <!-- Time Picker Box -->
          <div class="flex items-center gap-1 bg-surface-container-low hover:bg-surface-container px-2.5 py-1.5 rounded-xl border border-outline-variant/40 transition-colors flex-shrink-0">
            <span class="material-symbols-rounded text-sm text-primary">schedule</span>
            <input
              type="time"
              [(ngModel)]="newNoteTime"
              class="bg-transparent text-xs font-mono font-bold text-on-surface focus:outline-none w-14 cursor-pointer"
            />
          </div>

          <!-- Text Input -->
          <input
            type="text"
            [(ngModel)]="newIdeaTitle"
            (keyup.enter)="submitNoteOrIdea()"
            [placeholder]="inputPlaceholder()"
            class="flex-1 px-3.5 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-xs text-on-surface focus:outline-none focus:border-primary focus:bg-surface-container-lowest placeholder:text-outline transition-colors"
          />

          <!-- Submit Button -->
          <button
            type="button"
            (click)="submitNoteOrIdea()"
            class="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-label-ui text-xs font-bold shadow-xs active:scale-97 transition-transform flex-shrink-0 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span class="material-symbols-rounded text-base">cloud_upload</span>
            <span>В облако ✨</span>
          </button>
        </div>

        <!-- Live Detected Party Characters Banner -->
        @if (detectedPartyActors().length > 0) {
          <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] font-label-ui text-amber-900 dark:text-amber-200 animate-fade-in flex-wrap">
            <span class="material-symbols-rounded text-sm text-amber-600 dark:text-amber-400">group_add</span>
            <span class="font-bold">Распознаны в тексте:</span>
            <div class="flex items-center gap-1 flex-wrap">
              @for (hero of detectedPartyActors(); track hero.id) {
                <button
                  type="button"
                  (click)="setSubActor(hero)"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-lowest text-on-surface font-label-code-sm text-[10px] font-bold shadow-2xs border transition-colors cursor-pointer hover:border-amber-500"
                  [class]="activeSubActor()?.id === hero.id ? 'border-amber-500 ring-1 ring-amber-500 bg-amber-500/20 text-amber-900 dark:text-amber-200' : 'border-amber-500/30'"
                  title="Нажмите, чтобы сделать субперсонажем"
                >
                  <app-actor-avatar [avatar]="hero.avatarIcon" containerClass="w-3.5 h-3.5 rounded-full" />
                  <span>{{ hero.name }}</span>
                  @if (activeSubActor()?.id === hero.id) {
                    <span class="text-[9px] text-amber-600 font-bold">✓ субперсонаж</span>
                  } @else {
                    <span class="text-[9px] text-outline">+ субперсонаж</span>
                  }
                </button>
              }
            </div>
            <span class="text-[10px] text-amber-700 dark:text-amber-300 opacity-80 ml-auto">автоматически отобразится в ленте обоих персонажей ✨</span>
          </div>
        }

        <!-- Row 3: Clean Quick Presets & Quick Party Mentions -->
        <div class="flex items-center gap-2 overflow-x-auto py-0.5 scrollbar-none flex-wrap sm:flex-nowrap">
          <div class="flex items-center gap-1.5 flex-shrink-0">
            <span class="inline-flex items-center gap-1 text-[10px] font-label-code-sm text-outline font-extrabold uppercase mr-1 flex-shrink-0">
              <span class="material-symbols-rounded text-xs text-primary">bolt</span>
              <span>Быстро:</span>
            </span>
            @for (preset of thoughtPresets; track preset.title) {
              <button
                type="button"
                (click)="pitchPreset(preset)"
                class="px-2.5 py-0.5 rounded-full bg-surface-container-low hover:bg-primary-container hover:text-on-primary-container hover:border-primary/40 border border-outline-variant/25 text-on-surface-variant text-[11px] font-label-code-sm font-semibold transition-colors flex-shrink-0 cursor-pointer"
              >
                {{ preset.icon }} {{ preset.title }}
              </button>
            }
          </div>

          <div class="h-3 w-px bg-outline-variant/30 hidden sm:block flex-shrink-0"></div>

          <!-- Quick + Hero Mentions -->
          <div class="flex items-center gap-1 overflow-x-auto scrollbar-none flex-shrink-0">
            <span class="inline-flex items-center gap-0.5 text-[10px] font-label-code-sm text-amber-600 dark:text-amber-400 font-extrabold uppercase mr-0.5 flex-shrink-0">
              <span class="material-symbols-rounded text-xs">person_add</span>
              <span>+ В пати:</span>
            </span>
            @for (quickHero of quickActors(); track quickHero.id) {
              @if (quickHero.id !== activePitchActor()?.id) {
                <button
                  type="button"
                  (click)="appendActorMention(quickHero)"
                  class="px-2 py-0.5 rounded-full bg-surface-container-low hover:bg-amber-500/20 hover:text-amber-900 dark:hover:text-amber-200 border border-outline-variant/25 text-on-surface-variant text-[10px] font-label-code-sm font-semibold transition-colors flex-shrink-0 cursor-pointer inline-flex items-center gap-1"
                  [title]="'Добавить + ' + quickHero.name + ' в сообщение'"
                >
                  <app-actor-avatar [avatar]="quickHero.avatarIcon" containerClass="w-3 h-3 rounded-full flex-shrink-0" />
                  <span>+ {{ quickHero.name.split(' ')[0] }}</span>
                </button>
              }
            }
          </div>
        </div>
      </section>

      <!-- 6. MODAL: ALL 30 CHARACTERS PICKER (MEETS STRICT AGENT RULES) -->
      @if (isCharacterPickerOpen()) {
        <div
          appModalOverlay
          [appModalOverlayDismissable]="true"
          (overlayClose)="closeCharacterPickerModal()"
          aria-labelledby="char-picker-modal-title"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
        >
          <div
            (click)="$event.stopPropagation()"
            class="w-full max-w-2xl rounded-3xl bg-surface-container-lowest p-6 shadow-2xl border border-outline-variant/30 flex flex-col gap-4 text-on-surface max-h-[85vh] overflow-hidden"
          >
            <!-- Header with Explicit Close Button -->
            <div class="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div class="flex items-center gap-2">
                <span class="material-symbols-rounded text-primary text-2xl">groups</span>
                <h2 id="char-picker-modal-title" class="font-headline-sm text-base font-bold text-on-surface">
                  {{ characterPickerMode() === 'SUB' ? 'Выберите Субперсонажа (соавтора / напарника)' : 'Выберите Персонажа для Мыслей & Предложений' }}
                </h2>
              </div>
              <button
                type="button"
                (click)="closeCharacterPickerModal()"
                class="p-1.5 rounded-xl text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
                aria-label="Закрыть"
              >
                <span class="material-symbols-rounded text-xl">close</span>
              </button>
            </div>

            <!-- Scrollable 30 Characters Grid -->
            <div class="overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 p-1">
              @for (actor of allActors(); track actor.id) {
                <button
                  type="button"
                  (click)="selectPitchActor(actor)"
                  class="p-2.5 rounded-2xl border flex flex-col items-center gap-2 hover:bg-surface-container-high transition-colors text-center cursor-pointer group"
                  [class]="
                    (characterPickerMode() === 'SUB' ? activeSubActor()?.id === actor.id : activePitchActor()?.id === actor.id)
                      ? 'border-primary bg-primary-container/25 ring-2 ring-primary shadow-xs'
                      : 'border-outline-variant/30 bg-surface-container-low'
                  "
                >
                  <app-actor-avatar [avatar]="actor.avatarIcon" containerClass="w-12 h-12 rounded-2xl shadow-xs flex-shrink-0" />
                  <div class="flex flex-col items-center w-full truncate">
                    <span class="font-label-ui text-xs font-bold text-on-surface truncate w-full">{{ actor.name }}</span>
                    <span class="font-label-code-sm text-[10px] text-outline truncate w-full">{{ actor.title }}</span>
                  </div>
                </button>
              }
            </div>

            <!-- Footer with Cancel Button -->
            <div class="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant/20">
              <button
                type="button"
                (click)="closeCharacterPickerModal()"
                class="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-ui text-xs font-bold cursor-pointer"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      }

      <!-- 7. MODAL: CREATE NEW PARTY SPACE (HOST SPACE) (MEETS STRICT AGENT RULES) -->
      @if (isCreateSpaceModalOpen()) {
        <div
          appModalOverlay
          [appModalOverlayDismissable]="true"
          (overlayClose)="closeCreateSpaceModal()"
          aria-labelledby="create-space-modal-title"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
        >
          <div
            (click)="$event.stopPropagation()"
            class="w-full max-w-lg rounded-3xl bg-surface-container-lowest p-6 shadow-xl border border-outline-variant/30 flex flex-col gap-4 text-on-surface"
          >
            <!-- Header with Explicit Close Button -->
            <div class="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div class="flex items-center gap-2">
                <span class="material-symbols-rounded text-primary text-2xl">add_circle</span>
                <h2 id="create-space-modal-title" class="font-headline-sm text-base font-bold text-on-surface">
                  Создать Новое Пространство Вечеринки
                </h2>
              </div>
              <button
                type="button"
                (click)="closeCreateSpaceModal()"
                class="p-1.5 rounded-lg text-outline hover:text-on-surface cursor-pointer"
                aria-label="Закрыть"
              >
                <span class="material-symbols-rounded text-lg">close</span>
              </button>
            </div>

            <!-- Host character selection -->
            <div class="flex flex-col gap-1.5">
              <label for="host-select" class="font-label-ui text-xs font-bold text-on-surface-variant">
                👑 Хост / Создатель пространства:
              </label>
              <select
                id="host-select"
                [ngModel]="newSpaceHostId()"
                (ngModelChange)="onHostChange($event)"
                class="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-xs font-semibold text-on-surface"
              >
                @for (actor of allActors(); track actor.id) {
                  <option [value]="actor.id">{{ actor.name }} ({{ actor.title }})</option>
                }
              </select>
            </div>

            <!-- Title -->
            <div class="flex flex-col gap-1.5">
              <label for="space-title-input" class="font-label-ui text-xs font-bold text-on-surface-variant">
                Название пространства:
              </label>
              <input
                id="space-title-input"
                type="text"
                [(ngModel)]="newSpaceTitle"
                placeholder="Напр. Friday Chill Core / Логово Кота / Лаборатория"
                class="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-xs text-on-surface"
              />
            </div>

            <!-- Description -->
            <div class="flex flex-col gap-1.5">
              <label for="space-desc-input" class="font-label-ui text-xs font-bold text-on-surface-variant">
                Тема встречи & Описание:
              </label>
              <textarea
                id="space-desc-input"
                [(ngModel)]="newSpaceDescription"
                rows="2"
                placeholder="Напр. Собираемся на чилл, обсуждаем игры и делимся мыслями..."
                class="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-xs text-on-surface resize-none"
              ></textarea>
            </div>

            <!-- Footer with Cancel and Submit -->
            <div class="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant/20">
              <button
                type="button"
                (click)="closeCreateSpaceModal()"
                class="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-ui text-xs font-bold cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                (click)="submitCreateSpace()"
                class="px-4 py-2 rounded-xl bg-primary text-on-primary font-label-ui text-xs font-bold shadow-xs hover:opacity-95 cursor-pointer"
              >
                🚀 Запустить Пространство
              </button>
            </div>
          </div>
        </div>
      }

      <!-- 8. MODAL: INSPECT DAY NOTE / CARD DETAIL (COMPLIES WITH MODAL DIALOGS RULE) -->
      @if (inspectedNote(); as note) {
        <div
          appModalOverlay
          [appModalOverlayDismissable]="true"
          (overlayClose)="closeInspectModal()"
          aria-labelledby="inspect-note-modal-title"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
        >
          <div
            (click)="$event.stopPropagation()"
            class="w-full max-w-lg rounded-3xl bg-surface-container-lowest p-6 shadow-2xl border border-outline-variant/30 flex flex-col gap-4 text-on-surface animate-scale-in"
          >
            <!-- Header with Explicit Close Button & Cluster Paginator -->
            <div class="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div class="flex items-center gap-2">
                <span class="text-2xl">{{ getTypeEmoji(note.type) }}</span>
                <h2 id="inspect-note-modal-title" class="font-headline-sm text-base font-bold text-on-surface">
                  {{ getTypeLabel(note.type) }}: {{ note.actorName }}
                </h2>
              </div>
              <div class="flex items-center gap-2">
                @if (getInspectedNoteCluster(); as cluster) {
                  <div
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 dark:bg-amber-400/20 text-amber-800 dark:text-amber-300 font-mono text-xs font-bold"
                    [title]="'Навигация по стопке (' + cluster.notes.length + ' мыслей)'"
                  >
                    <button
                      type="button"
                      (click)="prevInspectedClusterNote(cluster)"
                      class="w-5 h-5 rounded hover:bg-amber-500/30 flex items-center justify-center transition-colors cursor-pointer text-sm font-black"
                      title="Предыдущая мысль в стопке"
                    >
                      ‹
                    </button>
                    <span>
                      {{ getInspectedNoteClusterIndex(cluster) + 1 }} / {{ cluster.notes.length }}
                    </span>
                    <button
                      type="button"
                      (click)="nextInspectedClusterNote(cluster)"
                      class="w-5 h-5 rounded hover:bg-amber-500/30 flex items-center justify-center transition-colors cursor-pointer text-sm font-black"
                      title="Следующая мысль в стопке"
                    >
                      ›
                    </button>
                  </div>
                }

                <button
                  type="button"
                  (click)="closeInspectModal()"
                  class="p-1.5 rounded-xl text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
                  aria-label="Закрыть"
                >
                  <span class="material-symbols-rounded text-xl">close</span>
                </button>
              </div>
            </div>

            <!-- Hero Identity Strip -->
            <div class="flex items-center gap-3.5 p-3 rounded-2xl bg-surface-container-low border border-outline-variant/30">
              <div class="flex items-center -space-x-3 flex-shrink-0">
                <app-actor-avatar
                  [avatar]="note.actorAvatar"
                  containerClass="w-14 h-14 rounded-2xl shadow-sm ring-2 ring-primary/40 z-10 flex-shrink-0"
                />
                @if (note.subActorAvatar) {
                  <app-actor-avatar
                    [avatar]="note.subActorAvatar"
                    containerClass="w-14 h-14 rounded-2xl shadow-sm ring-2 ring-amber-500/50 z-20 flex-shrink-0"
                    [title]="'Субперсонаж: ' + note.subActorName"
                  />
                }
              </div>
              <div class="flex flex-col min-w-0 flex-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-headline-sm text-base font-black text-on-surface truncate">{{ note.actorName }}</span>
                  @if (note.subActorName) {
                    <span class="text-sm text-primary font-black">&</span>
                    <span class="font-headline-sm text-base font-black text-primary truncate" [title]="'Субперсонаж: ' + note.subActorName">{{ note.subActorName }}</span>
                  }
                  <span class="text-[11px] px-2 py-0.5 rounded-full font-label-code-sm font-bold" [class]="getNoteBorderClass(note.actorAccent)">
                    {{ getTypeEmoji(note.type) }} {{ getTypeLabel(note.type) }}
                  </span>
                </div>
                <span class="text-xs font-label-ui text-primary font-semibold truncate">{{ note.actorTitle || inspectedActor()?.title }}</span>
                <div class="flex items-center gap-2 text-[11px] font-mono text-outline mt-0.5">
                  <span class="flex items-center gap-1">
                    <span class="material-symbols-rounded text-xs">schedule</span>
                    <span>{{ note.time }}</span>
                  </span>
                  <span>·</span>
                  <span>{{ activeDateFormatted() }}</span>
                </div>
              </div>
            </div>

            <!-- Hybrid Model Badges (Pin in Hero, Pin in Cloud, Visibility, Forked) -->
            <div class="flex items-center gap-1.5 flex-wrap px-1">
              @if (note.isPinnedToHero) {
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary font-mono text-[10px] font-bold">
                  <span class="material-symbols-rounded text-xs">push_pin</span>
                  <span>В карточке героя</span>
                </span>
              }
              @if (note.isPinnedToCloud) {
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-800 dark:text-sky-300 font-mono text-[10px] font-bold">
                  <span class="material-symbols-rounded text-xs">cloud</span>
                  <span>Запинено в облаках</span>
                </span>
              }
              @if (note.visibility === 'PRIVATE') {
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary-container text-on-primary-container font-mono text-[10px] font-bold">
                  <span class="material-symbols-rounded text-xs">lock</span>
                  <span>Личная заметка</span>
                </span>
              } @else {
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-mono text-[10px] font-semibold">
                  <span class="material-symbols-rounded text-xs">public</span>
                  <span>Общий Хаб</span>
                </span>
              }
              @if (note.forkedFromNoteId) {
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-container-high text-primary font-mono text-[10px]">
                  <span class="material-symbols-rounded text-xs">download_done</span>
                  <span>Забрано из Общего облака ({{ note.forkedFromAuthorName }})</span>
                </span>
              }
            </div>

            <!-- Reply Reference Banner (if this note is a reply) -->
            @if (note.replyToAuthorName) {
              <div class="flex items-center justify-between p-2.5 rounded-xl bg-primary/10 border border-primary/25 text-xs font-label-ui">
                <div class="flex items-center gap-2 truncate">
                  <span class="material-symbols-rounded text-sm text-primary">reply</span>
                  <span class="font-bold text-primary">В ответ на мысль:</span>
                  <span class="font-bold text-on-surface">{{ note.replyToAuthorName }}</span>
                  @if (note.replyToTextSnippet) {
                    <span class="text-outline truncate italic max-w-[200px] sm:max-w-xs">«{{ note.replyToTextSnippet }}»</span>
                  }
                </div>
                @if (note.replyToNoteId) {
                  <button
                    type="button"
                    (click)="jumpToRepliedNote(note.replyToNoteId, $event)"
                    class="text-[11px] font-bold text-primary hover:underline flex-shrink-0 ml-2 cursor-pointer inline-flex items-center gap-0.5"
                    title="Перейти к родительской мысли"
                  >
                    <span>К мысли</span>
                    <span class="material-symbols-rounded text-xs">arrow_forward</span>
                  </button>
                }
              </div>
            }

            <!-- Note Text Bubble -->
            <div class="p-4 sm:p-5 rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 shadow-inner relative flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-label-code-sm uppercase tracking-wider text-outline font-bold">
                  Содержание:
                </span>
                <span class="text-lg">{{ note.moodEmoji }}</span>
              </div>
              <p class="font-body-lg text-sm sm:text-base text-on-surface italic leading-relaxed whitespace-pre-wrap select-text">
                «{{ note.text }}»
              </p>
            </div>

            <!-- Sub-character (Co-participant) Strip -->
            @if (note.subActorName) {
              <div class="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/15 dark:bg-amber-400/15 border border-amber-500/40 text-xs font-label-ui text-amber-900 dark:text-amber-200">
                <span class="text-sm">🎭</span>
                <span class="font-bold">Субперсонаж (соавтор):</span>
                <div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-container-lowest text-on-surface font-label-code-sm text-xs font-bold shadow-2xs border border-amber-500/30">
                  <app-actor-avatar [avatar]="note.subActorAvatar || 'person'" containerClass="w-4 h-4 rounded-full flex-shrink-0" />
                  <span>{{ note.subActorName }}</span>
                </div>
              </div>
            }

            <!-- Party Synergy Strip (if present) -->
            @if (note.partyActorIds && note.partyActorIds.length > 0) {
              <div class="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/30 text-xs font-label-ui text-amber-900 dark:text-amber-200">
                <span class="text-sm">👥</span>
                <span class="font-bold">В пати с:</span>
                <span class="font-label-code-sm font-bold">{{ getPartyNames(note) }}</span>
              </div>
            }

            <!-- Thread Replies to this Note -->
            @if (getRepliesForNote(note.id); as replies) {
              @if (replies.length > 0) {
                <div class="flex flex-col gap-2 p-3 rounded-2xl bg-surface-container-low border border-outline-variant/30">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold font-label-ui text-on-surface flex items-center gap-1.5">
                      <span class="material-symbols-rounded text-sm text-primary">forum</span>
                      <span>Ответы на эту мысль ({{ replies.length }}):</span>
                    </span>
                  </div>
                  <div class="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                    @for (reply of replies; track reply.id) {
                      <div
                        (click)="inspectNote(reply)"
                        class="flex items-center justify-between p-2 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer border border-outline-variant/20"
                        title="Нажмите, чтобы открыть этот ответ"
                      >
                        <div class="flex items-center gap-2 min-w-0">
                          <app-actor-avatar [avatar]="reply.actorAvatar" containerClass="w-6 h-6 rounded-lg flex-shrink-0" />
                          <div class="flex flex-col min-w-0">
                            <span class="text-xs font-bold text-on-surface truncate">{{ reply.actorName }}</span>
                            <span class="text-[11px] text-outline truncate italic">«{{ reply.text }}»</span>
                          </div>
                        </div>
                        <span class="text-[10px] font-mono text-outline flex-shrink-0 ml-2">{{ reply.time }}</span>
                      </div>
                    }
                  </div>
                </div>
              }
            }

            <!-- Supporters & Likes Strip -->
            <div class="flex items-center justify-between p-3 rounded-xl bg-surface-container-high/60 border border-outline-variant/25 flex-wrap gap-2">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-xs font-bold font-label-ui text-on-surface">Оценили:</span>
                @for (like of getVisibleLikes(note); track like.actorId) {
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container text-on-surface text-[10px] font-label-code-sm shadow-2xs border border-outline-variant/25" [title]="'Лайк от: ' + like.actorName">
                    <app-actor-avatar [avatar]="like.avatarIcon || 'person'" containerClass="w-3.5 h-3.5 rounded-full flex-shrink-0" />
                    <span class="font-bold">{{ like.actorName }}</span>
                  </span>
                }
                @if (getHiddenLikes(note).length > 0) {
                  <div class="relative group/inspectlikes inline-flex items-center">
                    <span
                      class="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-label-code-sm text-[10px] font-bold border border-primary/25 cursor-help"
                      [title]="getHiddenLikesTooltip(note)"
                    >
                      +{{ getHiddenLikes(note).length }} {{ getLikesWord(getHiddenLikes(note).length) }} ({{ getHiddenLikesNames(note) }})
                    </span>
                    <!-- Hover popover -->
                    <div
                      class="absolute bottom-full left-0 mb-2 hidden group-hover/inspectlikes:flex flex-col rounded-xl bg-slate-900/95 dark:bg-slate-950/95 text-white p-2 shadow-2xl border border-slate-700/60 z-50 min-w-[170px] pointer-events-none animate-fadeIn backdrop-blur-md"
                    >
                      <div class="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1 border-b border-slate-700/60 pb-1 flex items-center justify-between">
                        <span>Оценили мысль:</span>
                        <span class="text-primary font-mono font-bold">+{{ getHiddenLikes(note).length }}</span>
                      </div>
                      <div class="flex flex-col gap-1 max-h-[140px] overflow-y-auto">
                        @for (hiddenLike of getHiddenLikes(note); track hiddenLike.actorId) {
                          <div class="flex items-center gap-1.5 text-[10px]">
                            <div class="w-3.5 h-3.5 rounded-full overflow-hidden flex-shrink-0 bg-slate-800">
                              <app-actor-avatar [avatar]="hiddenLike.avatarIcon || 'person'" containerClass="w-full h-full" />
                            </div>
                            <span class="truncate text-slate-100">{{ hiddenLike.actorName }}</span>
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                }
                @if (getResolvedLikes(note).length === 0) {
                  <span class="text-xs text-outline italic">Пока никто не оценил</span>
                }
              </div>
              <button
                type="button"
                (click)="voteForNote(note.id)"
                class="px-3.5 py-1.5 rounded-xl text-xs font-bold font-label-ui inline-flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
                [class]="hasActorLiked(note) ? 'bg-rose-500 hover:bg-rose-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'"
              >
                <span>{{ hasActorLiked(note) ? '❤️' : '🤍' }}</span>
                <span>{{ hasActorLiked(note) ? 'Вы оценили (снять)' : 'Поддержать (+1)' }}</span>
              </button>
            </div>

            @if (inspectedActor()?.quote) {
              <div class="text-xs text-on-surface-variant flex items-center gap-2 italic px-1">
                <span class="material-symbols-rounded text-sm text-outline">format_quote</span>
                <span class="truncate">Цитата героя: «{{ inspectedActor()!.quote }}»</span>
              </div>
            }

            <!-- Footer: Hero Roleplay Switch, Adopt to Private, Pin, Delete & Close Button -->
            <div class="flex items-center justify-between gap-2 pt-3 border-t border-outline-variant/20 flex-wrap">
              <div class="flex items-center gap-1.5 flex-wrap">
                <!-- Reply in Cloud / Ответить на мысль -->
                <button
                  type="button"
                  (click)="startReplyFromModal(note)"
                  class="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-label-ui text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                  title="Ответить на эту мысль в облаке"
                >
                  <span class="material-symbols-rounded text-sm">reply</span>
                  <span>Ответить</span>
                </button>

                <button
                  type="button"
                  (click)="selectPitchActorFromInspect()"
                  class="px-3 py-1.5 rounded-xl bg-primary-container text-on-primary-container hover:brightness-105 font-label-ui text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Выбрать этого героя в нижней плашке"
                >
                  <span class="material-symbols-rounded text-sm">theater_comedy</span>
                  <span>Действовать как герой</span>
                </button>

                <!-- Adopt to Private / Забрать себе в личные -->
                <button
                  type="button"
                  (click)="adoptInspectedNoteToPrivate()"
                  class="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 dark:text-amber-200 font-label-ui text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors border border-amber-500/30"
                  title="Забрать эту мысль из Общего облака себе в личный блокнот героя"
                >
                  <span class="material-symbols-rounded text-sm">file_download</span>
                  <span>Забрать себе</span>
                </button>

                <!-- Pin in Hero toggle -->
                <button
                  type="button"
                  (click)="togglePinInspectedToHero()"
                  class="px-2.5 py-1.5 rounded-xl font-label-ui text-xs font-bold border transition-colors inline-flex items-center gap-1 cursor-pointer"
                  [class]="
                    note.isPinnedToHero
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-surface-container text-on-surface-variant border-outline-variant/30 hover:text-on-surface'
                  "
                  title="Закрепить или открепить в карточке этого персонажа"
                >
                  <span class="material-symbols-rounded text-sm">push_pin</span>
                  <span>{{ note.isPinnedToHero ? 'В герое 📌' : '📌 В героя' }}</span>
                </button>

                <!-- Pin in Cloud toggle -->
                <button
                  type="button"
                  (click)="togglePinInspectedToCloud()"
                  class="px-2.5 py-1.5 rounded-xl font-label-ui text-xs font-bold border transition-colors inline-flex items-center gap-1 cursor-pointer"
                  [class]="
                    note.isPinnedToCloud
                      ? 'bg-sky-600 text-white border-sky-600'
                      : 'bg-surface-container text-on-surface-variant border-outline-variant/30 hover:text-on-surface'
                  "
                  title="Закрепить или открепить в летающих облачках"
                >
                  <span class="material-symbols-rounded text-sm">cloud</span>
                  <span>{{ note.isPinnedToCloud ? 'В облаках ☁️' : '☁️ В облака' }}</span>
                </button>

                <button
                  type="button"
                  (click)="openWorkspaceFromInspectedNote()"
                  class="px-2.5 py-1.5 rounded-xl bg-primary/10 hover:bg-primary hover:text-on-primary text-primary font-label-ui text-xs font-semibold transition-all inline-flex items-center gap-1 cursor-pointer"
                  title="Открыть персональный Workspace героя с 3 уровнями (Public, Private, Архаичный лор)"
                >
                  <span class="material-symbols-rounded text-sm">cloud</span>
                  <span>Workspace героя</span>
                </button>

                <button
                  type="button"
                  (click)="deleteInspectedNote()"
                  class="p-1.5 rounded-xl text-outline hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  title="Удалить мысль"
                  aria-label="Удалить"
                >
                  <span class="material-symbols-rounded text-lg">delete</span>
                </button>
              </div>

              <button
                type="button"
                (click)="closeInspectModal()"
                class="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-ui text-xs font-bold cursor-pointer transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      }

      <!-- 9. MODAL: DAY VIBE SELECTOR (MEETS STRICT MODAL RULES) -->
      @if (isVibePickerOpen()) {
        <div
          appModalOverlay
          [appModalOverlayDismissable]="true"
          (overlayClose)="closeVibePickerModal()"
          aria-labelledby="vibe-picker-modal-title"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
        >
          <div
            (click)="$event.stopPropagation()"
            class="w-full max-w-lg rounded-3xl bg-surface-container-lowest p-6 shadow-2xl border border-outline-variant/30 flex flex-col gap-4 text-on-surface animate-scale-in"
          >
            <!-- Header with Explicit Close Button -->
            <div class="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div class="flex items-center gap-2">
                <span class="material-symbols-rounded text-primary text-2xl">palette</span>
                <h2 id="vibe-picker-modal-title" class="font-headline-sm text-base font-bold text-on-surface">
                  Настроить Вайб & Фон Небосвода
                </h2>
              </div>
              <button
                type="button"
                (click)="closeVibePickerModal()"
                class="p-1.5 rounded-xl text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
                aria-label="Закрыть"
              >
                <span class="material-symbols-rounded text-xl">close</span>
              </button>
            </div>

            <!-- Vibe Presets List -->
            <div class="flex flex-col gap-2.5">
              @for (vibe of vibes; track vibe.id) {
                <button
                  type="button"
                  (click)="selectVibe(vibe.id)"
                  class="p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-left transition-all cursor-pointer group"
                  [class]="
                    selectedVibeId() === vibe.id
                      ? 'border-primary bg-primary-container/20 ring-2 ring-primary shadow-xs'
                      : 'border-outline-variant/30 bg-surface-container-low hover:bg-surface-container-high'
                  "
                >
                  <div class="flex items-center gap-3">
                    <span class="text-3xl group-hover:scale-110 transition-transform">{{ vibe.icon }}</span>
                    <div class="flex flex-col">
                      <div class="flex items-center gap-2">
                        <span class="font-label-ui text-sm font-bold text-on-surface">{{ vibe.name }}</span>
                        <span class="text-[10px] font-label-code-sm font-extrabold px-2 py-0.2 rounded-full bg-primary/10 text-primary">
                          {{ vibe.badge }}
                        </span>
                      </div>
                      <span class="font-body-sm text-xs text-on-surface-variant leading-snug mt-0.5">
                        {{ vibe.description }}
                      </span>
                    </div>
                  </div>

                  @if (selectedVibeId() === vibe.id) {
                    <span class="material-symbols-rounded text-primary text-xl flex-shrink-0">check_circle</span>
                  }
                </button>
              }
            </div>

            <!-- Footer with Cancel Button -->
            <div class="flex items-center justify-between pt-3 border-t border-outline-variant/20">
              <span class="text-xs font-label-code-sm text-outline">
                Вайб сохраняется в браузере
              </span>
              <button
                type="button"
                (click)="closeVibePickerModal()"
                class="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-ui text-xs font-bold cursor-pointer"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      }

      <!-- HERO NOTES & CHARACTER CLOUD WORKSPACE MODAL -->
      <app-arena-hero-notes-modal
        [actor]="selectedActorForWorkspace()"
        [isOpen]="selectedActorForWorkspace() !== null"
        (close)="closeCharacterWorkspace()"
      />
    </div>
  `,
})
export class PartyCloudComponent {
  protected readonly arena = inject(NeuronArenaService);
  protected readonly realtime = inject(PartyRealtimeService);
  protected readonly sound = inject(PartySoundService);
  protected readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly getAccentAvatarClasses = getAccentAvatarClasses;
  protected readonly getAccentPillClasses = getAccentPillClasses;

  // Day Vibes system
  readonly vibes = CLOUD_DAY_VIBES;
  readonly selectedVibeId = signal<CloudDayVibeId>(this.loadInitialVibe());
  readonly isVibePickerOpen = signal<boolean>(false);

  readonly currentVibe = computed<CloudDayVibe>(() => {
    const id = this.selectedVibeId();
    return CLOUD_DAY_VIBES.find((v) => v.id === id) || CLOUD_DAY_VIBES[0];
  });

  readonly viewMode = signal<CloudViewMode>('CLOUD_TIMELINE');
  readonly activeLayer = signal<CloudFilterLayer>('ALL');

  // Selected Date Key (Defaults to Today 2026-11-06)
  readonly selectedDateKey = signal<string>('2026-11-06');

  // Notes Store (dateKey -> CloudDayNote[])
  readonly notesStore = signal<Record<string, CloudDayNote[]>>(this.loadInitialNotes());

  // Cached current time signals (updated once per minute outside Angular zone)
  readonly nowTimeText = signal<string>(this.getCurrentTimeString());
  readonly nowTimePercent = signal<number>(this.getCurrentTimePercent());

  // Input states for new thought/proposal/action
  readonly selectedActionType = signal<CloudItemType>('thought');
  readonly newNoteTime = signal<string>(this.getCurrentTimeString());
  readonly isTimeCustomized = signal<boolean>(false);
  readonly isTimePickerModalOpen = signal<boolean>(false);
  readonly modalDraftTime = signal<string>(this.getCurrentTimeString());
  readonly newIdeaTitle = signal<string>('');

  readonly detectedPartyActors = computed<ArenaActorCard[]>(() => {
    return detectMentionedActors(
      this.newIdeaTitle(),
      this.allActors(),
      this.activePitchActor()?.id,
    );
  });

  readonly isModalTimeNow = computed(() => {
    return this.modalDraftTime() === this.nowTimeText();
  });

  // Active Roleplay Character & Actors signals
  readonly allActors = signal<ArenaActorCard[]>([]);
  readonly quickActors = computed(() => this.allActors().slice(0, 7));
  readonly activePitchActor = signal<ArenaActorCard | null>(null);
  readonly activeSubActor = signal<ArenaActorCard | null>(null);
  readonly replyingToNote = signal<CloudDayNote | null>(null);
  readonly isCharacterPickerOpen = signal<boolean>(false);
  readonly characterPickerMode = signal<'MAIN' | 'SUB'>('MAIN');

  // Character Focus in Cloud & Personal Workspace
  readonly selectedActorFilter = signal<string | null>(null);
  readonly selectedActorForWorkspace = signal<ArenaActorCard | null>(null);

  readonly filteredActor = computed<ArenaActorCard | null>(() => {
    const id = this.selectedActorFilter();
    if (!id) return null;
    return this.allActors().find((a) => a.id === id) ?? null;
  });

  // Inspector & Space Creation
  readonly inspectedNote = signal<CloudDayNote | null>(null);
  readonly inspectedActor = signal<ArenaActorCard | null>(null);
  readonly inspectedCard = signal<ArenaDesireCard | null>(null);
  readonly activeSpaceTitle = signal<string>('Friday Chill Core');
  readonly hostActorName = signal<string>('Бунтарь Кот');
  readonly isCreateSpaceModalOpen = signal<boolean>(false);
  readonly newSpaceTitle = signal<string>('');
  readonly newSpaceDescription = signal<string>('');
  readonly newSpaceHostId = signal<string>('');

  readonly cardSupporters = signal<Record<string, string[]>>({
    'card-board-games': ['actor-misha', 'actor-kot-rebel', 'actor-solomon'],
    'card-burger-bbq': ['actor-ratatouille', 'actor-kapitan-zaryad'],
    'card-lemon-seasons': ['actor-lemon-coder', 'actor-starleader'],
  });

  readonly timelineSlots: CalendarCoordinateSlot[] = [
    {
      id: 'slot-today-memorial',
      dateKey: '2026-11-06',
      dayLabel: 'Сегодня (Пт)',
      dateNumber: '6 Ноя',
      timeSlot: '09:00 — 10:30',
      title: '🕊️ Алексей и Акин · Поминный день',
      isToday: true,
      assignedCards: ['card-board-games'],
      assignedActors: ['actor-alexey', 'actor-akin'],
    },
    {
      id: 'slot-today-overwatch-sarah',
      dateKey: '2026-11-06',
      dayLabel: 'Сегодня (Пт)',
      dateNumber: '6 Ноя',
      timeSlot: '11:40 — 13:00',
      title: '🎮 Сарра · Овервотч',
      isToday: true,
      assignedCards: ['card-overwatch-beer'],
      assignedActors: ['actor-sarah', 'actor-ginny'],
    },
    {
      id: 'slot-today-coding-session',
      dateKey: '2026-11-06',
      dayLabel: 'Сегодня (Пт)',
      dateNumber: '6 Ноя',
      timeSlot: '12:20 — 15:00',
      title: '💻 Коддинг сессия · Программист Lemon Team & ТимЛид Старлидер',
      isToday: true,
      assignedCards: ['card-lemon-seasons'],
      assignedActors: ['actor-lemon-coder', 'actor-starleader'],
    },
    {
      id: 'slot-yest-night',
      dateKey: '2026-11-05',
      dayLabel: 'Вчера (Чт)',
      dateNumber: '5 Ноя',
      timeSlot: '20:00 — 23:30',
      title: '🍕 Прошлый Чилл & Пицца',
      isToday: false,
      assignedCards: ['card-board-games'],
      assignedActors: ['actor-misha', 'actor-kot-rebel'],
    },
  ];

  // Candlestick Chart Hour Milestones (08:00 to 24:00 range)
  readonly hourMilestones = [
    { label: '08:00', icon: '🌅', minutes: 480 },
    { label: '10:00', icon: '☕', minutes: 600 },
    { label: '12:00', icon: '☀️', minutes: 720 },
    { label: '14:00', icon: '🍕', minutes: 840 },
    { label: '16:00', icon: '💡', minutes: 960 },
    { label: '18:00', icon: '🌆', minutes: 1080 },
    { label: '20:00', icon: '🎮', minutes: 1200 },
    { label: '22:00', icon: '🌙', minutes: 1320 },
    { label: '24:00', icon: '💤', minutes: 1440 },
  ];

  readonly dayPeriods = [
    { id: 'morning', title: 'Утро (06:00 — 12:00)', icon: '🌅', hours: '06:00 — 12:00', min: 360, max: 720, defaultTime: '09:00' },
    { id: 'afternoon', title: 'День (12:00 — 17:00)', icon: '☀️', hours: '12:00 — 17:00', min: 720, max: 1020, defaultTime: '13:30' },
    { id: 'evening', title: 'Вечер (17:00 — 22:00)', icon: '🌆', hours: '17:00 — 22:00', min: 1020, max: 1320, defaultTime: '19:00' },
    { id: 'night', title: 'Ночь (22:00 — 04:00)', icon: '🌙', hours: '22:00 — 04:00', min: 1320, max: 1440, defaultTime: '22:30' },
  ];

  readonly thoughtPresets: IdeaPitchPreset[] = [
    { title: 'Кофе-брейк', icon: '☕', category: 'Чат', colorTheme: 'amber' },
    { title: 'Заказать пиццу', icon: '🍕', category: 'Еда', colorTheme: 'amber' },
    { title: 'Сыграть в CS2 / Настолки', icon: '🎮', category: 'Игры', colorTheme: 'emerald' },
    { title: 'Гениальная мысль', icon: '💡', category: 'Идея', colorTheme: 'cyan' },
    { title: 'Пора отдохнуть', icon: '🏖️', category: 'Чилл', colorTheme: 'rose' },
    { title: 'Врубить музыку', icon: '🎵', category: 'Музыка', colorTheme: 'violet' },
  ];

  readonly dateTabs = computed<CloudDateTab[]>(() => {
    const store = this.notesStore();
    return [
      {
        dateKey: '2026-11-05',
        label: 'Вчера',
        subLabel: '5 Ноября',
        isToday: false,
        notesCount: (store['2026-11-05'] ?? []).length,
      },
      {
        dateKey: '2026-11-06',
        label: 'Сегодня (Пт)',
        subLabel: '6 Ноября',
        isToday: true,
        notesCount: (store['2026-11-06'] ?? []).length,
      },
      {
        dateKey: '2026-11-07',
        label: 'Завтра (Сб)',
        subLabel: '7 Ноября',
        isToday: false,
        notesCount: (store['2026-11-07'] ?? []).length,
      },
    ];
  });

  readonly activeDateNotes = computed<CloudDayNote[]>(() => {
    const store = this.notesStore();
    const key = this.selectedDateKey();
    const notes = store[key] ?? [];
    return [...notes].sort((a, b) => a.timeMinutes - b.timeMinutes);
  });

  readonly noteCountsByType = computed<Record<CloudItemType, number>>(() => {
    const counts: Record<CloudItemType, number> = {
      thought: 0,
      proposal: 0,
      action: 0,
    };
    for (const note of this.activeDateNotes()) {
      counts[note.type] = (counts[note.type] ?? 0) + 1;
    }
    return counts;
  });

  readonly actorNotesCountMap = computed<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const note of this.activeDateNotes()) {
      const participantIds = new Set<string>();
      if (note.actorId) participantIds.add(note.actorId);
      if (note.subActorId) participantIds.add(note.subActorId);
      if (note.partyActorIds) {
        for (const pid of note.partyActorIds) participantIds.add(pid);
      }
      for (const pid of participantIds) {
        map[pid] = (map[pid] ?? 0) + 1;
      }
    }
    return map;
  });

  readonly activeDateFormatted = computed<string>(() => {
    const key = this.selectedDateKey();
    if (key === '2026-11-06') return 'Сегодня (Пятница, 6 Ноября)';
    if (key === '2026-11-05') return 'Вчера (Четверг, 5 Ноября)';
    if (key === '2026-11-07') return 'Завтра (Суббота, 7 Ноября)';
    return key;
  });

  readonly visibleNotes = computed<CloudDayNote[]>(() => {
    let notes = this.activeDateNotes();
    const actorId = this.selectedActorFilter();
    if (actorId) {
      notes = notes.filter(
        (n) =>
          n.actorId === actorId ||
          n.subActorId === actorId ||
          (n.partyActorIds?.includes(actorId) ?? false),
      );
    }
    const layer = this.activeLayer();
    if (layer === 'ALL') return notes;
    if (layer === 'THOUGHTS') return notes.filter((n) => n.type === 'thought');
    if (layer === 'PROPOSALS') return notes.filter((n) => n.type === 'proposal');
    if (layer === 'ACTIONS') return notes.filter((n) => n.type === 'action');
    return notes;
  });

  readonly notesByPeriod = computed<Record<string, CloudDayNote[]>>(() => {
    const map: Record<string, CloudDayNote[]> = {
      morning: [],
      afternoon: [],
      evening: [],
      night: [],
    };
    const notes = this.visibleNotes();
    for (const p of this.dayPeriods) {
      map[p.id] = notes.filter((n) => n.timeMinutes >= p.min && n.timeMinutes < p.max);
    }
    return map;
  });

  readonly CLUSTER_GAP_MINUTES = 30;
  readonly clusterActiveIndices = signal<Record<string, number>>({});

  readonly groupedTimelineNotes = computed<TimelineCluster[]>(() => {
    const notes = this.visibleNotes();
    if (notes.length === 0) return [];

    const clusters: TimelineCluster[] = [];
    let currentGroup: CloudDayNote[] = [];

    for (const note of notes) {
      if (currentGroup.length === 0) {
        currentGroup.push(note);
      } else {
        const clusterStart = currentGroup[0].timeMinutes;
        if (note.timeMinutes - clusterStart <= this.CLUSTER_GAP_MINUTES) {
          currentGroup.push(note);
        } else {
          clusters.push(this.buildTimelineCluster(currentGroup));
          currentGroup = [note];
        }
      }
    }

    if (currentGroup.length > 0) {
      clusters.push(this.buildTimelineCluster(currentGroup));
    }

    return clusters;
  });

  readonly inputPlaceholder = computed(() => {
    const actor = this.activePitchActor();
    const sub = this.activeSubActor();
    const name = actor ? actor.name : 'Участник';
    const duoName = sub ? `${name} & ${sub.name}` : name;
    const rep = this.replyingToNote();
    if (rep) {
      return `«${duoName}» в ответ для ${rep.actorName}... (нажмите Enter)`;
    }
    const type = this.selectedActionType();
    if (type === 'thought') {
      return `«${duoName}»: поделиться мыслью... (нажмите Enter)`;
    }
    if (type === 'proposal') {
      return `«${duoName}»: предложить идею... (нажмите Enter)`;
    }
    return `«${duoName}»: совершить экшен... (нажмите Enter)`;
  });

  readonly synergyPercent = computed(() => {
    const notes = this.activeDateNotes();
    let totalVotes = 0;
    for (const n of notes) {
      totalVotes += n.votesCount;
    }
    return Math.min(99, 70 + Math.floor(totalVotes * 1.8));
  });

  readonly gravityPull = computed(() => {
    return (8.0 + (this.synergyPercent() - 70) * 0.12).toFixed(1);
  });

  constructor() {
    this.arena.leadActor$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((actor) => {
      if (actor && !this.activePitchActor()) {
        this.activePitchActor.set(actor);
        this.hostActorName.set(actor.name);
      }
    });

    this.arena.actors$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((actors) => {
      this.allActors.set(actors);
      if (!this.activePitchActor() && actors.length > 0) {
        this.activePitchActor.set(actors[0]);
      }
    });

    this.arena.notesMap$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((map) => {
      this.notesStore.set(map);
    });

    combineLatest([this.arena.actors$, this.route.queryParams])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([actors, params]) => {
        const q = (params['workspace'] || params['actor'] || params['hero'])?.toLowerCase();
        if (q && actors.length > 0) {
          const found = actors.find(
            (a) =>
              a.id.toLowerCase() === q ||
              a.id.toLowerCase() === `actor-${q}` ||
              a.handle.toLowerCase() === q ||
              a.name.toLowerCase().includes(q),
          );
          if (found && this.selectedActorForWorkspace()?.id !== found.id) {
            this.selectedActorForWorkspace.set(found);
            this.selectedActorFilter.set(found.id);
          }
        }
      });

    if (typeof window !== 'undefined') {
      this.ngZone.runOutsideAngular(() => {
        const timerId = window.setInterval(() => {
          const nextText = this.getCurrentTimeString();
          if (nextText !== this.nowTimeText()) {
            this.nowTimeText.set(nextText);
            this.nowTimePercent.set(this.getCurrentTimePercent());
          }
        }, 60_000);
        this.destroyRef.onDestroy(() => window.clearInterval(timerId));
      });
    }
  }

  isCloudView(): boolean {
    const m = this.viewMode();
    return m === 'CLOUD_TIMELINE' || m === 'ORBIT';
  }

  isFeedView(): boolean {
    const m = this.viewMode();
    return m === 'DAY_FEED' || m === 'CALENDAR_TIMELINE';
  }

  isTodaySelected(): boolean {
    return this.selectedDateKey() === '2026-11-06';
  }

  selectDate(dateKey: string): void {
    this.selectedDateKey.set(dateKey);
    this.sound.playClick();
  }

  getActiveDateFormatted(): string {
    return this.activeDateFormatted();
  }

  countNotesByType(type: CloudItemType): number {
    return this.noteCountsByType()[type] ?? 0;
  }

  getTopLaneNotes(): CloudDayNote[] {
    return this.visibleNotes().filter((_, idx) => idx % 2 === 0);
  }

  getBottomLaneNotes(): CloudDayNote[] {
    return this.visibleNotes().filter((_, idx) => idx % 2 === 1);
  }

  // Altitude stem height for trading candlestick chart (staggered across 3 tiers)
  getNoteStemHeight(index: number): number {
    return (index % 3) * 115 + 40;
  }

  getAccentStemClasses(accent: ArenaAccentColor): string {
    switch (accent) {
      case 'amber':
        return 'bg-gradient-to-t from-amber-500 via-amber-400 to-amber-300 shadow-amber-500/20';
      case 'emerald':
        return 'bg-gradient-to-t from-emerald-500 via-emerald-400 to-emerald-300 shadow-emerald-500/20';
      case 'indigo':
        return 'bg-gradient-to-t from-indigo-500 via-indigo-400 to-indigo-300 shadow-indigo-500/20';
      case 'rose':
        return 'bg-gradient-to-t from-rose-500 via-rose-400 to-rose-300 shadow-rose-500/20';
      case 'cyan':
        return 'bg-gradient-to-t from-cyan-500 via-cyan-400 to-cyan-300 shadow-cyan-500/20';
      case 'violet':
        return 'bg-gradient-to-t from-violet-500 via-violet-400 to-violet-300 shadow-violet-500/20';
      default:
        return 'bg-amber-400';
    }
  }

  getAccentGlowClasses(accent: ArenaAccentColor): string {
    switch (accent) {
      case 'amber':
        return 'bg-amber-500 ring-amber-400/50';
      case 'emerald':
        return 'bg-emerald-500 ring-emerald-400/50';
      case 'indigo':
        return 'bg-indigo-500 ring-indigo-400/50';
      case 'rose':
        return 'bg-rose-500 ring-rose-400/50';
      case 'cyan':
        return 'bg-cyan-500 ring-cyan-400/50';
      case 'violet':
        return 'bg-violet-500 ring-violet-400/50';
      default:
        return 'bg-amber-500 ring-amber-400/50';
    }
  }

  getClusterPinClasses(isCluster: boolean, accent: ArenaAccentColor): string {
    const base = isCluster
      ? 'w-4 h-4 rounded-full border-2 border-surface ring-4 transition-transform group-hover:scale-125 cursor-pointer pointer-events-auto'
      : 'w-3 h-3 rounded-full border-2 border-surface ring-2 transition-transform group-hover:scale-125 cursor-pointer pointer-events-auto';
    return `${base} ${this.getAccentGlowClasses(accent)}`;
  }

  // Converts minutes (08:00=480 to 24:00=1440) to percentage (6% to 94%)
  getTimelinePercent(timeMinutes: number): number {
    const startMins = 480; // 08:00
    const endMins = 1440; // 24:00
    const clamped = Math.max(startMins, Math.min(endMins, timeMinutes));
    const pct = ((clamped - startMins) / (endMins - startMins)) * 88 + 6;
    return Math.round(pct * 10) / 10;
  }

  getCurrentTimePercent(): number {
    const now = new Date();
    const hours = now.getHours() || 13;
    const mins = now.getMinutes() || 45;
    return this.getTimelinePercent(hours * 60 + mins);
  }

  currentTimeString(): string {
    return this.nowTimeText();
  }

  onTimelineRoadClick(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const rawRatio = Math.max(0, Math.min(1, clickX / rect.width));

    // Normalize from the 6% to 94% span
    const normalized = Math.max(0, Math.min(1, (rawRatio - 0.06) / 0.88));
    const mins = Math.round(480 + normalized * (1440 - 480));
    const h = Math.floor(mins / 60);
    const m = Math.round((mins % 60) / 15) * 15;
    const formatted = `${String(h).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    this.newNoteTime.set(formatted);
    this.sound.playTick();
  }

  setTimeForSlot(time: string): void {
    this.newNoteTime.set(time);
    this.sound.playTick();
  }

  getNotesForPeriod(min: number, max: number): CloudDayNote[] {
    return this.visibleNotes().filter((n) => n.timeMinutes >= min && n.timeMinutes < max);
  }

  getInputPlaceholder(): string {
    return this.inputPlaceholder();
  }

  getTypeLabel(type: CloudItemType): string {
    if (type === 'thought') return 'Мысль';
    if (type === 'proposal') return 'Идея';
    return 'Экшен';
  }

  getTypeEmoji(type: CloudItemType): string {
    if (type === 'thought') return '💭';
    if (type === 'proposal') return '💡';
    return '⚡';
  }

  getNoteBorderClass(accent: ArenaAccentColor): string {
    switch (accent) {
      case 'amber':
        return 'border-amber-400';
      case 'emerald':
        return 'border-emerald-500';
      case 'indigo':
        return 'border-indigo-400';
      case 'rose':
        return 'border-rose-400';
      case 'cyan':
        return 'border-cyan-400';
      case 'violet':
        return 'border-violet-400';
      default:
        return 'border-amber-300';
    }
  }

  appendActorMention(actor: ArenaActorCard): void {
    const current = this.newIdeaTitle().trim();
    if (!current) {
      this.newIdeaTitle.set(`+ ${actor.name}`);
    } else {
      this.newIdeaTitle.set(`${current} + ${actor.name}`);
    }
  }

  submitNoteOrIdea(): void {
    const text = this.newIdeaTitle().trim();
    if (!text) return;

    const actor = this.activePitchActor();
    const dateKey = this.selectedDateKey();
    const time = this.newNoteTime() || this.getCurrentTimeString();
    const [h, m] = time.split(':').map(Number);
    const timeMinutes = (h || 12) * 60 + (m || 0);
    const type = this.selectedActionType();

    // Auto-detect mentioned actors in text
    const detected = detectMentionedActors(text, this.allActors(), actor?.id);
    const explicitSubActor = this.activeSubActor();
    const subActor = explicitSubActor || (detected.length > 0 ? detected[0] : null);

    const initialParty = detected.map((a) => a.id);
    if (subActor && !initialParty.includes(subActor.id)) {
      initialParty.push(subActor.id);
    }
    const partyActorIds = Array.from(new Set(initialParty));
    const allActorsMap = new Map(this.allActors().map((a) => [a.id, a]));
    const partyActorNames = partyActorIds.map((id) => allActorsMap.get(id)?.name || id);

    const likedByActors = [
      ...(actor ? [{ actorId: actor.id, actorName: actor.name, avatarIcon: actor.avatarIcon, moodEmoji: '✨' }] : []),
      ...(subActor && subActor.id !== actor?.id
        ? [{ actorId: subActor.id, actorName: subActor.name, avatarIcon: subActor.avatarIcon, moodEmoji: '🤝' }]
        : []),
      ...detected
        .filter((a) => a.id !== actor?.id && a.id !== subActor?.id)
        .map((a) => ({ actorId: a.id, actorName: a.name, avatarIcon: a.avatarIcon, moodEmoji: '🤝' })),
    ];

    const supporters = new Set<string>();
    if (actor) supporters.add(actor.id);
    if (subActor) supporters.add(subActor.id);
    for (const pid of partyActorIds) supporters.add(pid);

    const rep = this.replyingToNote();
    const replyToNoteId = rep?.id;
    const replyToAuthorName = rep?.actorName;
    const replyToTextSnippet = rep ? (rep.text.length > 55 ? rep.text.slice(0, 52) + '...' : rep.text) : undefined;

    const newNote: CloudDayNote = {
      id: `note-${Date.now()}`,
      dateKey,
      time,
      timeMinutes,
      type,
      actorId: actor?.id || 'actor-anon',
      actorName: actor?.name || 'Участник',
      actorAvatar: actor?.avatarIcon || 'kot-rebel',
      actorAccent: actor?.accentColor || 'amber',
      actorTitle: actor?.title || '',
      subActorId: subActor?.id,
      subActorName: subActor?.name,
      subActorAvatar: subActor?.avatarIcon,
      subActorAccent: subActor?.accentColor,
      replyToNoteId,
      replyToAuthorName,
      replyToTextSnippet,
      text,
      supporters: Array.from(supporters),
      votesCount: supporters.size,
      moodEmoji: type === 'thought' ? '💭' : type === 'proposal' ? '💡' : '⚡',
      createdAt: new Date().toISOString(),
      partyActorIds: partyActorIds.length > 0 ? partyActorIds : undefined,
      partyActorNames: partyActorNames.length > 0 ? partyActorNames : undefined,
      likedByActors: likedByActors.length > 0 ? likedByActors : undefined,
    };

    this.notesStore.update((store) => {
      const current = store[dateKey] ? [...store[dateKey]] : [];
      const updated = { ...store, [dateKey]: [...current, newNote] };
      this.persistNotes(updated);
      return updated;
    });

    this.arena.addCloudNote(newNote);

    this.newIdeaTitle.set('');
    this.activeSubActor.set(null);
    this.replyingToNote.set(null);
    this.sound.playWin();

    const partyMentionStr = partyActorNames.length > 0 ? ` (в пати: ${partyActorNames.join(', ')})` : '';
    const replyMentionStr = replyToAuthorName ? ` (в ответ для ${replyToAuthorName})` : '';
    this.realtime.broadcastEvent({
      type: 'CARD_PLAYED',
      actorName: newNote.actorName,
      actorIcon: newNote.actorAvatar,
      roomTitle: this.activeSpaceTitle(),
      message: `${type === 'thought' ? 'поделился мыслью' : type === 'proposal' ? 'выдвинул предложение' : 'совершил экшен'} «${text}»${replyMentionStr}${partyMentionStr} на ${time}!`,
    });
  }

  submitPitchIdea(): void {
    this.submitNoteOrIdea();
  }

  pitchPreset(preset: IdeaPitchPreset): void {
    this.newIdeaTitle.set(preset.title);
    this.submitNoteOrIdea();
  }

  getResolvedLikes(note: CloudDayNote): NoteActorLike[] {
    if (note.likedByActors && note.likedByActors.length > 0) {
      return note.likedByActors;
    }
    if (note.supporters && note.supporters.length > 0) {
      const actorsMap = new Map(this.allActors().map((a) => [a.id, a]));
      return note.supporters
        .map((supId) => actorsMap.get(supId))
        .filter((a): a is ArenaActorCard => Boolean(a))
        .map((a) => ({
          actorId: a.id,
          actorName: a.name,
          avatarIcon: a.avatarIcon,
          moodEmoji: '❤️',
          accentColor: a.accentColor,
        }));
    }
    return [];
  }

  getVisibleLikes(note: CloudDayNote): NoteActorLike[] {
    const likes = this.getResolvedLikes(note);
    return likes.slice(0, 3);
  }

  getHiddenLikes(note: CloudDayNote): NoteActorLike[] {
    const likes = this.getResolvedLikes(note);
    return likes.length > 3 ? likes.slice(3) : [];
  }

  getHiddenLikesNames(note: CloudDayNote): string {
    const hidden = this.getHiddenLikes(note);
    return hidden.map((l) => l.actorName).join(', ');
  }

  getHiddenLikesTooltip(note: CloudDayNote): string {
    const hidden = this.getHiddenLikes(note);
    if (hidden.length === 0) return '';
    return `Оценили: ${hidden.map((l) => l.actorName).join(', ')}`;
  }

  hasActorLiked(note: CloudDayNote): boolean {
    const actorId = this.activePitchActor()?.id;
    if (!actorId) return false;
    const likes = this.getResolvedLikes(note);
    return likes.some((l) => l.actorId === actorId);
  }

  voteForNote(noteId: string, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }

    const currentActor = this.activePitchActor();
    const actorId = currentActor ? currentActor.id : 'actor-anon';
    const dateKey = this.selectedDateKey();

    this.notesStore.update((store) => {
      const list = store[dateKey] ?? [];
      const updatedList = list.map((n) => {
        if (n.id === noteId) {
          const resolvedLikes = this.getResolvedLikes(n);
          const alreadyLikedIndex = resolvedLikes.findIndex((l) => l.actorId === actorId);

          let nextLikes: NoteActorLike[];
          let nextSupporters: string[];
          let nextVotes: number;

          if (alreadyLikedIndex !== -1) {
            // Toggle unlike
            nextLikes = resolvedLikes.filter((_, i) => i !== alreadyLikedIndex);
            nextSupporters = n.supporters.filter((id) => id !== actorId);
            nextVotes = Math.max(0, n.votesCount - 1);
          } else {
            // Add personalized like
            const newLike: NoteActorLike = {
              actorId,
              actorName: currentActor?.name || 'Участник',
              avatarIcon: currentActor?.avatarIcon || 'person',
              moodEmoji: '❤️',
              accentColor: currentActor?.accentColor,
            };
            nextLikes = [...resolvedLikes, newLike];
            nextSupporters = n.supporters.includes(actorId) ? n.supporters : [...n.supporters, actorId];
            nextVotes = n.votesCount + 1;
          }

          return {
            ...n,
            supporters: nextSupporters,
            votesCount: nextVotes,
            likedByActors: nextLikes,
          };
        }
        return n;
      });
      const updated = { ...store, [dateKey]: updatedList };
      this.persistNotes(updated);
      return updated;
    });

    if (this.inspectedNote()?.id === noteId) {
      this.inspectedNote.update((n) => {
        if (!n) return null;
        const currentInStore = this.notesStore()[dateKey]?.find((item) => item.id === noteId);
        return currentInStore || n;
      });
    }

    this.arena.toggleNoteLike(noteId, actorId);
    this.sound.playTick(1.2);

    this.realtime.broadcastEvent({
      type: 'VOTE_CAST',
      actorName: currentActor?.name || 'Участник',
      actorIcon: currentActor?.avatarIcon || 'person',
      roomTitle: this.activeSpaceTitle(),
      message: `поддержал мысль в облаке (+1)!`,
    });
  }

  getLikesWord(count: number): string {
    if (count % 10 === 1 && count % 100 !== 11) return 'лайк';
    if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'лайка';
    return 'лайков';
  }

  getPartyNames(note: CloudDayNote): string {
    if (!note.partyActorIds || note.partyActorIds.length === 0) return '';
    return note.partyActorIds
      .map((id) => this.arena.getActor(id)?.name || id)
      .join(', ');
  }

  voteForCard(cardId: string, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    const actor = this.activePitchActor();
    const actorId = actor ? actor.id : 'actor-anon';

    this.arena.voteForDesireCard(cardId, actorId);
    this.cardSupporters.update((map) => {
      const cur = map[cardId] || [];
      return cur.includes(actorId) ? map : { ...map, [cardId]: [...cur, actorId] };
    });

    this.sound.playTick(1.2);
    this.realtime.broadcastEvent({
      type: 'VOTE_CAST',
      actorName: actor?.name || 'Участник',
      actorIcon: actor?.avatarIcon || 'person',
      roomTitle: this.activeSpaceTitle(),
      message: `поддержал карточку в пространстве!`,
    });
  }

  deleteNote(noteId: string, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    const dateKey = this.selectedDateKey();
    this.notesStore.update((store) => {
      const list = (store[dateKey] ?? []).filter((n) => n.id !== noteId);
      const updated = { ...store, [dateKey]: list };
      this.persistNotes(updated);
      return updated;
    });
    this.sound.playClick();
  }

  inspectNote(note: CloudDayNote): void {
    this.inspectedNote.set(note);
    const found = this.allActors().find((a) => a.id === note.actorId);
    this.inspectedActor.set(found || null);
    this.sound.playClick();
  }

  closeInspectModal(): void {
    this.inspectedNote.set(null);
    this.inspectedActor.set(null);
  }

  startReply(note: CloudDayNote, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.replyingToNote.set(note);
    if (note.time) {
      const [h, m] = note.time.split(':').map(Number);
      if (!isNaN(h) && !isNaN(m)) {
        const totalMinutes = (h * 60 + m + 5) % 1440;
        const newH = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
        const newM = (totalMinutes % 60).toString().padStart(2, '0');
        this.newNoteTime.set(`${newH}:${newM}`);
      }
    }
    try {
      const el = document.getElementById('cloud-composer');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } catch {}
  }

  startReplyFromModal(note: CloudDayNote): void {
    this.startReply(note);
    this.closeInspectModal();
  }

  cancelReply(): void {
    this.replyingToNote.set(null);
  }

  getRepliesForNote(noteId: string): CloudDayNote[] {
    const active = this.activeDateNotes();
    return active.filter((n) => n.replyToNoteId === noteId);
  }

  jumpToRepliedNote(noteId?: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (!noteId) return;
    const found = this.activeDateNotes().find((n) => n.id === noteId);
    if (found) {
      this.inspectNote(found);
    }
  }

  selectPitchActorFromInspect(): void {
    const note = this.inspectedNote();
    if (!note) return;
    const actor = this.allActors().find((a) => a.id === note.actorId);
    if (actor) {
      this.selectPitchActor(actor);
    }
    this.closeInspectModal();
  }

  deleteInspectedNote(): void {
    const note = this.inspectedNote();
    if (!note) return;
    this.arena.deleteNote(note.id);
    this.deleteNote(note.id);
    this.closeInspectModal();
  }

  adoptInspectedNoteToPrivate(): void {
    const note = this.inspectedNote();
    if (!note) return;
    const adopted = this.arena.adoptNoteToPrivate(note.id);
    this.sound.playWin();
    if (adopted) {
      this.inspectedNote.set(adopted);
    }
  }

  togglePinInspectedToHero(): void {
    const note = this.inspectedNote();
    if (!note) return;
    this.arena.togglePinToHero(note.id);
    this.inspectedNote.update((n) => (n ? { ...n, isPinnedToHero: !n.isPinnedToHero } : null));
    this.sound.playClick();
  }

  togglePinInspectedToCloud(): void {
    const note = this.inspectedNote();
    if (!note) return;
    this.arena.togglePinToCloud(note.id);
    this.inspectedNote.update((n) => (n ? { ...n, isPinnedToCloud: !n.isPinnedToCloud } : null));
    this.sound.playClick();
  }

  selectActorFilter(actorId: string | null): void {
    this.selectedActorFilter.set(actorId);
    this.sound.playClick();
  }

  openCharacterWorkspace(actor: ArenaActorCard): void {
    this.selectedActorForWorkspace.set(actor);
    this.sound.playClick();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { workspace: actor.id },
      queryParamsHandling: 'merge',
    });
  }

  closeCharacterWorkspace(): void {
    this.selectedActorForWorkspace.set(null);
    if (
      this.route.snapshot.queryParams['workspace'] ||
      this.route.snapshot.queryParams['actor'] ||
      this.route.snapshot.queryParams['hero']
    ) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { workspace: null, actor: null, hero: null },
        queryParamsHandling: 'merge',
      });
    }
  }

  openWorkspaceFromInspectedNote(): void {
    const note = this.inspectedNote();
    if (!note) return;
    const actor = this.allActors().find((a) => a.id === note.actorId);
    if (actor) {
      this.closeInspectModal();
      this.openCharacterWorkspace(actor);
    }
  }

  getActorNotesCountForDate(actorId: string): number {
    return this.actorNotesCountMap()[actorId] ?? 0;
  }

  buildTimelineCluster(notes: CloudDayNote[]): TimelineCluster {
    const isCluster = notes.length > 1;
    const first = notes[0];
    const last = notes[notes.length - 1];

    const avgMinutes = Math.round(
      notes.reduce((acc, n) => acc + n.timeMinutes, 0) / notes.length
    );

    const timeLabel = (!isCluster || first.time === last.time)
      ? first.time
      : `${first.time}–${last.time}`;

    const timeSpanLabel = isCluster
      ? (first.time === last.time
          ? `${first.time} (${notes.length} мыслей в стопке)`
          : `${first.time}–${last.time} (${notes.length} мыслей в стопке)`)
      : undefined;

    const id = isCluster
      ? `cluster-${first.id}-${notes.length}-${first.timeMinutes}`
      : first.id;

    return {
      id,
      timeMinutes: avgMinutes,
      time: timeLabel,
      timeSpanLabel,
      notes,
      isCluster,
    };
  }

  getClusterActiveIndex(clusterId: string): number {
    return this.clusterActiveIndices()[clusterId] ?? 0;
  }

  getClusterActiveNote(cluster: TimelineCluster): CloudDayNote {
    const idx = this.getClusterActiveIndex(cluster.id);
    const clamped = Math.max(0, Math.min(cluster.notes.length - 1, idx));
    return cluster.notes[clamped] ?? cluster.notes[0];
  }

  setClusterIndex(clusterId: string, index: number, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.clusterActiveIndices.update((map) => ({ ...map, [clusterId]: index }));
    this.sound.playTick();
  }

  prevClusterNote(clusterId: string, total: number, event: MouseEvent): void {
    event.stopPropagation();
    const current = this.getClusterActiveIndex(clusterId);
    const prev = (current - 1 + total) % total;
    this.clusterActiveIndices.update((map) => ({ ...map, [clusterId]: prev }));
    this.sound.playTick();
  }

  nextClusterNote(clusterId: string, total: number, event: MouseEvent): void {
    event.stopPropagation();
    const current = this.getClusterActiveIndex(clusterId);
    const next = (current + 1) % total;
    this.clusterActiveIndices.update((map) => ({ ...map, [clusterId]: next }));
    this.sound.playTick();
  }

  getInspectedNoteCluster(): TimelineCluster | null {
    const note = this.inspectedNote();
    if (!note) return null;
    return this.groupedTimelineNotes().find((c) => c.isCluster && c.notes.some((n) => n.id === note.id)) ?? null;
  }

  getInspectedNoteClusterIndex(cluster: TimelineCluster): number {
    const note = this.inspectedNote();
    if (!note) return 0;
    const idx = cluster.notes.findIndex((n) => n.id === note.id);
    return idx >= 0 ? idx : 0;
  }

  prevInspectedClusterNote(cluster: TimelineCluster): void {
    const current = this.getInspectedNoteClusterIndex(cluster);
    const prev = (current - 1 + cluster.notes.length) % cluster.notes.length;
    this.inspectNote(cluster.notes[prev]);
  }

  nextInspectedClusterNote(cluster: TimelineCluster): void {
    const current = this.getInspectedNoteClusterIndex(cluster);
    const next = (current + 1) % cluster.notes.length;
    this.inspectNote(cluster.notes[next]);
  }

  toggleCharacterPicker(): void {
    this.openCharacterPickerForMain();
  }

  openCharacterPickerForMain(): void {
    this.characterPickerMode.set('MAIN');
    this.isCharacterPickerOpen.set(true);
    this.sound.playClick();
  }

  openCharacterPickerForSub(): void {
    this.characterPickerMode.set('SUB');
    this.isCharacterPickerOpen.set(true);
    this.sound.playClick();
  }

  setSubActor(actor: ArenaActorCard | null): void {
    this.activeSubActor.set(actor);
    this.sound.playTick(1.1);
  }

  clearSubActor(): void {
    this.activeSubActor.set(null);
    this.sound.playClick();
  }

  closeCharacterPickerModal(): void {
    this.isCharacterPickerOpen.set(false);
  }

  selectPitchActor(actor: ArenaActorCard): void {
    if (this.characterPickerMode() === 'SUB') {
      this.activeSubActor.set(actor);
    } else {
      this.activePitchActor.set(actor);
      this.hostActorName.set(actor.name);
    }
    this.isCharacterPickerOpen.set(false);
    this.sound.playTick(1.1);
  }

  openCreateSpaceModal(): void {
    const current = this.activePitchActor();
    this.newSpaceTitle.set(current ? `Чилл-Зона «${current.name}»` : 'Friday Chill Core');
    this.newSpaceDescription.set('Открытое облачное пространство для выбора формата вечеринки и совместного досуга.');
    this.newSpaceHostId.set(current?.id || 'actor-kot-rebel');
    this.isCreateSpaceModalOpen.set(true);
  }

  closeCreateSpaceModal(): void {
    this.newSpaceTitle.set('');
    this.newSpaceDescription.set('');
    this.newSpaceHostId.set('');
    this.isCreateSpaceModalOpen.set(false);
  }

  onHostChange(hostId: string): void {
    this.newSpaceHostId.set(hostId);
    const actor = this.allActors().find((a) => a.id === hostId);
    if (actor) {
      this.newSpaceTitle.set(`Чилл-Зона «${actor.name}»`);
    }
  }

  submitCreateSpace(): void {
    const title = this.newSpaceTitle().trim() || 'Friday Chill Core';
    const hostId = this.newSpaceHostId();
    const host = this.allActors().find((a) => a.id === hostId) || this.activePitchActor();

    if (host) {
      this.selectPitchActor(host);
      this.hostActorName.set(host.name);
    }

    this.activeSpaceTitle.set(title);
    this.realtime.createRoom({
      title,
      description: this.newSpaceDescription().trim(),
      icon: 'local_pizza',
      themeColor: 'amber',
      scheduledLabel: 'Пятница, 20:00',
      tags: ['чилл', 'облако', 'синергия'],
    });

    this.closeCreateSpaceModal();
    this.sound.playWin();
  }

  scheduleActiveToSlot(slot: CalendarCoordinateSlot): void {
    const actor = this.activePitchActor();
    if (actor && !slot.assignedActors.includes(actor.id)) {
      slot.assignedActors.push(actor.id);
    }

    this.sound.playTick(1.3);
    this.realtime.broadcastEvent({
      type: 'CARD_PLAYED',
      actorName: actor?.name || 'Лидер',
      actorIcon: actor?.avatarIcon || 'person',
      roomTitle: slot.title,
      message: `закрепил активность в слоте «${slot.dayLabel}, ${slot.timeSlot}»!`,
    });
  }

  selectVibe(vibeId: CloudDayVibeId): void {
    this.selectedVibeId.set(vibeId);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('lemon-party:day-vibe', vibeId);
      } catch {}
    }
    this.isVibePickerOpen.set(false);
    this.sound.playWin();
  }

  toggleVibePicker(): void {
    this.isVibePickerOpen.update((open) => !open);
    this.sound.playClick();
  }

  closeVibePickerModal(): void {
    this.isVibePickerOpen.set(false);
  }

  private loadInitialVibe(): CloudDayVibeId {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('lemon-party:day-vibe') as CloudDayVibeId;
        if (stored && CLOUD_DAY_VIBES.some((v) => v.id === stored)) {
          return stored;
        }
      } catch {}
    }
    return 'CHRONO_DAYFLOW';
  }

  private getCurrentTimeString(): string {
    const now = new Date();
    const h = String(now.getHours() || 13).padStart(2, '0');
    const m = String(now.getMinutes() || 45).padStart(2, '0');
    return `${h}:${m}`;
  }

  private loadInitialNotes(): Record<string, CloudDayNote[]> {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_NOTES_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            const merged: Record<string, CloudDayNote[]> = { ...parsed };
            for (const [date, seedNotes] of Object.entries(SEED_HERO_CLOUD_NOTES)) {
              const existing = merged[date] || [];
              const seedMap = new Map(seedNotes.map((n) => [n.id, n]));
              const updated = existing.map((n) => seedMap.get(n.id) ?? n);
              const existingIds = new Set(existing.map((n) => n.id));
              const missing = seedNotes.filter((n) => !existingIds.has(n.id));
              merged[date] = [...updated, ...missing];
            }
            return merged;
          }
        }
      } catch {
        // Local storage unreadable
      }
    }
    return SEED_NOTES;
  }

  private persistNotes(store: Record<string, CloudDayNote[]>): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_NOTES_KEY, JSON.stringify(store));
      } catch {
        // Storage quota or restriction
      }
    }
  }
}
