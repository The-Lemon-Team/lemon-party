import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ActorAvatarComponent } from '../components/neuron-arena/actor-avatar.component';
import { ArenaModalsComponent } from '../components/neuron-arena/arena-modals.component';
import { NeuronArenaService } from '../core/services/neuron-arena.service';
import { PartyRealtimeService } from '../core/services/party-realtime.service';
import { ThemeService } from '../core/services/theme.service';
import { PartySoundService } from './party-sound.service';

@Component({
  selector: 'app-party-game-shell',
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
    <div class="min-h-screen bg-background text-on-surface flex flex-col">
      <!-- 1. STANDALONE GAME TOPBAR (ОБВЯЗКА ПРИЛОЖЕНИЯ) -->
      <header
        class="sticky top-0 z-40 w-full bg-surface/98 border-b border-outline-variant/30 shadow-xs"
      >
        <div class="relative w-full px-4 sm:px-6 lg:px-8 xl:px-12 h-16 flex items-center justify-between gap-4">
          <!-- Game Brand & Portal Link -->
          <div class="flex items-center gap-3 flex-shrink-0 z-10 min-w-0">
            <a
              routerLink="/party"
              class="flex items-center gap-2.5 text-on-surface no-underline hover:opacity-90 transition-opacity"
            >
              <div
                class="w-10 h-10 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-xs flex-shrink-0"
              >
                <span class="material-symbols-rounded text-2xl" style="font-variation-settings: 'FILL' 1">
                  celebration
                </span>
              </div>
              <div class="flex flex-col">
                <div class="flex items-center gap-1.5">
                  <span class="font-headline-sm text-base font-black tracking-tight">Lemon Party</span>
                  <span
                    class="font-label-code-sm text-[10px] px-2 py-0.2 rounded-full bg-primary-container text-on-primary-container font-extrabold uppercase"
                  >
                    Game
                  </span>
                </div>
                <span class="font-label-code-sm text-[10px] text-on-surface-variant hidden sm:inline">
                  party.lemon.app · standalone
                </span>
              </div>
            </a>

            <!-- Return to Lemon Portal button -->
            <a
              routerLink="/core"
              class="ml-2 hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant font-label-ui text-xs font-semibold transition-colors border border-outline-variant/20 no-underline"
              title="Перейти в консоль управления экосистемой Lemon Actions"
            >
              <span class="material-symbols-rounded text-sm">grid_view</span>
              <span>Lemon Portal</span>
            </a>
          </div>

          <!-- Compact Multiroom Dropdown Selector in Topbar (Centered & Stable Position) -->
          <div
            class="relative lg:absolute lg:left-1/2 lg:-translate-x-1/2 lg:inset-y-0 lg:flex lg:items-center z-20 flex-shrink-0"
          >
            <button
              type="button"
              (click)="toggleRoomMenu()"
              class="px-3 py-1.5 rounded-xl bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/30 flex items-center gap-2 text-xs font-label-ui transition-colors cursor-pointer shadow-xs"
              [attr.aria-expanded]="isRoomMenuOpen()"
              aria-haspopup="listbox"
              title="Выбрать игровую комнату"
            >
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span class="material-symbols-rounded text-sm text-primary">meeting_room</span>
              <span class="font-bold text-on-surface truncate max-w-44 md:max-w-64">
                {{ realtime.getActiveRoom().title }}
              </span>
              <span class="px-1.5 py-0.5 rounded-md bg-surface-container-high text-[10px] text-on-surface-variant font-bold">
                {{ realtime.getActiveRoom().participantsCount }}👥
              </span>
              <span
                class="material-symbols-rounded text-base text-on-surface-variant transition-transform"
                [class.rotate-180]="isRoomMenuOpen()"
              >
                expand_more
              </span>
            </button>

            @if (isRoomMenuOpen()) {
              <!-- Click-outside dismiss backdrop -->
              <div
                class="fixed inset-0 z-40"
                (click)="isRoomMenuOpen.set(false)"
              ></div>

              <!-- Dropdown Menu -->
              <div
                class="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl bg-surface-container-lowest border border-outline-variant/40 shadow-xl z-50 p-2 flex flex-col gap-1"
              >
                <div class="px-3 py-2 flex items-center justify-between border-b border-outline-variant/20 mb-1">
                  <span class="text-xs font-label-ui font-bold text-on-surface flex items-center gap-1.5">
                    <span class="material-symbols-rounded text-sm text-primary">groups</span>
                    Игровые Комнаты ({{ ((realtime.rooms$ | async) ?? []).length }})
                  </span>
                  <span class="text-[10px] font-label-code-sm text-outline">SSE Онлайн</span>
                </div>

                @for (room of (realtime.rooms$ | async) ?? []; track room.id) {
                  <button
                    type="button"
                    (click)="selectRoom(room.id)"
                    class="w-full text-left p-2.5 rounded-xl transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                    [class]="
                      (realtime.activeRoomId$ | async) === room.id
                        ? 'bg-primary-container/40 text-on-surface font-bold border border-primary/30'
                        : 'hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                    "
                  >
                    <div class="min-w-0 flex items-center gap-2.5">
                      <span
                        class="w-8 h-8 rounded-lg bg-surface-container-high group-hover:scale-105 transition-transform flex items-center justify-center text-base flex-shrink-0"
                      >
                        <span class="material-symbols-rounded text-base text-primary">{{ room.icon }}</span>
                      </span>
                      <div class="flex flex-col min-w-0">
                        <span class="text-xs font-label-ui truncate font-semibold">{{ room.title }}</span>
                        <span class="text-[10px] font-body-sm text-outline truncate">
                          {{ room.activeThreadTitle || room.description }}
                        </span>
                      </div>
                    </div>
                    <div class="flex items-center gap-1.5 flex-shrink-0">
                      <span class="px-1.5 py-0.5 rounded-md bg-surface-container-high text-[10px] font-bold">
                        {{ room.participantsCount }}👥
                      </span>
                      @if ((realtime.activeRoomId$ | async) === room.id) {
                        <span class="material-symbols-rounded text-sm text-primary">check</span>
                      }
                    </div>
                  </button>
                }
              </div>
            }
          </div>

          <!-- Controls: Sound FX, Modals, Theme -->
          <div class="flex items-center gap-2 flex-shrink-0 z-10">
            <!-- Sound FX Toggle -->
            <button
              type="button"
              (click)="sound.toggleMute()"
              class="w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer border border-outline-variant/30"
              [class]="
                sound.isMuted()
                  ? 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                  : 'bg-primary-container text-on-primary-container shadow-xs font-bold'
              "
              [title]="sound.isMuted() ? 'Включить звуковые эффекты' : 'Выключить звук'"
            >
              <span class="material-symbols-rounded text-lg">
                {{ sound.isMuted() ? 'volume_off' : 'volume_up' }}
              </span>
            </button>

            <!-- Theme Toggle -->
            <button
              type="button"
              (click)="theme.toggle()"
              class="w-9 h-9 rounded-xl bg-surface-container-low hover:bg-surface-container-high text-on-surface flex items-center justify-center transition-colors border border-outline-variant/30 cursor-pointer"
              title="Переключить тему оформления"
            >
              <span class="material-symbols-rounded text-lg">
                {{ (theme.theme$ | async) === 'dark' ? 'light_mode' : 'dark_mode' }}
              </span>
            </button>

            <!-- Lead Hero Avatar Indicator (Fixed width container prevents layout jitter on hero change) -->
            @if (arena.leadActor$ | async; as lead) {
              <div
                class="hidden sm:flex items-center gap-2 pl-2 border-l border-outline-variant/30 flex-shrink-0"
              >
                <app-actor-avatar
                  [avatar]="lead.avatarIcon"
                  containerClass="w-8 h-8 rounded-xl ring-2 ring-primary/60 flex-shrink-0 cursor-pointer"
                  (click)="arena.previewActorVoice(lead)"
                  [title]="'Ведущий: ' + lead.name + ' (нажмите для реплики)'"
                />
                <button
                  type="button"
                  (click)="arena.previewActorVoice(lead)"
                  class="font-label-code-sm text-xs text-on-surface font-bold hover:text-primary transition-colors truncate w-24 sm:w-28 text-left cursor-pointer flex-shrink-0"
                  [title]="lead.name"
                >
                  {{ lead.name }}
                </button>
              </div>
            }

            <!-- Quick Add Battle Button -->
            <button
              type="button"
              (click)="arena.openNewParadoxModal()"
              class="px-3.5 py-1.5 rounded-xl bg-primary text-on-primary font-label-ui text-xs font-bold hover:brightness-105 active:scale-95 transition-transform shadow-xs inline-flex items-center gap-1.5 cursor-pointer ml-1 flex-shrink-0"
            >
              <span class="material-symbols-rounded text-base">flare</span>
              <span class="hidden sm:inline">+ Спор</span>
            </button>
          </div>
        </div>

        <!-- 2. GAME NAVIGATION RIBBON (TAB BAR) -->
        <div class="border-t border-outline-variant/20 bg-surface-container-lowest/60">
          <div class="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
            <nav
              aria-label="Game Navigation"
              class="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 no-scrollbar"
            >
              <!-- 1. Главное Меню / Start Screen -->
              <a
                routerLink="/party"
                [routerLinkActiveOptions]="{ exact: true }"
                routerLinkActive="bg-primary text-on-primary shadow-xs font-bold"
                class="px-3.5 py-1.5 rounded-xl font-label-ui text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors inline-flex items-center gap-1.5 flex-shrink-0 no-underline cursor-pointer"
              >
                <span class="material-symbols-rounded text-base">home</span>
                <span>Главное Меню</span>
              </a>

              <!-- 2. Игровое Поле & Схватки -->
              <a
                routerLink="/party/field"
                routerLinkActive="bg-primary text-on-primary shadow-xs font-bold"
                class="px-3.5 py-1.5 rounded-xl font-label-ui text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors inline-flex items-center gap-1.5 flex-shrink-0 no-underline cursor-pointer"
              >
                <span class="material-symbols-rounded text-base">swords</span>
                <span>Игровое Поле & Схватки</span>
              </a>

              <!-- 3. Хроно-Облако (Главная Игра & День Персонажей) -->
              <a
                routerLink="/party/cloud"
                routerLinkActive="bg-primary text-on-primary shadow-xs font-bold"
                class="px-3.5 py-1.5 rounded-xl font-label-ui text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors inline-flex items-center gap-1.5 flex-shrink-0 no-underline cursor-pointer"
              >
                <span class="material-symbols-rounded text-base text-amber-500">cloud</span>
                <span>Хроно-Облако</span>
                <span
                  class="font-label-code-sm text-[10px] px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-900 dark:text-amber-200 font-extrabold"
                >
                  ⭐ Главная
                </span>
              </a>

              <!-- 4. Карточки Желаний -->
              <a
                routerLink="/party/cards"
                routerLinkActive="bg-primary text-on-primary shadow-xs font-bold"
                class="px-3.5 py-1.5 rounded-xl font-label-ui text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors inline-flex items-center gap-1.5 flex-shrink-0 no-underline cursor-pointer"
              >
                <span class="material-symbols-rounded text-base">style</span>
                <span>Колода Желаний</span>
                <span
                  class="font-label-code-sm text-[10px] px-1.5 py-0.2 rounded-full bg-surface-container-high text-on-surface-variant font-bold"
                >
                  {{ ((arena.desireCards$ | async) ?? []).length }}
                </span>
              </a>

              <!-- 5. Персонажи -->
              <a
                routerLink="/party/heroes"
                routerLinkActive="bg-primary text-on-primary shadow-xs font-bold"
                class="px-3.5 py-1.5 rounded-xl font-label-ui text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors inline-flex items-center gap-1.5 flex-shrink-0 no-underline cursor-pointer"
              >
                <span class="material-symbols-rounded text-base">diversity_3</span>
                <span>Персонажи (30 героев)</span>
                <span
                  class="font-label-code-sm text-[10px] px-1.5 py-0.2 rounded-full bg-surface-container-high text-on-surface-variant font-bold"
                >
                  {{ ((arena.actors$ | async) ?? []).length }}
                </span>
              </a>

              <!-- 6. Хроника Войсов -->
              <a
                routerLink="/party/chronicle"
                routerLinkActive="bg-primary text-on-primary shadow-xs font-bold"
                class="px-3.5 py-1.5 rounded-xl font-label-ui text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors inline-flex items-center gap-1.5 flex-shrink-0 no-underline cursor-pointer"
              >
                <span class="material-symbols-rounded text-base">spatial_audio_off</span>
                <span>Студия Войсов</span>
                <span
                  class="font-label-code-sm text-[10px] px-1.5 py-0.2 rounded-full bg-surface-container-high text-on-surface-variant font-bold"
                >
                  {{ ((arena.activeVoices$ | async) ?? []).length }}
                </span>
              </a>

              <!-- 7. Колесо Фортуны & Рулетка (Отдельная мини-игра) -->
              <a
                routerLink="/party/roulette"
                routerLinkActive="bg-primary text-on-primary shadow-xs font-bold"
                class="px-3.5 py-1.5 rounded-xl font-label-ui text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors inline-flex items-center gap-1.5 flex-shrink-0 no-underline cursor-pointer"
              >
                <span class="material-symbols-rounded text-base text-rose-500">casino</span>
                <span>Колесо Фортуны</span>
                <span
                  class="font-label-code-sm text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 font-bold"
                >
                  Мини-игра
                </span>
              </a>
            </nav>
          </div>
        </div>
      </header>

      <!-- 3. LIVE EVENT STREAM MARQUEE (КОМПАКТНЫЙ СТРИМ СОБЫТИЙ) -->
      @if ((realtime.events$ | async)?.[0]; as latestEvent) {
        <aside
          aria-label="Живой стрим комнаты"
          class="bg-primary/10 border-b border-primary/20 px-4 sm:px-6 lg:px-8 xl:px-12 py-1.5 text-xs font-body-sm text-on-surface"
        >
          <div class="w-full flex items-center justify-between gap-3">
            <div class="flex items-center gap-2 min-w-0">
              <span class="w-2 h-2 rounded-full bg-primary flex-shrink-0"></span>
              <span class="font-label-ui font-bold text-primary flex-shrink-0">Live:</span>
              <span class="truncate">
                <strong>{{ latestEvent.actorName }}</strong> {{ latestEvent.message }}
              </span>
            </div>
            <span class="font-label-code-sm text-[10px] text-outline flex-shrink-0">
              {{ latestEvent.roomTitle }}
            </span>
          </div>
        </aside>
      }

      <!-- 4. ACTIVE GAME ROUTE CONTENT -->
      <main class="flex-1 w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6">
        <router-outlet />
      </main>

      <!-- 5. FOOTER (GAME IDENTITY) -->
      <footer class="mt-auto border-t border-outline-variant/20 bg-surface-container-lowest py-6">
        <div class="w-full px-4 sm:px-6 lg:px-8 xl:px-12 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-body-sm text-on-surface-variant">
          <div class="flex items-center gap-2">
            <span class="font-bold text-on-surface">Lemon Party · Game Suite</span>
            <span>· Отдельное приложение выбора досуга</span>
          </div>
          <div class="flex items-center gap-4">
            <a routerLink="/party" class="hover:underline text-on-surface">Главное Меню</a>
            <a routerLink="/party/field" class="hover:underline text-on-surface">Игровое Поле</a>
            <a routerLink="/party/roulette" class="hover:underline text-on-surface">Колесо Фортуны</a>
            <a routerLink="/party/heroes" class="hover:underline text-on-surface">Герои</a>
            <a routerLink="/core" class="hover:underline text-primary font-semibold">Lemon Portal</a>
          </div>
        </div>
      </footer>

      <!-- 6. MODALS CONTAINER (ACCESSIBLE, OVERLAY-COMPLIANT) -->
      @defer (
        when arena.showNewDesireCardModal() ||
          arena.showNewActorModal() ||
          arena.showNewParadoxModal();
        prefetch on idle
      ) {
        <app-arena-modals
          [showNewDesireCardModal]="arena.showNewDesireCardModal()"
          [showNewActorModal]="arena.showNewActorModal()"
          [showNewParadoxModal]="arena.showNewParadoxModal()"
          (closeNewDesireCardModal)="arena.closeNewDesireCardModal()"
          (closeNewActorModal)="arena.closeNewActorModal()"
          (closeNewParadoxModal)="arena.closeNewParadoxModal()"
        />
      }
    </div>
  `,
})
export class PartyGameShellComponent {
  protected readonly arena = inject(NeuronArenaService);
  protected readonly realtime = inject(PartyRealtimeService);
  protected readonly sound = inject(PartySoundService);
  protected readonly theme = inject(ThemeService);

  protected readonly isRoomMenuOpen = signal(false);

  toggleRoomMenu(): void {
    this.isRoomMenuOpen.update((v) => !v);
  }

  selectRoom(roomId: string): void {
    this.realtime.switchRoom(roomId);
    this.isRoomMenuOpen.set(false);
  }
}
