import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NeuronArenaService } from '../core/services/neuron-arena.service';
import { PartyRealtimeService } from '../core/services/party-realtime.service';
import { PartyRouletteComponent } from './party-roulette.component';

@Component({
  selector: 'app-party-roulette-page',
  standalone: true,
  imports: [AsyncPipe, RouterLink, PartyRouletteComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-6 pb-12 w-full">
      <!-- 1. BREADCRUMBS & TOP NAVIGATION -->
      <div class="flex items-center justify-between gap-4 flex-wrap">
        <a
          routerLink="/party"
          class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-container-low hover:bg-surface-container-high text-on-surface font-label-ui text-xs font-semibold transition-all border border-outline-variant/30 no-underline cursor-pointer"
        >
          <span class="material-symbols-rounded text-base">arrow_back</span>
          <span>В Главное Меню (Режимы Игры)</span>
        </a>

        <div class="flex items-center gap-2 text-xs font-label-code-sm text-on-surface-variant">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold">
            <span class="material-symbols-rounded text-sm">casino</span>
            Отдельная Мини-Игра
          </span>
          <span class="hidden sm:inline">·</span>
          <span class="hidden sm:inline">Комната: <strong>{{ realtime.getActiveRoom().title }}</strong></span>
        </div>
      </div>

      <!-- 2. ROULETTE COMPONENT (INTERACTIVE WHEEL & CLASH RESOLVER) -->
      <app-party-roulette />

      <!-- 3. FOOTER HINTS & NEXT STEPS -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div class="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-1.5">
          <div class="flex items-center gap-2 text-xs font-label-ui font-bold text-primary">
            <span class="material-symbols-rounded text-base">shuffle</span>
            <span>Случайный Сюжет</span>
          </div>
          <p class="text-xs font-body-sm text-on-surface-variant">
            Каждый спин колеса выбирает случайное настроение вечеринки и сталкивает двух непохожих персонажей.
          </p>
        </div>

        <div class="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-1.5">
          <div class="flex items-center gap-2 text-xs font-label-ui font-bold text-amber-600">
            <span class="material-symbols-rounded text-base">swords</span>
            <span>Перенос на Арену</span>
          </div>
          <p class="text-xs font-body-sm text-on-surface-variant">
            Нажмите кнопку «Разрешить на Игровом Поле», чтобы перенести получившийся спор в режим Versus или Combine.
          </p>
        </div>

        <div class="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-1.5">
          <div class="flex items-center gap-2 text-xs font-label-ui font-bold text-cyan-600">
            <span class="material-symbols-rounded text-base">cloud</span>
            <span>Хроно-Орбита</span>
          </div>
          <p class="text-xs font-body-sm text-on-surface-variant">
            Хотите визуализировать карточки в пространстве? Переходите в 3D Хроно-Облако для планирования расписания.
          </p>
        </div>
      </div>
    </div>
  `,
})
export class PartyRoulettePageComponent {
  protected readonly arena = inject(NeuronArenaService);
  protected readonly realtime = inject(PartyRealtimeService);
}
