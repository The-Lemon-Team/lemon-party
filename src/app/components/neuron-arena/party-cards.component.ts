import { AsyncPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ArenaDesireCard } from '../../core/models/flow.models';
import { NeuronArenaService } from '../../core/services/neuron-arena.service';
import { getAccentAvatarClasses } from './arena-ui.utils';

@Component({
  selector: 'app-party-cards',
  standalone: true,
  imports: [AsyncPipe, DatePipe, FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-space-lg">
      <!-- 1. BREADCRUMBS & TOP ACTIONS -->
      <nav class="flex items-center justify-between gap-space-md flex-wrap">
        <div class="flex items-center gap-2 text-xs font-label-ui">
          <a
            routerLink="/party"
            class="text-on-surface-variant hover:text-primary transition-colors inline-flex items-center gap-1 font-semibold"
          >
            <span class="material-symbols-rounded text-base">arrow_back</span>
            <span>Главное Меню</span>
          </a>
          <span class="text-outline-variant">/</span>
          <span class="text-primary font-bold">Колода Карточек Желаний</span>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="arena.openNewDesireCardModal()"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-on-primary font-label-ui text-xs font-bold hover:brightness-105 transition-all shadow-xs"
          >
            <span class="material-symbols-rounded text-base">style</span>
            <span>+ Новая Карточка Желания</span>
          </button>
          <a
            routerLink="/party/field"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-lowest border border-outline-variant/40 hover:border-primary text-on-surface font-label-ui text-xs font-bold transition-all shadow-xs"
          >
            <span class="material-symbols-rounded text-base text-primary">swords</span>
            <span>Перейти на Игровое Поле →</span>
          </a>
        </div>
      </nav>

      <!-- 2. ANALYTICS HERO BANNER -->
      @if (arena.deckAnalytics$ | async; as deckStats) {
        <section
          class="bg-surface-container-lowest rounded-2xl p-space-md shadow-xs border border-outline-variant/30 flex flex-col gap-space-md"
        >
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
            <div class="flex items-start gap-space-md">
              <div
                class="w-12 h-12 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center flex-shrink-0 shadow-xs"
              >
                <span class="material-symbols-rounded text-2xl" style="font-variation-settings: 'FILL' 1">
                  style
                </span>
              </div>
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <h1 class="font-headline-sm text-lg font-bold text-on-surface">
                    Колода Карточек Желаний · Летопись и Винрейты
                  </h1>
                  <span
                    class="font-label-code-sm text-[11px] px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-semibold"
                  >
                    subroute: /party/cards
                  </span>
                  @if (deckStats.topWinnerCard; as champ) {
                    <span
                      class="font-label-code-sm text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold"
                    >
                      🏆 Абсолютный Лидер: «{{ champ.title }}» ({{ champ.winRatePercent }}% WR)
                    </span>
                  }
                </div>
                <p class="font-body-sm text-xs text-on-surface-variant mt-1 max-w-4xl">
                  Здесь собраны все карточки желаний, их статистика в Versus-спорах и Combine-режиме,
                  а также подробная летопись каждого поединка. Вы можете добавить новое желание или вбросить
                  любое в активное игровое поле!
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2 self-start lg:self-center">
              <span class="font-label-code-sm text-xs px-3 py-1.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface">
                Всего в колоде: <strong>{{ ((arena.desireCards$ | async) ?? []).length }} карточек</strong>
              </span>
            </div>
          </div>

          <div class="p-3 rounded-xl bg-primary-container/20 border border-primary/25 text-xs font-body-sm text-on-surface flex items-center gap-2.5">
            <span class="material-symbols-rounded text-primary text-lg flex-shrink-0">insights</span>
            <span><strong>Глобальный инсайт колоды:</strong> {{ deckStats.headlineConclusion }}</span>
          </div>
        </section>
      }

      <!-- 3. SEARCH & CATEGORY FILTERS -->
      <section class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-1.5 flex-wrap">
          @for (cat of categories; track cat.id) {
            <button
              type="button"
              (click)="selectedCategory.set(cat.id)"
              class="px-3 py-1.5 rounded-xl font-label-ui text-xs font-semibold transition-all border"
              [class]="
                selectedCategory() === cat.id
                  ? 'bg-primary text-on-primary border-primary shadow-xs'
                  : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface border-outline-variant/30'
              "
            >
              {{ cat.label }}
            </button>
          }
        </div>

        <div class="relative min-w-[220px]">
          <span class="material-symbols-rounded absolute left-3 top-2.5 text-base text-outline">search</span>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Поиск по названию или описанию..."
            class="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-primary"
          />
        </div>
      </section>

      <!-- 4. CARDS DECK & INSPECTOR -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
        <!-- Left 7 Columns: Desire Cards Deck Grid -->
        <div class="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-space-md">
          @for (card of getFilteredCards((arena.desireCards$ | async) ?? []); track card.id) {
            <div
              (click)="arena.inspectDesireCard(card.id)"
              class="bg-surface-container-lowest rounded-2xl p-space-md shadow-xs border transition-all cursor-pointer flex flex-col justify-between gap-3"
              [class]="
                (arena.selectedDesireCardId$ | async) === card.id
                  ? 'border-2 border-primary ring-4 ring-primary/10 shadow-md'
                  : 'border-outline-variant/30 hover:border-primary/50'
              "
            >
              <div class="flex flex-col gap-2.5">
                <div class="flex items-start justify-between gap-2">
                  <div class="flex items-center gap-2.5">
                    <div
                      class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      [class]="getAccentAvatarClasses(card.colorTheme, (arena.selectedDesireCardId$ | async) === card.id)"
                    >
                      <span class="material-symbols-rounded text-xl">{{ card.icon }}</span>
                    </div>
                    <div>
                      <span class="font-label-code-sm text-[10px] uppercase text-on-surface-variant font-bold">
                        {{ card.category }}
                      </span>
                      <h3 class="font-headline-sm text-base font-bold text-on-surface">
                        «{{ card.title }}»
                      </h3>
                    </div>
                  </div>

                  <span
                    class="font-label-code-sm text-xs px-2.5 py-1 rounded-full font-bold flex-shrink-0"
                    [class]="
                      card.winRatePercent >= 60
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        : card.winRatePercent >= 40
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                          : 'bg-surface-container-high text-on-surface-variant'
                    "
                  >
                    {{ card.winRatePercent }}% WR
                  </span>
                </div>

                <p class="font-body-sm text-xs text-on-surface-variant">
                  {{ card.description }}
                </p>

                <div class="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-surface-container-low text-center font-label-code-sm text-xs">
                  <div>
                    <div class="text-[10px] text-outline">Игр</div>
                    <strong class="text-on-surface">{{ card.gamesPlayed }}</strong>
                  </div>
                  <div>
                    <div class="text-[10px] text-emerald-600">Побед</div>
                    <strong class="text-emerald-600">{{ card.winsCount }}</strong>
                  </div>
                  <div>
                    <div class="text-[10px] text-rose-500">Уступила</div>
                    <strong class="text-rose-500">{{ card.lossesCount }}</strong>
                  </div>
                </div>

                <div class="p-2.5 rounded-xl bg-primary-container/20 border border-primary/25 text-[11px] font-body-sm text-on-surface">
                  <strong class="font-bold">Вывод:</strong> {{ card.analyticsInsight }}
                </div>
              </div>

              <div class="pt-2 border-t border-outline-variant/20 flex items-center justify-between gap-2">
                <span class="font-label-code-sm text-[10px] text-outline">
                  {{ card.isInCurrentField ? '● Уже в активном поле' : '○ В колоде резерва' }}
                </span>

                <button
                  type="button"
                  (click)="$event.stopPropagation(); playCardAndNavigate(card)"
                  class="px-3 py-1.5 rounded-xl font-label-ui text-xs font-bold transition-all inline-flex items-center gap-1"
                  [class]="
                    card.isInCurrentField
                      ? 'bg-surface-container-high text-on-surface hover:bg-primary-container'
                      : 'bg-primary text-on-primary shadow-xs hover:opacity-95'
                  "
                >
                  <span class="material-symbols-rounded text-sm">
                    {{ card.isInCurrentField ? 'thumb_up' : 'play_arrow' }}
                  </span>
                  <span>{{ card.isInCurrentField ? 'Поддержать в поле' : 'Вбросить в Поле' }}</span>
                </button>
              </div>
            </div>
          } @empty {
            <div class="col-span-2 p-8 text-center rounded-2xl bg-surface-container-lowest border border-outline-variant/30 text-on-surface-variant">
              <span class="material-symbols-rounded text-3xl text-outline mb-2">style</span>
              <p class="font-headline-sm text-sm font-bold text-on-surface">Карточки не найдены</p>
              <p class="font-body-sm text-xs mt-1">Попробуйте изменить поисковый запрос или фильтр категории.</p>
            </div>
          }
        </div>

        <!-- Right 5 Columns: Detailed Match History Inspector -->
        @if (arena.inspectedDesireCard$ | async; as inspected) {
          <div class="lg:col-span-5 bg-surface-container-lowest rounded-2xl p-space-md shadow-sm border-2 border-primary/40 flex flex-col gap-space-md sticky top-20">
            <div class="flex items-start justify-between gap-3 pb-3 border-b border-outline-variant/20">
              <div class="flex items-center gap-3">
                <div
                  class="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  [class]="getAccentAvatarClasses(inspected.colorTheme, true)"
                >
                  <span class="material-symbols-rounded text-2xl">{{ inspected.icon }}</span>
                </div>
                <div>
                  <span class="font-label-code-sm text-[10px] uppercase px-2 py-0.5 rounded bg-primary-container text-on-primary-container font-bold">
                    Летопись Карточки Желания
                  </span>
                  <h3 class="font-headline-sm text-lg font-bold text-on-surface mt-1">
                    «{{ inspected.title }}»
                  </h3>
                  <p class="font-label-code-sm text-xs text-on-surface-variant">
                    Добавил в колоду: {{ inspected.createdByActorName }}
                  </p>
                </div>
              </div>

              <button
                type="button"
                (click)="playCardAndNavigate(inspected)"
                class="px-3 py-1.5 rounded-xl bg-primary text-on-primary font-label-ui text-xs font-bold shadow-xs hover:brightness-105 transition-all inline-flex items-center gap-1"
              >
                <span class="material-symbols-rounded text-sm">play_arrow</span>
                <span>В Поле</span>
              </button>
            </div>

            @if (inspected.nemesisCardTitle) {
              <div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
                <span class="material-symbols-rounded text-amber-600 text-lg flex-shrink-0 mt-0.5">compare_arrows</span>
                <div class="text-xs font-body-sm text-on-surface">
                  <div class="font-bold">Главный конкурент в Versus Mode: «{{ inspected.nemesisCardTitle }}»</div>
                  <div class="text-on-surface-variant mt-0.5">{{ inspected.nemesisScore }}</div>
                </div>
              </div>
            }

            <div class="flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <span class="font-label-ui text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  В каких играх участвовала ({{ inspected.matchHistory.length }}):
                </span>
                <span class="font-label-code-sm text-xs text-on-surface">
                  Всего голосов: <strong>{{ inspected.totalHistoricalVotes }}</strong>
                </span>
              </div>

              <div class="flex flex-col gap-2 max-h-[460px] overflow-y-auto pr-1">
                @for (m of inspected.matchHistory; track m.id) {
                  <div
                    class="p-3 rounded-xl border flex flex-col gap-1.5"
                    [class]="
                      m.outcome === 'WON'
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-surface-container-low border-outline-variant/25'
                    "
                  >
                    <div class="flex items-center justify-between gap-2">
                      <span
                        class="font-label-code-sm text-[10px] px-2 py-0.5 rounded-full font-bold uppercase"
                        [class]="
                          m.outcome === 'WON'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                        "
                      >
                        {{ m.outcome === 'WON' ? '🏆 ПОБЕДА КАРТОЧКИ' : '⚔️ УСТУПИЛА В VERSUS' }}
                      </span>
                      <span class="font-label-code-sm text-[11px] text-outline">
                        {{ m.playedAt | date: 'dd.MM.yyyy' }}
                      </span>
                    </div>

                    <div class="font-label-ui text-xs font-bold text-on-surface">
                      Игра: «{{ m.gameTitle }}»
                    </div>

                    <p class="font-body-sm text-xs text-on-surface-variant">
                      {{ m.note }}
                    </p>

                    <div class="flex items-center justify-between text-[11px] font-label-code-sm text-on-surface-variant pt-1 border-t border-outline-variant/15">
                      <span>Голоса карточки: <strong>{{ m.votesReceived }} из {{ m.totalGameVotes }}</strong></span>
                      <span>Победитель: <strong class="text-on-surface">«{{ m.winnerCardTitle }}»</strong></span>
                    </div>
                  </div>
                } @empty {
                  <div class="p-6 text-center rounded-xl bg-surface-container-low text-xs text-on-surface-variant">
                    Эта карточка только что создана. Завершите текущий период, чтобы в её летописи появилась первая запись!
                  </div>
                }
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class PartyCardsComponent {
  protected readonly arena = inject(NeuronArenaService);
  protected readonly getAccentAvatarClasses = getAccentAvatarClasses;
  private readonly router = inject(Router);

  readonly selectedCategory = signal<string>('ALL');
  searchQuery = '';

  readonly categories = [
    { id: 'ALL', label: 'Все Карточки' },
    { id: 'Еда & Напитки', label: '🍕 Еда & Напитки' },
    { id: 'Игры & Драйв', label: '🎮 Игры & Драйв' },
    { id: 'Уют & Кино', label: '🍿 Кино & Отдых' },
    { id: 'Развитие', label: '📚 Развитие & Проекты' },
  ];

  playCardAndNavigate(card: ArenaDesireCard): void {
    this.arena.playDesireCardToField(card.id);
    this.router.navigate(['/party']);
  }

  getFilteredCards(cards: ArenaDesireCard[]): ArenaDesireCard[] {
    const cat = this.selectedCategory();
    const q = this.searchQuery.trim().toLowerCase();

    return cards.filter((c) => {
      if (cat !== 'ALL' && c.category !== cat) return false;
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.analyticsInsight.toLowerCase().includes(q)
      );
    });
  }
}
