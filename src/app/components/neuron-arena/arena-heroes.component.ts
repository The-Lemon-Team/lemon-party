import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ArenaActorCard, ArenaActorCategory } from '../../core/models/flow.models';
import { NeuronArenaService } from '../../core/services/neuron-arena.service';
import { ActorAvatarComponent } from './actor-avatar.component';
import { getAccentPillClasses } from './arena-ui.utils';
import { ArenaVoiceStudioComponent } from './arena-voice-studio.component';

type HeroSortOption = 'NAME' | 'CHARISMA' | 'ANALYTICAL' | 'REBEL' | 'VOICES';

@Component({
  selector: 'app-arena-heroes',
  standalone: true,
  imports: [AsyncPipe, FormsModule, RouterLink, ActorAvatarComponent, ArenaVoiceStudioComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-space-lg">
      <!-- 1. BREADCRUMBS & TOP NAVIGATION -->
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
          <span class="text-primary font-bold">Ростер Персонажей</span>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="arena.openNewActorModal()"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-on-primary font-label-ui text-xs font-bold hover:brightness-105 transition-all shadow-xs"
          >
            <span class="material-symbols-rounded text-base">person_add</span>
            <span>+ Добавить Персонажа</span>
          </button>
          <button
            type="button"
            (click)="arena.resetDemoArena()"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-ui text-xs font-semibold transition-all border border-outline-variant/30"
            title="Сбросить демо-состояние персонажей к начальному"
          >
            <span class="material-symbols-rounded text-base">restart_alt</span>
            <span>Сбросить демо</span>
          </button>
          <a
            routerLink="/party"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-lowest border border-outline-variant/40 hover:border-primary text-on-surface font-label-ui text-xs font-bold transition-all shadow-xs"
          >
            <span class="material-symbols-rounded text-base text-primary">swords</span>
            <span>В бой на Поле →</span>
          </a>
        </div>
      </nav>

      <!-- 2. HERO PAGE BANNER -->
      <section
        class="bg-surface-container-lowest rounded-2xl p-space-md shadow-xs border border-outline-variant/30 flex flex-col gap-space-md"
      >
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
          <div class="flex items-start gap-space-md">
            <div
              class="w-12 h-12 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center flex-shrink-0 shadow-xs"
            >
              <span class="material-symbols-rounded text-2xl" style="font-variation-settings: 'FILL' 1">
                diversity_3
              </span>
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h1 class="font-headline-sm text-lg font-bold text-on-surface">
                  Ростер Персонажей · Коллекция Героев
                </h1>
                <span
                  class="font-label-code-sm text-[11px] px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-semibold"
                >
                  subroute: /party/heroes
                </span>
                <span
                  class="inline-flex items-center gap-1 font-label-code-sm text-[11px] px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                  4 Фракции
                </span>
              </div>
              <p class="font-body-sm text-xs text-on-surface-variant mt-1 max-w-4xl">
                Выберите <strong>Главного Персонажа</strong>, который станет ведущим голосом в Versus-спорах
                и Combine-режиме. Вы можете мгновенно переключать лидера, прослушивать уникальные реплики
                и записывать новые аудиосообщения через встроенную студию голосов.
              </p>
            </div>
          </div>
        </div>

        <!-- STATS OVERVIEW CARDS -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1 border-t border-outline-variant/20">
          <div class="p-3 rounded-xl bg-surface-container-low flex flex-col gap-1">
            <span class="font-label-code-sm text-[11px] text-on-surface-variant flex items-center gap-1">
              <span class="material-symbols-rounded text-sm text-primary">groups</span>
              Всего в Ростере
            </span>
            <span class="font-headline-sm text-base font-bold text-on-surface">
              {{ ((arena.actors$ | async) ?? []).length }} героев
            </span>
          </div>

          <div class="p-3 rounded-xl bg-surface-container-low flex flex-col gap-1">
            <span class="font-label-code-sm text-[11px] text-on-surface-variant flex items-center gap-1">
              <span class="material-symbols-rounded text-sm text-amber-500">crown</span>
              Главный Персонаж
            </span>
            <span class="font-headline-sm text-base font-bold text-on-surface truncate">
              {{ (arena.leadActor$ | async)?.name ?? '—' }}
            </span>
          </div>

          <div class="p-3 rounded-xl bg-surface-container-low flex flex-col gap-1">
            <span class="font-label-code-sm text-[11px] text-on-surface-variant flex items-center gap-1">
              <span class="material-symbols-rounded text-sm text-emerald-500">graphic_eq</span>
              Аудио-Войсов
            </span>
            <span class="font-headline-sm text-base font-bold text-on-surface">
              {{ ((arena.activeVoices$ | async) ?? []).length }} реплик
            </span>
          </div>

          <div class="p-3 rounded-xl bg-surface-container-low flex flex-col gap-1">
            <span class="font-label-code-sm text-[11px] text-on-surface-variant flex items-center gap-1">
              <span class="material-symbols-rounded text-sm text-indigo-500">category</span>
              Фракций & Категорий
            </span>
            <span class="font-headline-sm text-base font-bold text-on-surface">
              4 категории
            </span>
          </div>
        </div>
      </section>

      <!-- 3. ACTIVE LEAD HERO SPOTLIGHT & VOICE STUDIO -->
      @if (arena.leadActor$ | async; as lead) {
        <section
          class="rounded-2xl p-space-md bg-surface-container-lowest border-2 border-primary shadow-sm flex flex-col gap-space-md relative overflow-hidden"
        >
          <div
            class="px-3.5 py-1 rounded-bl-xl bg-primary text-on-primary font-label-code-sm text-[11px] font-bold uppercase tracking-wider absolute top-0 right-0 flex items-center gap-1.5 shadow-xs"
          >
            <span class="w-2 h-2 rounded-full bg-on-primary animate-pulse"></span>
            <span>В ЭФИРЕ · АКТИВНЫЙ ГОЛОС АРЕНЫ</span>
          </div>

          <div class="flex flex-col md:flex-row md:items-center justify-between gap-space-md pt-2">
            <div class="flex items-start md:items-center gap-space-md">
              <app-actor-avatar
                [avatar]="lead.avatarIcon"
                containerClass="w-20 h-20 rounded-2xl shadow-md ring-4 ring-primary/20 flex-shrink-0"
              />
              <div class="flex flex-col">
                <div class="flex items-center gap-2 flex-wrap">
                  <span
                    class="font-label-code-sm text-[10px] px-2 py-0.5 rounded-full font-bold uppercase"
                    [class]="getAccentPillClasses(lead.accentColor)"
                  >
                    {{ lead.categoryLabel }}
                  </span>
                  <span class="font-label-code-sm text-xs text-outline font-semibold">
                    {{ lead.rankLabel }}
                  </span>
                </div>
                <h2 class="font-headline-sm text-xl font-bold text-on-surface mt-1">
                  {{ lead.name }}
                </h2>
                <p class="font-label-ui text-xs text-on-surface-variant">
                  {{ lead.title }}
                </p>
                <blockquote
                  class="mt-2 p-2.5 rounded-xl bg-surface-container-low border-l-2 border-primary font-body-sm text-xs italic text-on-surface"
                >
                  «{{ lead.quote }}»
                </blockquote>
              </div>
            </div>

            <div class="flex flex-col gap-2 flex-shrink-0">
              <div class="flex items-center gap-2">
                <a
                  [routerLink]="['/party/cloud']"
                  [queryParams]="{ workspace: lead.id }"
                  class="px-3.5 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-ui text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-xs"
                  title="Открыть персональный Workspace ведущего героя в Хроно-Облаке"
                >
                  <span class="material-symbols-rounded text-base text-primary">cloud</span>
                  <span>Workspace героя</span>
                </a>
                <button
                  type="button"
                  (click)="arena.previewActorVoice(lead)"
                  class="px-3.5 py-2 rounded-xl bg-primary-container text-on-primary-container font-label-ui text-xs font-bold hover:brightness-105 transition-all inline-flex items-center gap-1.5 shadow-xs"
                >
                  <span class="material-symbols-rounded text-base">volume_up</span>
                  <span>Озвучить цитату</span>
                </button>
                <button
                  type="button"
                  (click)="enterArenaWithActor(lead)"
                  class="px-3.5 py-2 rounded-xl bg-primary text-on-primary font-label-ui text-xs font-bold hover:brightness-105 transition-all inline-flex items-center gap-1.5 shadow-xs"
                >
                  <span class="material-symbols-rounded text-base">swords</span>
                  <span>Перейти в бой на Арену →</span>
                </button>
              </div>
              <div class="text-[11px] font-label-code-sm text-on-surface-variant">
                <span>Любимая карточка: </span>
                <strong class="text-primary">{{ lead.favoriteDesire }}</strong>
              </div>
            </div>
          </div>

          <!-- TRAITS BREAKDOWN -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-surface-container-low text-xs">
            <div>
              <div class="flex justify-between font-label-ui font-semibold text-on-surface">
                <span>Харизма</span>
                <span>{{ lead.traits.charisma }}%</span>
              </div>
              <div class="h-1.5 bg-surface-container-high rounded-full overflow-hidden mt-1">
                <div class="h-full bg-amber-500 rounded-full" [style.width.%]="lead.traits.charisma"></div>
              </div>
            </div>
            <div>
              <div class="flex justify-between font-label-ui font-semibold text-on-surface">
                <span>Аналитика</span>
                <span>{{ lead.traits.analytical }}%</span>
              </div>
              <div class="h-1.5 bg-surface-container-high rounded-full overflow-hidden mt-1">
                <div class="h-full bg-emerald-500 rounded-full" [style.width.%]="lead.traits.analytical"></div>
              </div>
            </div>
            <div>
              <div class="flex justify-between font-label-ui font-semibold text-on-surface">
                <span>Versus-Дух</span>
                <span>{{ lead.traits.rebelVersus }}%</span>
              </div>
              <div class="h-1.5 bg-surface-container-high rounded-full overflow-hidden mt-1">
                <div class="h-full bg-indigo-500 rounded-full" [style.width.%]="lead.traits.rebelVersus"></div>
              </div>
            </div>
          </div>
        </section>

        <!-- VOICE STUDIO FOR ACTIVE LEAD HERO -->
        <app-arena-voice-studio />
      }

      <!-- 4. FILTERING & SEARCH CONTROLS -->
      <section
        class="bg-surface-container-lowest rounded-2xl p-space-md shadow-xs border border-outline-variant/30 flex flex-col gap-3"
      >
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <!-- Category Filters -->
          <div class="flex items-center gap-1.5 flex-wrap">
            @for (cat of categoryFilters; track cat.id) {
              <button
                type="button"
                (click)="selectedActorCategory.set(cat.id)"
                class="px-3 py-1.5 rounded-xl font-label-ui text-xs font-bold transition-all inline-flex items-center gap-1.5"
                [class]="
                  selectedActorCategory() === cat.id
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface border border-outline-variant/30'
                "
              >
                <span>{{ cat.label }}</span>
                <span
                  class="font-label-code-sm text-[10px] px-1.5 py-0.2 rounded-full"
                  [class]="
                    selectedActorCategory() === cat.id
                      ? 'bg-on-primary/20 text-on-primary'
                      : 'bg-surface-container-high text-on-surface-variant'
                  "
                >
                  {{ getCategoryCount(cat.id, (arena.actors$ | async) ?? []) }}
                </span>
              </button>
            }
          </div>

          <!-- Search & Sorting -->
          <div class="flex items-center gap-2 flex-wrap">
            <div class="relative">
              <span class="material-symbols-rounded text-sm text-on-surface-variant absolute left-2.5 top-2">
                search
              </span>
              <input
                type="text"
                [(ngModel)]="actorSearchQuery"
                placeholder="Поиск по имени, цитате, тегам..."
                class="pl-8 pr-3 py-1.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-xs text-on-surface w-64 focus:outline-hidden focus:border-primary"
              />
            </div>

            <select
              [ngModel]="sortOption()"
              (ngModelChange)="sortOption.set($event)"
              class="px-3 py-1.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-xs text-on-surface font-label-ui"
            >
              <option value="NAME">Сортировка: Имя (А-Я)</option>
              <option value="CHARISMA">Сортировка: Харизма</option>
              <option value="ANALYTICAL">Сортировка: Аналитика</option>
              <option value="REBEL">Сортировка: Versus-Дух</option>
              <option value="VOICES">Сортировка: Число Войсов</option>
            </select>
          </div>
        </div>
      </section>

      <!-- 5. 30 CHARACTERS GRID -->
      <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
        @for (actor of getFilteredActors((arena.actors$ | async) ?? []); track actor.id) {
          <div
            class="rounded-2xl p-space-md transition-all flex flex-col justify-between gap-3 relative overflow-hidden group"
            [class]="
              actor.isLead
                ? 'bg-surface-container-lowest border-2 border-primary shadow-md ring-4 ring-primary/15'
                : 'bg-surface-container-lowest border border-outline-variant/30 hover:border-primary/60 shadow-xs'
            "
          >
            @if (actor.isLead) {
              <div
                class="px-3 py-1 rounded-bl-xl bg-primary text-on-primary font-label-code-sm text-[10px] font-bold uppercase tracking-wider absolute top-0 right-0 flex items-center gap-1.5 shadow-xs"
              >
                <span class="w-2 h-2 rounded-full bg-on-primary animate-pulse"></span>
                <span>ГЛАВНЫЙ · МИКРОФОН АКТИВЕН</span>
              </div>
            } @else {
              <button
                type="button"
                (click)="selectMainActor(actor)"
                class="px-2.5 py-1 rounded-bl-xl bg-surface-container-high text-on-surface-variant group-hover:bg-primary-container group-hover:text-on-primary-container font-label-code-sm text-[10px] font-bold uppercase absolute top-0 right-0 transition-colors"
              >
                Сделать главным
              </button>
            }

            <div class="flex flex-col gap-2.5 pt-2">
              <div class="flex items-start gap-3">
                <app-actor-avatar
                  [avatar]="actor.avatarIcon"
                  [containerClass]="
                    actor.isLead
                      ? 'w-16 h-16 rounded-2xl shadow-sm ring-2 ring-primary flex-shrink-0'
                      : 'w-16 h-16 rounded-2xl shadow-xs border border-outline-variant/30 flex-shrink-0 group-hover:scale-105 transition-transform'
                  "
                />
                <div class="min-w-0 flex-1 pr-16">
                  <div class="flex items-center gap-1.5 flex-wrap">
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
                  <h3 class="font-headline-sm text-base font-bold text-on-surface mt-1 truncate">
                    {{ actor.name }}
                  </h3>
                  <p class="font-label-ui text-xs text-on-surface-variant truncate">
                    {{ actor.title }}
                  </p>
                </div>
              </div>

              <blockquote
                class="p-2.5 rounded-xl bg-surface-container-low/80 border-l-2 border-primary font-body-sm text-xs italic text-on-surface"
              >
                {{ actor.quote }}
              </blockquote>

              <div class="text-xs font-body-sm text-on-surface-variant">
                <strong class="text-on-surface font-semibold">Взгляд на парадоксы:</strong>
                {{ actor.paradoxPhilosophy }}
              </div>

              <div class="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-surface-container-low text-xs">
                <span class="text-on-surface-variant font-label-ui">Любимая карточка:</span>
                <span class="font-label-ui font-bold text-primary flex items-center gap-1">
                  <span class="material-symbols-rounded text-sm">style</span>
                  {{ actor.favoriteDesire }}
                </span>
              </div>
            </div>

            <!-- METERS & ACTION BUTTONS -->
            <div class="pt-2 border-t border-outline-variant/20 flex flex-col gap-2">
              <div class="grid grid-cols-3 gap-2 text-[10px] font-label-code-sm">
                <div>
                  <div class="flex justify-between text-on-surface-variant">
                    <span>Харизма</span>
                    <strong>{{ actor.traits.charisma }}</strong>
                  </div>
                  <div class="h-1 bg-surface-container-high rounded-full overflow-hidden mt-0.5">
                    <div class="h-full bg-amber-500" [style.width.%]="actor.traits.charisma"></div>
                  </div>
                </div>
                <div>
                  <div class="flex justify-between text-on-surface-variant">
                    <span>Аналитика</span>
                    <strong>{{ actor.traits.analytical }}</strong>
                  </div>
                  <div class="h-1 bg-surface-container-high rounded-full overflow-hidden mt-0.5">
                    <div class="h-full bg-emerald-500" [style.width.%]="actor.traits.analytical"></div>
                  </div>
                </div>
                <div>
                  <div class="flex justify-between text-on-surface-variant">
                    <span>Versus-Дух</span>
                    <strong>{{ actor.traits.rebelVersus }}</strong>
                  </div>
                  <div class="h-1 bg-surface-container-high rounded-full overflow-hidden mt-0.5">
                    <div class="h-full bg-indigo-500" [style.width.%]="actor.traits.rebelVersus"></div>
                  </div>
                </div>
              </div>

              <!-- TAGS & VOICES -->
              <div class="flex items-center justify-between gap-2 pt-1">
                <div class="flex flex-wrap gap-1">
                  @for (tag of actor.affinities.slice(0, 3); track tag) {
                    <span class="font-label-code-sm text-[10px] px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">
                      {{ tag }}
                    </span>
                  }
                </div>
                <span class="font-label-code-sm text-[11px] font-semibold text-on-surface-variant flex items-center gap-1">
                  <span class="material-symbols-rounded text-xs">graphic_eq</span>
                  {{ actor.voicesCount }} войсов
                </span>
              </div>

              <!-- CARD ACTIONS -->
              <div class="flex items-center justify-between gap-1.5 pt-1 flex-wrap">
                <a
                  [routerLink]="['/party/cloud']"
                  [queryParams]="{ workspace: actor.id }"
                  class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface font-label-ui text-xs font-semibold transition-all"
                  title="Открыть персональный Workspace героя в Хроно-Облаке"
                >
                  <span class="material-symbols-rounded text-sm text-primary">cloud</span>
                  <span>Workspace</span>
                </a>

                <button
                  type="button"
                  (click)="arena.previewActorVoice(actor)"
                  class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface font-label-ui text-xs font-semibold transition-all"
                  title="Озвучить цитату персонажа"
                >
                  <span class="material-symbols-rounded text-sm text-primary">volume_up</span>
                  <span>Реплика</span>
                </button>

                @if (!actor.isLead) {
                  <button
                    type="button"
                    (click)="selectMainActor(actor)"
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-high hover:bg-primary-container hover:text-on-primary-container text-on-surface font-label-ui text-xs font-semibold transition-all"
                  >
                    <span class="material-symbols-rounded text-sm">check_circle</span>
                    <span>Выбрать</span>
                  </button>
                }

                <button
                  type="button"
                  (click)="enterArenaWithActor(actor)"
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary hover:text-on-primary text-primary font-label-ui text-xs font-bold transition-all ml-auto"
                  title="Назначить главным и перейти в бой на Арену"
                >
                  <span class="material-symbols-rounded text-sm">swords</span>
                  <span>В бой →</span>
                </button>
              </div>
            </div>
          </div>
        }
      </section>
    </div>
  `,
})
export class ArenaHeroesComponent {
  protected readonly arena = inject(NeuronArenaService);
  protected readonly router = inject(Router);
  protected readonly getAccentPillClasses = getAccentPillClasses;

  readonly selectedActorCategory = signal<'ALL' | ArenaActorCategory>('ALL');
  readonly sortOption = signal<HeroSortOption>('NAME');
  actorSearchQuery = '';

  readonly categoryFilters: { id: 'ALL' | ArenaActorCategory; label: string }[] = [
    { id: 'ALL', label: 'Все персонажи' },
    { id: 'HUMAN', label: '🏠 Главные герои и Друзья' },
    { id: 'MYTHIC', label: '⚡ Боги и Легенды' },
    { id: 'SAGE', label: '🧠 Учёные и Мудрецы' },
    { id: 'CYBER', label: '💻 Программисты и Кибер' },
  ];

  selectMainActor(actor: ArenaActorCard): void {
    this.arena.selectLeadActor(actor.id);
  }

  enterArenaWithActor(actor: ArenaActorCard): void {
    this.arena.selectLeadActor(actor.id);
    this.router.navigate(['/party']);
  }

  getCategoryCount(catId: 'ALL' | ArenaActorCategory, actors: ArenaActorCard[]): number {
    if (catId === 'ALL') return actors.length;
    return actors.filter((a) => a.category === catId).length;
  }

  getFilteredActors(actors: ArenaActorCard[]): ArenaActorCard[] {
    const cat = this.selectedActorCategory();
    const q = this.actorSearchQuery.trim().toLowerCase();
    const sort = this.sortOption();

    let result = actors.filter((a) => {
      if (cat !== 'ALL' && a.category !== cat) return false;
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        a.title.toLowerCase().includes(q) ||
        a.categoryLabel.toLowerCase().includes(q) ||
        a.quote.toLowerCase().includes(q) ||
        a.affinities.some((tag) => tag.toLowerCase().includes(q))
      );
    });

    result = [...result].sort((a, b) => {
      switch (sort) {
        case 'CHARISMA':
          return b.traits.charisma - a.traits.charisma;
        case 'ANALYTICAL':
          return b.traits.analytical - a.traits.analytical;
        case 'REBEL':
          return b.traits.rebelVersus - a.traits.rebelVersus;
        case 'VOICES':
          return b.voicesCount - a.voicesCount;
        case 'NAME':
        default:
          return a.name.localeCompare(b.name, 'ru');
      }
    });

    return result;
  }
}
