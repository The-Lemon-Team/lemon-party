import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ArenaGameSubMode } from '../../core/models/flow.models';
import { NeuronArenaService } from '../../core/services/neuron-arena.service';
import { ActorAvatarComponent } from './actor-avatar.component';
import { ArenaCombineViewComponent } from './arena-combine-view.component';
import { getAccentPillClasses } from './arena-ui.utils';
import { ArenaVersusViewComponent } from './arena-versus-view.component';

@Component({
  selector: 'app-arena-field',
  standalone: true,
  imports: [
    AsyncPipe,
    RouterLink,
    ActorAvatarComponent,
    ArenaCombineViewComponent,
    ArenaVersusViewComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-space-lg">
      <!-- 1. ACTIVE LEAD HERO BAR WITH QUICK NAVIGATION TO HEROES PAGE -->
      @if (arena.leadActor$ | async; as lead) {
        <section
          class="bg-surface-container-lowest rounded-2xl p-space-md shadow-xs border border-outline-variant/30 flex flex-col md:flex-row md:items-center justify-between gap-space-md"
        >
          <div class="flex items-center gap-space-md min-w-0">
            <app-actor-avatar
              [avatar]="lead.avatarIcon"
              containerClass="w-14 h-14 rounded-2xl shadow-xs ring-2 ring-primary flex-shrink-0"
            />
            <div class="min-w-0 flex flex-col">
              <div class="flex items-center gap-2 flex-wrap">
                <span
                  class="font-label-code-sm text-[10px] px-2 py-0.5 rounded-full font-bold uppercase"
                  [class]="getAccentPillClasses(lead.accentColor)"
                >
                  {{ lead.categoryLabel }}
                </span>
                <span class="font-headline-sm text-sm font-bold text-on-surface">
                  Голос Поля: {{ lead.name }}
                </span>
                <span
                  class="inline-flex items-center gap-1 font-label-code-sm text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                  В эфире
                </span>
              </div>
              <p class="font-body-sm text-xs italic text-on-surface-variant truncate mt-0.5">
                «{{ lead.quote }}»
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2 flex-shrink-0 self-start md:self-center">
            <button
              type="button"
              (click)="arena.previewActorVoice(lead)"
              class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container-high text-on-surface font-label-ui text-xs font-semibold transition-all border border-outline-variant/30"
              title="Прослушать голос главного персонажа"
            >
              <span class="material-symbols-rounded text-base text-primary">volume_up</span>
              <span>Реплика</span>
            </button>
            <a
              routerLink="/party/heroes"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary-container text-on-primary-container hover:brightness-105 font-label-ui text-xs font-bold transition-all shadow-xs"
            >
              <span class="material-symbols-rounded text-base">diversity_3</span>
              <span>Ростер персонажей (30 героев) →</span>
            </a>
          </div>
        </section>
      }

      <!-- 2. ПЕРЕКЛЮЧАТЕЛЬ РЕЖИМОВ ПОЛЯ: COMBINE MODE vs VERSUS MODE -->
      <section
        class="bg-surface-container-lowest rounded-2xl p-3 shadow-xs border-2 border-primary/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div class="flex items-center gap-2.5">
          <span class="material-symbols-rounded text-primary text-2xl">tune</span>
          <div>
            <div class="font-headline-sm text-sm font-bold text-on-surface">
              Режим работы Игрового Поля:
            </div>
            <div class="font-body-sm text-xs text-on-surface-variant">
              Переключайтесь между совмещением занятий в одном слоте времени (<strong>Combine Mode</strong>) и битвой альтернатив (<strong>Versus Mode</strong>)
            </div>
          </div>
        </div>

        <div class="flex items-center gap-1.5 bg-surface-container-low p-1.5 rounded-xl border border-outline-variant/30">
          <button
            type="button"
            (click)="gameSubMode.set('COMBINE')"
            class="px-3.5 py-2 rounded-lg font-label-ui text-xs font-bold transition-all inline-flex items-center gap-1.5"
            [class]="
              gameSubMode() === 'COMBINE'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            "
          >
            <span class="material-symbols-rounded text-base">push_pin</span>
            <span>🧩 Combine Mode (Слот Времени + Pin)</span>
          </button>

          <button
            type="button"
            (click)="gameSubMode.set('VERSUS')"
            class="px-3.5 py-2 rounded-lg font-label-ui text-xs font-bold transition-all inline-flex items-center gap-1.5"
            [class]="
              gameSubMode() === 'VERSUS'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            "
          >
            <span class="material-symbols-rounded text-base">swords</span>
            <span>⚔️ Versus Mode (Спор Карточек)</span>
          </button>
        </div>
      </section>

      <!-- 3. COMBINE OR VERSUS MODE VIEW -->
      @if (gameSubMode() === 'COMBINE') {
        <app-arena-combine-view />
      } @else {
        <app-arena-versus-view (inspectCardHistory)="openCardHistory($event)" />
      }

      <!-- 4. QUICK CONTEXT CARDS LINKING TO DECK & CHRONICLE TABS -->
      <section class="grid grid-cols-1 md:grid-cols-2 gap-space-md pt-1">
        <!-- Quick Nav to Desire Cards Deck -->
        <div class="bg-surface-container-lowest rounded-2xl p-space-md border border-outline-variant/30 shadow-xs flex flex-col justify-between gap-3">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center flex-shrink-0">
              <span class="material-symbols-rounded text-xl">style</span>
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-headline-sm text-sm font-bold text-on-surface">
                  Колода Карточек Желаний
                </span>
                <span class="font-label-code-sm text-[11px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
                  {{ ((arena.desireCards$ | async) ?? []).length }} карт
                </span>
              </div>
              <p class="font-body-sm text-xs text-on-surface-variant mt-0.5">
                Все варианты досуга, винрейты карточек, летопись поединков и инспектор соперничества вынесены в отдельный удобный таб.
              </p>
            </div>
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-outline-variant/20">
            @if (arena.deckAnalytics$ | async; as deckStats) {
              @if (deckStats.topWinnerCard; as champ) {
                <span class="font-label-code-sm text-xs text-emerald-600 font-bold">
                  Лидер: «{{ champ.title }}» ({{ champ.winRatePercent }}% WR)
                </span>
              }
            }
            <a
              routerLink="/party/cards"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-container text-on-primary-container font-label-ui text-xs font-bold hover:brightness-105 transition-all shadow-xs ml-auto"
            >
              <span>Открыть Колоду Карточек →</span>
            </a>
          </div>
        </div>

        <!-- Quick Nav to Voices & AI Dataset -->
        <div class="bg-surface-container-lowest rounded-2xl p-space-md border border-outline-variant/30 shadow-xs flex flex-col justify-between gap-3">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center flex-shrink-0">
              <span class="material-symbols-rounded text-xl">spatial_audio_off</span>
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-headline-sm text-sm font-bold text-on-surface">
                  Хроника Войсов & AI Датасет
                </span>
                <span class="font-label-code-sm text-[11px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
                  {{ ((arena.activeVoices$ | async) ?? []).length }} войсов
                </span>
              </div>
              <p class="font-body-sm text-xs text-on-surface-variant mt-0.5">
                Аудио-записи персонажей, студия реплик, синтез мыслей и выгрузка размеченного датасета в формате .JSONL для нейросетей.
              </p>
            </div>
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-outline-variant/20">
            <span class="font-label-code-sm text-xs text-outline">
              Датасет: {{ ((arena.trainingSamples$ | async) ?? []).length }} сэмплов
            </span>
            <a
              routerLink="/party/chronicle"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-ui text-xs font-bold transition-all shadow-xs border border-outline-variant/30"
            >
              <span>Студия Войсов & Датасет →</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  `,
})
export class ArenaFieldComponent {
  protected readonly arena = inject(NeuronArenaService);
  protected readonly getAccentPillClasses = getAccentPillClasses;
  private readonly router = inject(Router);

  readonly gameSubMode = signal<ArenaGameSubMode>('COMBINE');

  openCardHistory(cardId: string): void {
    this.arena.inspectDesireCard(cardId);
    this.router.navigate(['/party/cards']);
  }

  scrollToSection(elementId: string): void {
    if (typeof document !== 'undefined') {
      document.getElementById(elementId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
