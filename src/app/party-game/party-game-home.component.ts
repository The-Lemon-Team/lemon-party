import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ActorAvatarComponent } from '../components/neuron-arena/actor-avatar.component';
import { NeuronArenaService } from '../core/services/neuron-arena.service';
import { PartyRealtimeService } from '../core/services/party-realtime.service';
import { PartySoundService } from './party-sound.service';

@Component({
  selector: 'app-party-game-home',
  standalone: true,
  imports: [AsyncPipe, RouterLink, ActorAvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-8 pb-12 w-full">
      <!-- 1. COMPACT GAME HUB HEADER (ФОКУС И СТАТУС СЕССИИ) -->
      <section
        class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/15 via-secondary/10 to-surface-container-low border border-outline-variant/30 p-6 lg:p-8 shadow-xs"
      >
        <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div class="max-w-4xl flex flex-col gap-3">
            <div class="flex flex-wrap items-center gap-2">
              <span
                class="font-label-code-sm text-xs px-3 py-1 rounded-full bg-primary text-on-primary font-bold shadow-xs flex items-center gap-1.5"
              >
                <span class="material-symbols-rounded text-sm">sports_esports</span>
                <span>Lemon Party Game Suite v2.0</span>
              </span>
              <span
                class="inline-flex items-center gap-1.5 font-label-code-sm text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold"
              >
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                Лобби онлайн · {{ realtime.latencyMs() }}ms
              </span>
              <span
                class="inline-flex items-center gap-1 font-label-code-sm text-xs px-2.5 py-1 rounded-full bg-surface-container-highest text-on-surface font-semibold"
              >
                <span class="material-symbols-rounded text-sm text-primary">meeting_room</span>
                {{ realtime.getActiveRoom().title }} ({{ realtime.getActiveRoom().participantsCount }}👥)
              </span>
            </div>

            <h1 class="font-headline-xl text-2xl sm:text-3xl lg:text-4xl font-black text-on-surface tracking-tight leading-tight">
              Режимы Игры & Схватки
            </h1>

            <p class="font-body-md text-sm sm:text-base text-on-surface-variant leading-relaxed max-w-3xl">
              Выберите игровую механику для вашей компании и начните раунд: совмещайте несовместимые планы,
              голосуйте в жарких дебатах или исследуйте 3D-орбиту желаний.
            </p>

            <!-- Quick Stats Badges -->
            <div class="flex flex-wrap items-center gap-2.5 pt-1">
              <div class="px-3 py-1 rounded-xl bg-surface-container-lowest/90 backdrop-blur-sm border border-outline-variant/30 font-label-ui text-xs text-on-surface flex items-center gap-2 shadow-xs">
                <span class="material-symbols-rounded text-primary text-base">diversity_3</span>
                <span><strong>{{ ((arena.actors$ | async) ?? []).length }}</strong> героев</span>
              </div>
              <div class="px-3 py-1 rounded-xl bg-surface-container-lowest/90 backdrop-blur-sm border border-outline-variant/30 font-label-ui text-xs text-on-surface flex items-center gap-2 shadow-xs">
                <span class="material-symbols-rounded text-primary text-base">style</span>
                <span><strong>{{ ((arena.desireCards$ | async) ?? []).length }}</strong> карточек досуга</span>
              </div>
              <div class="px-3 py-1 rounded-xl bg-surface-container-lowest/90 backdrop-blur-sm border border-outline-variant/30 font-label-ui text-xs text-on-surface flex items-center gap-2 shadow-xs">
                <span class="material-symbols-rounded text-primary text-base">spatial_audio_off</span>
                <span><strong>{{ ((arena.activeVoices$ | async) ?? []).length }}</strong> войс-реплик</span>
              </div>
            </div>
          </div>

          <!-- Quick Creation Actions -->
          <div class="flex flex-row lg:flex-col gap-2.5 flex-wrap flex-shrink-0">
            <button
              type="button"
              (click)="arena.openNewParadoxModal()"
              class="px-5 py-3 rounded-2xl bg-primary text-on-primary font-label-ui text-xs font-bold hover:brightness-105 active:scale-95 transition-all shadow-md inline-flex items-center gap-2 cursor-pointer"
            >
              <span class="material-symbols-rounded text-lg">flare</span>
              <span>+ Создать Спор / Баттл</span>
            </button>

            <button
              type="button"
              (click)="arena.openNewDesireCardModal()"
              class="px-4 py-2.5 rounded-2xl bg-surface-container-lowest hover:bg-surface-container-high text-on-surface font-label-ui text-xs font-bold transition-all border border-outline-variant/30 inline-flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <span class="material-symbols-rounded text-base text-primary">style</span>
              <span>+ Карточка Досуга</span>
            </button>

            <button
              type="button"
              (click)="arena.openNewActorModal()"
              class="px-4 py-2.5 rounded-2xl bg-surface-container-lowest hover:bg-surface-container-high text-on-surface font-label-ui text-xs font-bold transition-all border border-outline-variant/30 inline-flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <span class="material-symbols-rounded text-base text-primary">person_add</span>
              <span>+ Новый Герой</span>
            </button>
          </div>
        </div>
      </section>

      <!-- 2. FOREGROUND: PRIMARY GAME MODES SHOWCASE (ГЛАВНЫЙ ЭКРАН ВЫБОРА РЕЖИМА) -->
      <section class="flex flex-col gap-5 w-full">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h2 class="font-headline-sm text-xl sm:text-2xl font-black text-on-surface tracking-tight flex items-center gap-2.5">
              <span class="material-symbols-rounded text-primary text-2xl sm:text-3xl">sports_esports</span>
              <span>Каталог Игровых Режимов</span>
            </h2>
            <p class="font-body-sm text-xs sm:text-sm text-on-surface-variant">
              Каждый режим предлагает уникальную механику взаимодействия для вашей вечеринки
            </p>
          </div>
          <span class="font-label-code-sm text-xs px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-bold hidden sm:inline">
            6 режимов доступно
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
          <!-- MODE 1: Игровое Поле & Схватки (Flagship Battle Arena) -->
          <div
            class="group relative overflow-hidden rounded-3xl bg-surface-container-lowest p-6 sm:p-7 border-2 border-primary/40 hover:border-primary transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col justify-between"
          >
            <!-- Glowing accent pill -->
            <div class="flex flex-col gap-4">
              <div class="flex items-center justify-between gap-2">
                <div class="w-14 h-14 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <span class="material-symbols-rounded text-3xl">swords</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="font-label-code-sm text-xs font-bold px-3 py-1 rounded-full bg-primary/15 text-primary uppercase tracking-wide">
                    Флагман Арены
                  </span>
                </div>
              </div>

              <div>
                <h3 class="font-headline-sm text-xl font-bold text-on-surface group-hover:text-primary transition-colors">
                  Игровое Поле & Схватки
                </h3>
                <p class="font-body-sm text-xs text-on-surface-variant leading-relaxed mt-1.5">
                  Центральное пространство для разрешения споров и совмещения интересов участников вечеринки.
                </p>
              </div>

              <!-- Key Mechanics Chips -->
              <div class="flex flex-col gap-2 pt-1">
                <div class="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-start gap-2">
                  <span class="material-symbols-rounded text-base text-primary flex-shrink-0 mt-0.5">call_merge</span>
                  <div class="text-xs font-body-sm">
                    <strong class="text-on-surface font-semibold">Combine Mode:</strong>
                    <span class="text-on-surface-variant ml-1">Совмещение двух дел в общий слот времени без конфликта.</span>
                  </div>
                </div>
                <div class="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-start gap-2">
                  <span class="material-symbols-rounded text-base text-rose-500 flex-shrink-0 mt-0.5">how_to_vote</span>
                  <div class="text-xs font-body-sm">
                    <strong class="text-on-surface font-semibold">Versus Mode:</strong>
                    <span class="text-on-surface-variant ml-1">Битва альтернатив 1 на 1 со зрительским живым голосованием.</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-6 pt-4 border-t border-outline-variant/20 flex items-center justify-between gap-3">
              <div class="text-[11px] font-label-code-sm text-outline">
                Слоты: 19:00 - 23:00
              </div>
              <a
                routerLink="/party/field"
                class="px-4 py-2.5 rounded-xl bg-primary text-on-primary font-label-ui text-xs font-bold hover:brightness-105 active:scale-95 transition-all shadow-xs inline-flex items-center gap-1.5 no-underline cursor-pointer"
              >
                <span>Начать на Арене</span>
                <span class="material-symbols-rounded text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </a>
            </div>
          </div>

          <!-- MODE 2: Хроно-Облако Левитации & День Персонажей (Foundational Flagship Game) -->
          <div
            class="group relative overflow-hidden rounded-3xl bg-surface-container-lowest p-6 sm:p-7 border-2 border-amber-400/50 hover:border-amber-500 transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col justify-between ring-1 ring-amber-400/20"
          >
            <div class="flex flex-col gap-4">
              <div class="flex items-center justify-between gap-2">
                <div class="w-14 h-14 rounded-2xl bg-amber-400/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform text-3xl">
                  ☁️
                </div>
                <span class="font-label-code-sm text-xs font-bold px-3 py-1 rounded-full bg-amber-400/20 text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                  ⭐ Главная Игра
                </span>
              </div>

              <div>
                <h3 class="font-headline-sm text-xl font-bold text-on-surface group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Хроно-Облако Левитации & День Персонажей
                </h3>
                <p class="font-body-sm text-xs text-on-surface-variant leading-relaxed mt-1.5">
                  Базовая и главная игра: ведите день от лица любого героя, делитесь мыслями, вносите предложения и наблюдайте за таймлайном дня прямо внутри мультяшного облака.
                </p>
              </div>

              <!-- Key Mechanics Chips -->
              <div class="flex flex-col gap-2 pt-1">
                <div class="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-start gap-2">
                  <span class="material-symbols-rounded text-base text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5">timeline</span>
                  <div class="text-xs font-body-sm">
                    <strong class="text-on-surface font-semibold">Таймлайн внутри облака:</strong>
                    <span class="text-on-surface-variant ml-1">Часовая шкала 08:00–24:00 с левитирующими мыслями и заметками.</span>
                  </div>
                </div>
                <div class="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-start gap-2">
                  <span class="material-symbols-rounded text-base text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5">sentiment_satisfied</span>
                  <div class="text-xs font-body-sm">
                    <strong class="text-on-surface font-semibold">Ролевой вброс от 30 героев:</strong>
                    <span class="text-on-surface-variant ml-1">Мысли 💭, идеи 💡 и экшены ⚡ с поддержкой (+1) и звуками.</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-6 pt-4 border-t border-outline-variant/20 flex items-center justify-between gap-3">
              <div class="text-[11px] font-label-code-sm text-outline">
                Мультяшный стиль · Привязка к дате
              </div>
              <a
                routerLink="/party/cloud"
                class="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-label-ui text-xs font-bold hover:brightness-105 active:scale-95 transition-all shadow-xs inline-flex items-center gap-1.5 no-underline cursor-pointer"
              >
                <span>Запустить Хроно-Облако</span>
                <span class="material-symbols-rounded text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </a>
            </div>
          </div>

          <!-- MODE 3: Колода Желаний (Desire Deck Library) -->
          <div
            class="group relative overflow-hidden rounded-3xl bg-surface-container-lowest p-6 sm:p-7 border-2 border-amber-500/30 hover:border-amber-500 transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col justify-between"
          >
            <div class="flex flex-col gap-4">
              <div class="flex items-center justify-between gap-2">
                <div class="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <span class="material-symbols-rounded text-3xl">style</span>
                </div>
                <span class="font-label-code-sm text-xs font-bold px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 uppercase tracking-wide">
                  Колода Досуга
                </span>
              </div>

              <div>
                <h3 class="font-headline-sm text-xl font-bold text-on-surface group-hover:text-amber-600 transition-colors">
                  Колода Желаний & Идей
                </h3>
                <p class="font-body-sm text-xs text-on-surface-variant leading-relaxed mt-1.5">
                  Более 30 готовых карточек досуга для компании: от пиццы и настолок до выездов на природу.
                </p>
              </div>

              <!-- Key Mechanics Chips -->
              <div class="flex flex-col gap-2 pt-1">
                <div class="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-start gap-2">
                  <span class="material-symbols-rounded text-base text-amber-600 flex-shrink-0 mt-0.5">bolt</span>
                  <div class="text-xs font-body-sm">
                    <strong class="text-on-surface font-semibold">Фильтры Энергии & Бюджета:</strong>
                    <span class="text-on-surface-variant ml-1">Сортировка по вайбам: Драйв, Чилл, Ум, Еда.</span>
                  </div>
                </div>
                <div class="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-start gap-2">
                  <span class="material-symbols-rounded text-base text-amber-600 flex-shrink-0 mt-0.5">add_circle</span>
                  <div class="text-xs font-body-sm">
                    <strong class="text-on-surface font-semibold">Конструктор Карточек:</strong>
                    <span class="text-on-surface-variant ml-1">Создание собственных активностей для вечеринки.</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-6 pt-4 border-t border-outline-variant/20 flex items-center justify-between gap-3">
              <div class="text-[11px] font-label-code-sm text-outline">
                {{ ((arena.desireCards$ | async) ?? []).length }} карточек в базе
              </div>
              <a
                routerLink="/party/cards"
                class="px-4 py-2.5 rounded-xl bg-amber-600 text-white font-label-ui text-xs font-bold hover:brightness-105 active:scale-95 transition-all shadow-xs inline-flex items-center gap-1.5 no-underline cursor-pointer"
              >
                <span>Открыть Колоду</span>
                <span class="material-symbols-rounded text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </a>
            </div>
          </div>

          <!-- MODE 4: Ростер Персонажей & Ведущие (Heroes Roster) -->
          <div
            class="group relative overflow-hidden rounded-3xl bg-surface-container-lowest p-6 sm:p-7 border-2 border-purple-500/30 hover:border-purple-500 transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col justify-between"
          >
            <div class="flex flex-col gap-4">
              <div class="flex items-center justify-between gap-2">
                <div class="w-14 h-14 rounded-2xl bg-purple-500/20 text-purple-700 dark:text-purple-300 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <span class="material-symbols-rounded text-3xl">diversity_3</span>
                </div>
                <span class="font-label-code-sm text-xs font-bold px-3 py-1 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 uppercase tracking-wide">
                  30 Персонажей
                </span>
              </div>

              <div>
                <h3 class="font-headline-sm text-xl font-bold text-on-surface group-hover:text-purple-600 transition-colors">
                  Ростер Персонажей
                </h3>
                <p class="font-body-sm text-xs text-on-surface-variant leading-relaxed mt-1.5">
                  Яркие архетипы: Кибер-Лемур, Бабушка Нина, Шеф-Повар Рататуй. Характеры, слабости и озвучка.
                </p>
              </div>

              <!-- Key Mechanics Chips -->
              <div class="flex flex-col gap-2 pt-1">
                <div class="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-start gap-2">
                  <span class="material-symbols-rounded text-base text-purple-600 flex-shrink-0 mt-0.5">record_voice_over</span>
                  <div class="text-xs font-body-sm">
                    <strong class="text-on-surface font-semibold">Назначение Ведущего:</strong>
                    <span class="text-on-surface-variant ml-1">Выбирайте лидера, комментирующего все события в комнате.</span>
                  </div>
                </div>
                <div class="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-start gap-2">
                  <span class="material-symbols-rounded text-base text-purple-600 flex-shrink-0 mt-0.5">volume_up</span>
                  <div class="text-xs font-body-sm">
                    <strong class="text-on-surface font-semibold">Озвучка Реплик:</strong>
                    <span class="text-on-surface-variant ml-1">Прослушивание авторских фраз каждого героя в один клик.</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-6 pt-4 border-t border-outline-variant/20 flex items-center justify-between gap-3">
              <div class="text-[11px] font-label-code-sm text-outline">
                {{ ((arena.actors$ | async) ?? []).length }} героев с озвучкой
              </div>
              <a
                routerLink="/party/heroes"
                class="px-4 py-2.5 rounded-xl bg-purple-600 text-white font-label-ui text-xs font-bold hover:brightness-105 active:scale-95 transition-all shadow-xs inline-flex items-center gap-1.5 no-underline cursor-pointer"
              >
                <span>Смотреть Ростер</span>
                <span class="material-symbols-rounded text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </a>
            </div>
          </div>

          <!-- MODE 5: Студия Войсов & AI Датасет (Voice Studio & Audio Chronicle) -->
          <div
            class="group relative overflow-hidden rounded-3xl bg-surface-container-lowest p-6 sm:p-7 border-2 border-emerald-500/30 hover:border-emerald-500 transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col justify-between"
          >
            <div class="flex flex-col gap-4">
              <div class="flex items-center justify-between gap-2">
                <div class="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <span class="material-symbols-rounded text-3xl">spatial_audio_off</span>
                </div>
                <span class="font-label-code-sm text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
                  Аудио Студия
                </span>
              </div>

              <div>
                <h3 class="font-headline-sm text-xl font-bold text-on-surface group-hover:text-emerald-600 transition-colors">
                  Студия Войсов & AI Датасет
                </h3>
                <p class="font-body-sm text-xs text-on-surface-variant leading-relaxed mt-1.5">
                  Запись живых аудио-реплик, воспроизведение истории споров и обучение нейросети на аргументах гостей.
                </p>
              </div>

              <!-- Key Mechanics Chips -->
              <div class="flex flex-col gap-2 pt-1">
                <div class="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-start gap-2">
                  <span class="material-symbols-rounded text-base text-emerald-600 flex-shrink-0 mt-0.5">mic</span>
                  <div class="text-xs font-body-sm">
                    <strong class="text-on-surface font-semibold">Запись Микрофона:</strong>
                    <span class="text-on-surface-variant ml-1">Запись реальных голосов друзей прямо в браузер.</span>
                  </div>
                </div>
                <div class="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-start gap-2">
                  <span class="material-symbols-rounded text-base text-emerald-600 flex-shrink-0 mt-0.5">dataset</span>
                  <div class="text-xs font-body-sm">
                    <strong class="text-on-surface font-semibold">Стенограмма & Датасет:</strong>
                    <span class="text-on-surface-variant ml-1">Экспорт и валидация аргументов для обучения ИИ.</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-6 pt-4 border-t border-outline-variant/20 flex items-center justify-between gap-3">
              <div class="text-[11px] font-label-code-sm text-outline">
                {{ ((arena.activeVoices$ | async) ?? []).length }} аудио-треков
              </div>
              <a
                routerLink="/party/chronicle"
                class="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-label-ui text-xs font-bold hover:brightness-105 active:scale-95 transition-all shadow-xs inline-flex items-center gap-1.5 no-underline cursor-pointer"
              >
                <span>Войти в Студию</span>
                <span class="material-symbols-rounded text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </a>
            </div>
          </div>

          <!-- MODE 6: Колесо Фортуны & Рулетка (Party Mini-Game Complement) -->
          <div
            class="group relative overflow-hidden rounded-3xl bg-surface-container-lowest p-6 sm:p-7 border-2 border-rose-500/30 hover:border-rose-500 transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col justify-between"
          >
            <div class="flex flex-col gap-4">
              <div class="flex items-center justify-between gap-2">
                <div class="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-700 dark:text-rose-300 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <span class="material-symbols-rounded text-3xl">casino</span>
                </div>
                <span class="font-label-code-sm text-xs font-bold px-3 py-1 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 uppercase tracking-wide">
                  Мини-Игра
                </span>
              </div>

              <div>
                <h3 class="font-headline-sm text-xl font-bold text-on-surface group-hover:text-rose-600 transition-colors">
                  Колесо Фортуны & Рулетка
                </h3>
                <p class="font-body-sm text-xs text-on-surface-variant leading-relaxed mt-1.5">
                  Спонтанный рандомайзер для разогрева: крутите диск фортуны и получайте неожиданный вызов для компании!
                </p>
              </div>

              <!-- Key Mechanics Chips -->
              <div class="flex flex-col gap-2 pt-1">
                <div class="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-start gap-2">
                  <span class="material-symbols-rounded text-base text-rose-500 flex-shrink-0 mt-0.5">refresh</span>
                  <div class="text-xs font-body-sm">
                    <strong class="text-on-surface font-semibold">Случайный Сюжет:</strong>
                    <span class="text-on-surface-variant ml-1">Два персонажа, два желания и процент совместимости.</span>
                  </div>
                </div>
                <div class="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-start gap-2">
                  <span class="material-symbols-rounded text-base text-rose-500 flex-shrink-0 mt-0.5">speed</span>
                  <div class="text-xs font-body-sm">
                    <strong class="text-on-surface font-semibold">Быстрый Старт:</strong>
                    <span class="text-on-surface-variant ml-1">Возможность мгновенно отправить сгенерированный спор на Арену.</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-6 pt-4 border-t border-outline-variant/20 flex items-center justify-between gap-3">
              <div class="text-[11px] font-label-code-sm text-outline">
                Отдельный раздел
              </div>
              <a
                routerLink="/party/roulette"
                class="px-4 py-2.5 rounded-xl bg-rose-600 text-white font-label-ui text-xs font-bold hover:brightness-105 active:scale-95 transition-all shadow-xs inline-flex items-center gap-1.5 no-underline cursor-pointer"
              >
                <span>Крутить Колесо</span>
                <span class="material-symbols-rounded text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- 3. MULTIROOM OVERVIEW & LIVE SESSION STATUS -->
      <section class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch w-full">
        <!-- Lead Hero Host Spotlight -->
        <div class="lg:col-span-5 bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/30 flex flex-col justify-between gap-4 shadow-xs">
          <div>
            <div class="flex items-center justify-between gap-2 mb-4">
              <span class="font-label-ui text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                <span class="material-symbols-rounded text-base text-primary">record_voice_over</span>
                Ведущий / Лидер Пати
              </span>
              <span class="inline-flex items-center gap-1 font-label-code-sm text-[11px] px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                В эфире
              </span>
            </div>

            @if (arena.leadActor$ | async; as lead) {
              <div class="flex items-center gap-4">
                <app-actor-avatar
                  [avatar]="lead.avatarIcon"
                  containerClass="w-16 h-16 rounded-2xl ring-2 ring-primary shadow-sm flex-shrink-0"
                />
                <div class="min-w-0 flex flex-col">
                  <span class="font-label-code-sm text-[10px] text-primary font-bold uppercase">
                    {{ lead.categoryLabel }}
                  </span>
                  <span class="font-headline-sm text-base font-bold text-on-surface truncate">
                    {{ lead.name }}
                  </span>
                  <p class="font-body-sm text-xs italic text-on-surface-variant line-clamp-2 mt-0.5">
                    «{{ lead.quote }}»
                  </p>
                </div>
              </div>
            }
          </div>

          <div class="flex items-center gap-2 pt-3 border-t border-outline-variant/20">
            @if (arena.leadActor$ | async; as lead) {
              <button
                type="button"
                (click)="arena.previewActorVoice(lead)"
                class="flex-1 px-3 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-ui text-xs font-semibold transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span class="material-symbols-rounded text-base text-primary">volume_up</span>
                <span>Прослушать реплику лидера</span>
              </button>
            }
            <a
              routerLink="/party/heroes"
              class="px-3.5 py-2 rounded-xl bg-primary-container text-on-primary-container font-label-ui text-xs font-bold hover:brightness-105 transition-all inline-flex items-center gap-1 no-underline"
            >
              <span>Сменить →</span>
            </a>
          </div>
        </div>

        <!-- Live Activity Stream & Room Switcher -->
        <div class="lg:col-span-7 bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/30 flex flex-col justify-between gap-4 shadow-xs">
          <div>
            <div class="flex items-center justify-between gap-2 mb-3">
              <span class="font-label-ui text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                <span class="material-symbols-rounded text-base text-emerald-600">sensors</span>
                Лента Активности Комнаты
              </span>
              <span class="font-label-code-sm text-[11px] text-outline">
                Синхронизация SSE
              </span>
            </div>

            <div class="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
              @for (evt of ((realtime.events$ | async) ?? []).slice(0, 4); track evt.id) {
                <div class="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between gap-3 text-xs font-body-sm">
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="w-2 h-2 rounded-full bg-primary flex-shrink-0"></span>
                    <span class="font-bold text-on-surface truncate">{{ evt.actorName }}</span>
                    <span class="text-on-surface-variant truncate">{{ evt.message }}</span>
                  </div>
                  <span class="font-label-code-sm text-[10px] text-outline flex-shrink-0">
                    {{ evt.roomTitle }}
                  </span>
                </div>
              }
              @if (!((realtime.events$ | async) ?? []).length) {
                <div class="py-6 text-center text-xs text-on-surface-variant">
                  Пока нет новых событий в этой комнате. Запустите схватку!
                </div>
              }
            </div>
          </div>

          <!-- Multiroom fast bar -->
          <div class="pt-3 border-t border-outline-variant/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-body-sm">
            <span class="text-on-surface-variant font-semibold flex items-center gap-1">
              <span class="material-symbols-rounded text-sm text-primary">meeting_room</span>
              Комнаты компании:
            </span>
            <div class="flex items-center gap-1.5 flex-wrap">
              @for (room of (realtime.rooms$ | async) ?? []; track room.id) {
                <button
                  type="button"
                  (click)="realtime.switchRoom(room.id)"
                  class="px-2.5 py-1 rounded-lg text-xs font-label-ui transition-all border cursor-pointer"
                  [class]="
                    (realtime.activeRoomId$ | async) === room.id
                      ? 'bg-primary text-on-primary border-primary font-bold shadow-xs'
                      : 'bg-surface-container-low text-on-surface hover:border-primary/40'
                  "
                >
                  {{ room.title }}
                </button>
              }
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
})
export class PartyGameHomeComponent {
  protected readonly arena = inject(NeuronArenaService);
  protected readonly realtime = inject(PartyRealtimeService);
  protected readonly sound = inject(PartySoundService);
}
