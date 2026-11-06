import { AsyncPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NeuralTrainingSample } from '../../core/models/flow.models';
import { NeuronArenaService } from '../../core/services/neuron-arena.service';
import { ActorAvatarComponent } from './actor-avatar.component';
import { ArenaVoiceStudioComponent } from './arena-voice-studio.component';

@Component({
  selector: 'app-party-chronicle',
  standalone: true,
  imports: [AsyncPipe, DatePipe, FormsModule, RouterLink, ActorAvatarComponent, ArenaVoiceStudioComponent],
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
          <span class="text-primary font-bold">Хроника Войсов & AI Датасет</span>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="exportTrainingJsonl()"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-on-primary font-label-ui text-xs font-bold hover:brightness-105 transition-all shadow-xs"
          >
            <span class="material-symbols-rounded text-base">download</span>
            <span>Экспорт JSONL Датасета</span>
          </button>
          <a
            routerLink="/party/field"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-lowest border border-outline-variant/40 hover:border-primary text-on-surface font-label-ui text-xs font-bold transition-all shadow-xs"
          >
            <span class="material-symbols-rounded text-base text-primary">swords</span>
            <span>В бой на Арену →</span>
          </a>
        </div>
      </nav>

      <!-- 2. BANNER -->
      <section
        class="bg-surface-container-lowest rounded-2xl p-space-md shadow-xs border border-outline-variant/30 flex flex-col gap-space-md"
      >
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
          <div class="flex items-start gap-space-md">
            <div
              class="w-12 h-12 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center flex-shrink-0 shadow-xs"
            >
              <span class="material-symbols-rounded text-2xl" style="font-variation-settings: 'FILL' 1">
                spatial_audio_off
              </span>
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h1 class="font-headline-sm text-lg font-bold text-on-surface">
                  Хроника Войсов & Датасет для Нейронных Сетей
                </h1>
                <span
                  class="font-label-code-sm text-[11px] px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-semibold"
                >
                  subroute: /party/chronicle
                </span>
                <span
                  class="inline-flex items-center gap-1 font-label-code-sm text-[11px] px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                  Аудио + Текстовые слепки
                </span>
              </div>
              <p class="font-body-sm text-xs text-on-surface-variant mt-1 max-w-4xl">
                Здесь собраны все реплики персонажей, записанные аудиосообщения и сформированные датасеты
                для обучения языковых моделей и нейросетей. Каждое игровое действие превращается в размеченный
                сэмпл диалога!
              </p>
            </div>
          </div>
        </div>

        <!-- Section Switcher Tabs -->
        <div class="flex items-center gap-2 bg-surface-container-low p-1.5 rounded-xl border border-outline-variant/25 self-start">
          <button
            type="button"
            (click)="activeSection.set('voices')"
            class="px-3.5 py-2 rounded-lg font-label-ui text-xs font-bold transition-all inline-flex items-center gap-1.5"
            [class]="
              activeSection() === 'voices'
                ? 'bg-surface-container-lowest text-on-surface shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            "
          >
            <span class="material-symbols-rounded text-base">record_voice_over</span>
            <span>Хроника Войсов & Студия Голосов ({{ ((arena.activeVoices$ | async) ?? []).length }})</span>
          </button>

          <button
            type="button"
            (click)="activeSection.set('dataset')"
            class="px-3.5 py-2 rounded-lg font-label-ui text-xs font-bold transition-all inline-flex items-center gap-1.5"
            [class]="
              activeSection() === 'dataset'
                ? 'bg-surface-container-lowest text-on-surface shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            "
          >
            <span class="material-symbols-rounded text-base">neurology</span>
            <span>Датасет Нейросети для обучения ({{ ((arena.trainingSamples$ | async) ?? []).length }} сэмплов)</span>
          </button>
        </div>
      </section>

      <!-- 3. VOICES SECTION -->
      @if (activeSection() === 'voices') {
        <div class="flex flex-col gap-space-lg">
          <!-- Voice Studio for the Lead Actor -->
          <app-arena-voice-studio />

          <!-- Live Feed of Recorded Voices -->
          <section class="flex flex-col gap-space-sm">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="material-symbols-rounded text-primary text-xl">history_edu</span>
                <h3 class="font-headline-sm text-base font-bold text-on-surface">
                  Лента Реплик и Аудио-Войсов Персонажей
                </h3>
              </div>

              <div class="relative min-w-[220px]">
                <span class="material-symbols-rounded absolute left-3 top-2 text-base text-outline">search</span>
                <input
                  type="text"
                  [(ngModel)]="voiceFilterQuery"
                  placeholder="Фильтр по герою или тексту..."
                  class="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-xs text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div class="bg-surface-container-lowest rounded-2xl p-space-md shadow-xs border border-outline-variant/25 flex flex-col gap-3">
              @for (voice of getFilteredVoices((arena.activeVoices$ | async) ?? []); track voice.id) {
                <div class="p-3.5 rounded-xl bg-surface-container-low/70 border border-outline-variant/20 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div class="flex items-start gap-3 min-w-0">
                    <app-actor-avatar
                      [avatar]="voice.actorIcon"
                      containerClass="w-12 h-12 rounded-2xl shadow-xs flex-shrink-0"
                    />
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="font-headline-sm text-sm font-bold text-on-surface">
                          {{ voice.actorName }}
                        </span>
                        <span class="font-label-code-sm text-[10px] text-on-surface-variant">
                          {{ voice.actorTitle }}
                        </span>
                        @if (voice.threadTitle) {
                          <span class="font-label-code-sm text-[10px] px-2 py-0.5 rounded bg-surface-container-high text-on-surface">
                            Карточка: «{{ voice.threadTitle }}»
                          </span>
                        }
                        @if (voice.audioDataUrl) {
                          <span class="font-label-code-sm text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold inline-flex items-center gap-1">
                            <span class="material-symbols-rounded text-xs">mic</span>
                            Живой аудио-войс
                          </span>
                        }
                      </div>

                      <p class="font-body-sm text-sm text-on-surface mt-1.5">
                        «{{ voice.text }}»
                      </p>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 flex-shrink-0 self-end sm:self-start">
                    <button
                      type="button"
                      (click)="arena.playVoiceAudio(voice)"
                      class="px-3 py-1.5 rounded-xl font-label-ui text-xs font-bold transition-all inline-flex items-center gap-1.5"
                      [class]="
                        (arena.speakingVoiceId$ | async) === voice.id
                          ? 'bg-primary text-on-primary animate-pulse'
                          : 'bg-surface-container-high text-on-surface hover:bg-primary-container'
                      "
                    >
                      <span class="material-symbols-rounded text-base">
                        {{ (arena.speakingVoiceId$ | async) === voice.id ? 'stop_circle' : 'play_circle' }}
                      </span>
                      <span>
                        {{ (arena.speakingVoiceId$ | async) === voice.id ? 'Звучит...' : 'Прослушать (' + voice.durationSec + 'с)' }}
                      </span>
                    </button>
                  </div>
                </div>
              } @empty {
                <div class="p-6 text-center text-xs text-on-surface-variant">
                  Войсов пока нет или ничего не найдено по фильтру. Запишите первый войс через форму выше!
                </div>
              }
            </div>
          </section>
        </div>
      } @else {
        <!-- 4. NEURAL DATASET SECTION -->
        <div class="flex flex-col gap-space-lg">
          <!-- Dataset Explainer Box -->
          <div class="bg-surface-container-lowest rounded-2xl p-space-md border border-primary/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex items-start gap-3">
              <span class="material-symbols-rounded text-3xl text-primary">neurology</span>
              <div>
                <h3 class="font-headline-sm text-base font-bold text-on-surface">
                  Обучающий датасет персонажей для LLM & нейросетей
                </h3>
                <p class="font-body-sm text-xs text-on-surface-variant mt-1 max-w-3xl">
                  Каждая реплика, спор и выбор карточки формирует размеченный обучающий пример формата
                  <strong>Prompt → Response</strong> с сохранением характера персонажа, его уровня бунтарства,
                  харизмы и аналитики. Вы можете выгрузить датасет в стандартном <strong>.jsonl</strong> для
                  дообучения моделей в OpenAI, Hugging Face, vLLM или Ollama.
                </p>
              </div>
            </div>

            <button
              type="button"
              (click)="exportTrainingJsonl()"
              class="px-4 py-2.5 rounded-xl bg-primary text-on-primary font-label-ui text-xs font-bold shadow-xs hover:opacity-95 transition-all inline-flex items-center gap-2 flex-shrink-0"
            >
              <span class="material-symbols-rounded text-base">file_download</span>
              <span>Скачать .JSONL ({{ ((arena.trainingSamples$ | async) ?? []).length }} сэмплов)</span>
            </button>
          </div>

          <!-- Dataset Filter Pills -->
          <div class="flex items-center gap-2 flex-wrap">
            @for (pill of intentFilters; track pill.id) {
              <button
                type="button"
                (click)="selectedIntent.set(pill.id)"
                class="px-3 py-1.5 rounded-xl font-label-ui text-xs font-semibold transition-all border"
                [class]="
                  selectedIntent() === pill.id
                    ? 'bg-primary text-on-primary border-primary shadow-xs'
                    : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface border-outline-variant/30'
                "
              >
                {{ pill.label }}
              </button>
            }
          </div>

          <!-- Dataset Samples Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-space-md">
            @for (sample of getFilteredSamples((arena.trainingSamples$ | async) ?? []); track sample.id) {
              <div class="bg-surface-container-lowest rounded-2xl p-space-md shadow-xs border border-outline-variant/25 font-label-code-sm text-xs flex flex-col justify-between gap-3">
                <div class="flex flex-col gap-2">
                  <div class="flex items-center justify-between text-[11px] border-b border-outline-variant/15 pb-2">
                    <span class="font-bold text-primary flex items-center gap-1">
                      <span class="material-symbols-rounded text-sm">person</span>
                      persona: &#64;{{ sample.actorHandle }} ({{ sample.actorName }})
                    </span>
                    <span
                      class="px-2 py-0.5 rounded font-bold uppercase text-[10px]"
                      [class]="
                        sample.intent === 'SUPPORT'
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : sample.intent === 'COUNTER_PROPOSE'
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                            : 'bg-primary-container text-on-primary-container'
                      "
                    >
                      intent: {{ sample.intent }}
                    </span>
                  </div>

                  <div class="text-[11px] text-on-surface-variant">
                    <span class="font-bold text-on-surface">Контекст выбора:</span> {{ sample.competingDesires.join(' ⚔️ ') }}
                  </div>

                  <div class="p-3 rounded-xl bg-surface-container-low text-on-surface font-body-sm text-xs leading-relaxed">
                    <span class="text-outline font-label-code-sm text-[10px] block mb-1">Сгенерированный отклик:</span>
                    «{{ sample.voiceOutput }}»
                  </div>
                </div>

                <div class="pt-2 border-t border-outline-variant/15 flex items-center justify-between text-[10px] text-outline">
                  <span>id: {{ sample.id }}</span>
                  <span>role: assistant / persona</span>
                </div>
              </div>
            } @empty {
              <div class="col-span-2 p-8 text-center rounded-2xl bg-surface-container-lowest border border-outline-variant/30 text-on-surface-variant">
                Сэмплы для выбранного фильтра не найдены.
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class PartyChronicleComponent {
  protected readonly arena = inject(NeuronArenaService);

  readonly activeSection = signal<'voices' | 'dataset'>('voices');
  readonly selectedIntent = signal<string>('ALL');
  voiceFilterQuery = '';

  readonly intentFilters = [
    { id: 'ALL', label: 'Все сэмплы' },
    { id: 'SUPPORT', label: 'Поддержка (SUPPORT)' },
    { id: 'COUNTER_PROPOSE', label: 'Альтернатива (COUNTER_PROPOSE)' },
    { id: 'COMBINE_PITCH', label: 'Совмещение (COMBINE_PITCH)' },
  ];

  getFilteredVoices(voices: any[]) {
    const q = this.voiceFilterQuery.trim().toLowerCase();
    if (!q) return voices;
    return voices.filter(
      (v) =>
        v.actorName.toLowerCase().includes(q) ||
        v.text.toLowerCase().includes(q) ||
        (v.threadTitle && v.threadTitle.toLowerCase().includes(q)),
    );
  }

  getFilteredSamples(samples: NeuralTrainingSample[]): NeuralTrainingSample[] {
    const intent = this.selectedIntent();
    if (intent === 'ALL') return samples;
    return samples.filter((s) => s.intent === intent);
  }

  exportTrainingJsonl(): void {
    let samples: NeuralTrainingSample[] = [];
    this.arena.trainingSamples$.subscribe((s) => (samples = s)).unsubscribe();
    const jsonl = samples.map((s) => JSON.stringify(s)).join('\n');
    if (typeof Blob !== 'undefined' && typeof document !== 'undefined') {
      const blob = new Blob([jsonl], { type: 'application/x-jsonlines' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lemon-party-persona-dataset-${Date.now()}.jsonl`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }
}
