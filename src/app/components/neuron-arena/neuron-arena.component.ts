import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NeuronArenaService } from '../../core/services/neuron-arena.service';
import { PartyRealtimeService } from '../../core/services/party-realtime.service';
import { ActorAvatarComponent } from './actor-avatar.component';
import { ArenaModalsComponent } from './arena-modals.component';

@Component({
  selector: 'app-neuron-arena',
  standalone: true,
  imports: [
    AsyncPipe,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ActorAvatarComponent,
    ArenaModalsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-space-lg">
      <!-- 1. TOP HERO & MULTIROOM & REAL-TIME STRIP -->
      <section
        class="bg-surface-container-lowest rounded-2xl p-space-md shadow-xs border border-outline-variant/25 flex flex-col gap-space-md"
      >
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
          <div class="flex items-start sm:items-center gap-space-md">
            <div
              class="w-12 h-12 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center flex-shrink-0 shadow-xs"
            >
              <span class="material-symbols-rounded text-2xl" style="font-variation-settings: 'FILL' 1">
                celebration
              </span>
            </div>
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h1 class="font-headline-sm text-lg font-bold text-on-surface">
                  Lemon Party · Мультирум, Хроно-Облако и Тимбилдинг
                </h1>
                <span
                  class="font-label-code-sm text-[11px] px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-semibold"
                >
                  app scope: party.*
                </span>
                <span
                  class="inline-flex items-center gap-1.5 font-label-code-sm text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  Real-Time SSE/WS ({{ realtime.latencyMs() }}ms)
                </span>
              </div>
              <p class="font-body-sm text-xs text-on-surface-variant mt-1 max-w-4xl">
                Пространство реального времени для выбора досуга. Переключайтесь между <strong>Мультирум-сессиями</strong>,
                исследуйте парящие объекты в <strong>Хроно-Облаке</strong> и разыгрывайте карточки желаний.
              </p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2 flex-shrink-0">
            <button
              type="button"
              (click)="arena.openNewDesireCardModal()"
              class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container-high hover:bg-primary-container text-on-surface hover:text-on-primary-container font-label-ui text-xs font-bold transition-all"
            >
              <span class="material-symbols-rounded text-base">style</span>
              <span>+ Карточка Желания</span>
            </button>
            <button
              type="button"
              (click)="arena.openNewActorModal()"
              class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container-high hover:bg-primary-container text-on-surface hover:text-on-primary-container font-label-ui text-xs font-bold transition-all"
            >
              <span class="material-symbols-rounded text-base">person_add</span>
              <span>+ Персонаж</span>
            </button>
            <button
              type="button"
              (click)="arena.openNewParadoxModal()"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-on-primary font-label-ui text-xs font-bold hover:opacity-95 transition-all shadow-xs"
            >
              <span class="material-symbols-rounded text-base">flare</span>
              <span>+ Новый Спор / Игра</span>
            </button>
          </div>
        </div>

        <!-- 2. MULTIROOM SELECTOR BAR -->
        <div class="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-label-ui text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
              <span class="material-symbols-rounded text-base text-primary">meeting_room</span>
              Комнаты Multiroom:
            </span>

            @for (room of (realtime.rooms$ | async) ?? []; track room.id) {
              <button
                type="button"
                (click)="realtime.switchRoom(room.id)"
                class="px-3 py-1.5 rounded-xl font-label-ui text-xs font-semibold transition-all border inline-flex items-center gap-1.5"
                [class]="
                  (realtime.activeRoomId$ | async) === room.id
                    ? 'bg-primary text-on-primary border-primary shadow-xs font-bold'
                    : 'bg-surface-container-lowest text-on-surface hover:border-primary/50 border-outline-variant/30'
                "
              >
                <span>{{ room.title }}</span>
                <span class="opacity-75 text-[10px] font-label-code-sm">({{ room.participantsCount }}👥)</span>
              </button>
            }
          </div>

          <div class="flex items-center gap-2 self-start md:self-center">
            @if (realtime.getActiveRoom(); as currentRoom) {
              <div class="text-[11px] font-label-code-sm text-on-surface-variant flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Слот: <strong>{{ currentRoom.scheduledLabel }}</strong></span>
              </div>
            }
          </div>
        </div>

        <!-- 3. LIVE EVENT STREAM TICKER -->
        @if ((realtime.events$ | async)?.[0]; as latestEvent) {
          <div class="px-3 py-2 rounded-xl bg-primary-container/20 border border-primary/25 flex items-center justify-between gap-3 text-xs font-body-sm">
            <div class="flex items-center gap-2 min-w-0">
              <span class="material-symbols-rounded text-primary text-base flex-shrink-0 animate-bounce">
                sensors
              </span>
              <span class="font-label-ui font-bold text-primary flex-shrink-0">Real-Time Событие:</span>
              <span class="text-on-surface truncate">
                <strong>{{ latestEvent.actorName }}</strong> {{ latestEvent.message }}
              </span>
            </div>
            <span class="font-label-code-sm text-[10px] text-outline flex-shrink-0">
              Комната: {{ latestEvent.roomTitle }}
            </span>
          </div>
        }
      </section>

      <!-- 4. LEMON PARTY SUBROUTING TABS -->
      <nav
        aria-label="Lemon Party Navigation"
        class="flex items-center justify-between gap-3 p-1.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex-wrap"
      >
        <div class="flex items-center gap-2 flex-wrap">
          <a
            routerLink="/party"
            [routerLinkActiveOptions]="{ exact: true }"
            routerLinkActive="bg-surface-container-lowest text-primary shadow-xs font-bold border-primary/40"
            class="px-4 py-2.5 rounded-xl font-label-ui text-xs font-semibold text-on-surface-variant hover:text-on-surface border border-transparent transition-all inline-flex items-center gap-2"
          >
            <span class="material-symbols-rounded text-base">swords</span>
            <span>🎮 Игровое Поле & Схватки</span>
          </a>

          <a
            routerLink="/party/cloud"
            routerLinkActive="bg-surface-container-lowest text-primary shadow-xs font-bold border-primary/40"
            class="px-4 py-2.5 rounded-xl font-label-ui text-xs font-semibold text-on-surface-variant hover:text-on-surface border border-transparent transition-all inline-flex items-center gap-2"
          >
            <span class="material-symbols-rounded text-base text-cyan-600">cloud</span>
            <span>☁️ Хроно-Облако (Календарь & Orbit)</span>
            <span
              class="font-label-code-sm text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-bold"
            >
              Левитация
            </span>
          </a>

          <a
            routerLink="/party/cards"
            routerLinkActive="bg-surface-container-lowest text-primary shadow-xs font-bold border-primary/40"
            class="px-4 py-2.5 rounded-xl font-label-ui text-xs font-semibold text-on-surface-variant hover:text-on-surface border border-transparent transition-all inline-flex items-center gap-2"
          >
            <span class="material-symbols-rounded text-base">style</span>
            <span>🃏 Карточки Желаний</span>
            <span
              class="font-label-code-sm text-[10px] px-1.5 py-0.2 rounded-full bg-surface-container-high text-on-surface-variant font-bold"
            >
              {{ ((arena.desireCards$ | async) ?? []).length }}
            </span>
          </a>

          <a
            routerLink="/party/heroes"
            routerLinkActive="bg-surface-container-lowest text-primary shadow-xs font-bold border-primary/40"
            class="px-4 py-2.5 rounded-xl font-label-ui text-xs font-semibold text-on-surface-variant hover:text-on-surface border border-transparent transition-all inline-flex items-center gap-2"
          >
            <span class="material-symbols-rounded text-base">diversity_3</span>
            <span>👥 Персонажи (30 героев)</span>
            <span
              class="font-label-code-sm text-[10px] px-1.5 py-0.2 rounded-full bg-surface-container-high text-on-surface-variant font-bold"
            >
              {{ ((arena.actors$ | async) ?? []).length }}
            </span>
          </a>

          <a
            routerLink="/party/chronicle"
            routerLinkActive="bg-surface-container-lowest text-primary shadow-xs font-bold border-primary/40"
            class="px-4 py-2.5 rounded-xl font-label-ui text-xs font-semibold text-on-surface-variant hover:text-on-surface border border-transparent transition-all inline-flex items-center gap-2"
          >
            <span class="material-symbols-rounded text-base">spatial_audio_off</span>
            <span>🎙️ Хроника Войсов & AI Датасет</span>
            <span
              class="font-label-code-sm text-[10px] px-1.5 py-0.2 rounded-full bg-surface-container-high text-on-surface-variant font-bold"
            >
              {{ ((arena.activeVoices$ | async) ?? []).length }}
            </span>
          </a>
        </div>

        @if (arena.leadActor$ | async; as lead) {
          <div class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30">
            <app-actor-avatar
              [avatar]="lead.avatarIcon"
              containerClass="w-6 h-6 rounded-lg ring-1 ring-primary flex-shrink-0"
            />
            <span class="font-label-code-sm text-xs text-on-surface font-semibold truncate max-w-44">
              Лидер: {{ lead.name }}
            </span>
            <span class="w-2 h-2 rounded-full bg-primary animate-pulse" title="Микрофон активен"></span>
          </div>
        }
      </nav>

      <!-- 5. SUBROUTING OUTLET -->
      <router-outlet />
    </div>

    <!-- 6. MODALS (SHARED ACROSS LEMON PARTY SUBROUTES) -->
    <app-arena-modals
      [showNewDesireCardModal]="arena.showNewDesireCardModal()"
      [showNewActorModal]="arena.showNewActorModal()"
      [showNewParadoxModal]="arena.showNewParadoxModal()"
      (closeNewDesireCardModal)="arena.closeNewDesireCardModal()"
      (closeNewActorModal)="arena.closeNewActorModal()"
      (closeNewParadoxModal)="arena.closeNewParadoxModal()"
    />
  `,
})
export class NeuronArenaComponent {
  protected readonly arena = inject(NeuronArenaService);
  protected readonly realtime = inject(PartyRealtimeService);

  scrollToSection(elementId: string): void {
    if (typeof document !== 'undefined') {
      document.getElementById(elementId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
