import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ActorAvatarComponent } from '../components/neuron-arena/actor-avatar.component';
import { ArenaActorCard, ArenaDesireCard } from '../core/models/flow.models';
import { NeuronArenaService } from '../core/services/neuron-arena.service';
import { PartySoundService } from './party-sound.service';

export interface RouletteSector {
  label: string;
  icon: string;
  color: string;
  mood: string;
}

export interface GeneratedClash {
  heroA: ArenaActorCard;
  heroB: ArenaActorCard;
  activityA: string;
  activityB: string;
  compatibilityPercent: number;
  storySnippet: string;
  verdict: string;
}

@Component({
  selector: 'app-party-roulette',
  standalone: true,
  imports: [AsyncPipe, ActorAvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-surface-container-lowest via-surface-container-low to-surface-container-high/40 border-2 border-primary/30 p-6 md:p-8 shadow-md">
      <!-- Ambient decorative glow -->
      <div class="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-secondary/10 blur-3xl pointer-events-none"></div>

      <!-- Header & Intro -->
      <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-primary text-on-primary shadow-xs">
              <span class="material-symbols-rounded text-lg">casino</span>
            </span>
            <span class="font-label-code-sm text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold uppercase tracking-wider">
              Мини-Игра Вечеринки
            </span>
            <span class="inline-flex items-center gap-1 font-label-code-sm text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Live Рандомайзер
            </span>
          </div>
          <h2 class="font-headline-sm text-xl md:text-2xl font-black text-on-surface mt-2 tracking-tight">
            Колесо Досуга & Экспресс-Схватка
          </h2>
          <p class="font-body-sm text-xs md:text-sm text-on-surface-variant max-w-2xl mt-1">
            Крутите колесо, чтобы случайным образом сгенерировать спонтанный вызов для компании:
            два героя, два несовместимых желания и один общий вечер!
          </p>
        </div>

        <!-- Quick Mood Selector -->
        <div class="flex items-center gap-1.5 flex-wrap self-start md:self-center bg-surface-container-lowest/80 backdrop-blur-sm p-1.5 rounded-2xl border border-outline-variant/30">
          <span class="font-label-ui text-[11px] font-bold text-on-surface-variant px-2">Вайб:</span>
          @for (m of moodFilters; track m.id) {
            <button
              type="button"
              (click)="selectMood(m.id)"
              class="px-2.5 py-1 rounded-xl font-label-ui text-xs font-semibold transition-all inline-flex items-center gap-1"
              [class]="
                activeMood() === m.id
                  ? 'bg-primary text-on-primary shadow-xs font-bold'
                  : 'bg-transparent text-on-surface hover:bg-surface-container-high'
              "
            >
              <span>{{ m.emoji }}</span>
              <span>{{ m.label }}</span>
            </button>
          }
        </div>
      </div>

      <!-- Main Interactive Grid: Wheel on Left, Clash Card on Right -->
      <div class="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <!-- 1. The Wheel Visual -->
        <div class="lg:col-span-5 flex flex-col items-center justify-center">
          <div class="relative w-64 h-64 sm:w-72 sm:h-72 select-none">
            <!-- Outer Neon Ring -->
            <div
              class="absolute inset-0 rounded-full border-4 border-primary/40 shadow-[0_0_25px_rgba(var(--c-primary-rgb,113,93,0),0.25)]"
            ></div>

            <!-- Pointer Triangle on Top -->
            <div class="absolute -top-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
              <div class="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[18px] border-t-primary filter drop-shadow-md"></div>
              <div class="w-2.5 h-2.5 rounded-full bg-primary-container -mt-1 ring-2 ring-white"></div>
            </div>

            <!-- Rotating Disk -->
            <div
              class="w-full h-full rounded-full overflow-hidden transition-transform ease-out"
              [style.transform]="'rotate(' + rotationDegrees() + 'deg)'"
              [style.transitionDuration]="isSpinning() ? spinDurationMs + 'ms' : '0ms'"
              [style.transitionTimingFunction]="'cubic-bezier(0.15, 0.85, 0.25, 1)'"
            >
              <svg viewBox="0 0 200 200" class="w-full h-full block">
                <defs>
                  @for (sec of sectors; track sec.label; let i = $index) {
                    <clipPath [id]="'sector-clip-' + i">
                      <path [attr.d]="getSectorSvgPath(i, sectors.length)" />
                    </clipPath>
                  }
                </defs>

                @for (sec of sectors; track sec.label; let i = $index) {
                  <!-- Sector Slice -->
                  <path
                    [attr.d]="getSectorSvgPath(i, sectors.length)"
                    [attr.fill]="sec.color"
                    class="transition-opacity"
                    [class.opacity-95]="selectedSectorIndex() === i"
                    stroke="#ffffff"
                    stroke-width="1.5"
                  />

                  <!-- Sector Text & Icon placed radially -->
                  <g [attr.transform]="getSectorTextTransform(i, sectors.length)">
                    <text
                      x="0"
                      y="-60"
                      text-anchor="middle"
                      fill="#ffffff"
                      font-size="9"
                      font-weight="bold"
                      font-family="system-ui, sans-serif"
                    >
                      {{ sec.icon }} {{ sec.label }}
                    </text>
                  </g>
                }
              </svg>
            </div>

            <!-- Center Cap Button -->
            <button
              type="button"
              (click)="spin()"
              [disabled]="isSpinning()"
              class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-surface-container-lowest border-4 border-primary text-primary shadow-lg flex flex-col items-center justify-center font-label-ui font-black text-xs hover:scale-105 active:scale-95 transition-all z-10 disabled:opacity-75 disabled:pointer-events-none cursor-pointer focus:outline-none focus:ring-4 focus:ring-primary/40"
              title="Крутить колесо"
            >
              <span class="material-symbols-rounded text-xl sm:text-2xl" [class.animate-spin]="isSpinning()">
                {{ isSpinning() ? 'sync' : 'play_arrow' }}
              </span>
              <span class="text-[10px] uppercase font-bold tracking-tight">
                {{ isSpinning() ? '...' : 'Крутить' }}
              </span>
            </button>
          </div>

          <!-- Bottom Button for Mobile / Quick Action -->
          <button
            type="button"
            (click)="spin()"
            [disabled]="isSpinning()"
            class="mt-4 px-6 py-2.5 rounded-2xl bg-primary text-on-primary font-label-ui text-xs font-bold shadow-md hover:brightness-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span class="material-symbols-rounded text-base">casino</span>
            <span>{{ isSpinning() ? 'Колесо вращается...' : 'Испытать Фортуну Вечеринки' }}</span>
          </button>
        </div>

        <!-- 2. The Resulting Clash / Match Showcase on Right -->
        <div class="lg:col-span-7">
          @if (activeClash(); as clash) {
            <div class="bg-surface-container-lowest rounded-2xl p-5 md:p-6 border border-outline-variant/30 shadow-xs flex flex-col gap-4 animate-fadeIn">
              <!-- Top Banner with Compatibility -->
              <div class="flex items-center justify-between gap-2 border-b border-outline-variant/20 pb-3 flex-wrap">
                <div class="flex items-center gap-2">
                  <span class="font-label-ui text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Сгенерированный Спор:
                  </span>
                  <span class="font-label-code-sm text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {{ clash.verdict }}
                  </span>
                </div>
                <div class="flex items-center gap-1.5 font-label-code-sm text-xs font-bold text-on-surface">
                  <span class="material-symbols-rounded text-base text-amber-500">local_fire_department</span>
                  <span>Совместимость: <strong>{{ clash.compatibilityPercent }}%</strong></span>
                </div>
              </div>

              <!-- Two Heroes Face-off Cards -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <!-- Hero A -->
                <div class="p-3.5 rounded-xl bg-surface-container-low border border-primary/20 flex items-start gap-3 relative overflow-hidden">
                  <div class="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                  <app-actor-avatar
                    [avatar]="clash.heroA.avatarIcon"
                    containerClass="w-12 h-12 rounded-xl ring-2 ring-primary/40 flex-shrink-0"
                  />
                  <div class="min-w-0 flex-1">
                    <div class="font-label-code-sm text-[10px] text-primary font-bold uppercase">
                      Сторона A · {{ clash.heroA.categoryLabel }}
                    </div>
                    <div class="font-headline-sm text-sm font-bold text-on-surface truncate">
                      {{ clash.heroA.name }}
                    </div>
                    <div class="mt-1 text-xs font-body-sm text-on-surface-variant flex items-center gap-1.5">
                      <span class="material-symbols-rounded text-sm text-primary">favorite</span>
                      <span class="font-medium truncate">«{{ clash.activityA }}»</span>
                    </div>
                    <button
                      type="button"
                      (click)="arena.previewActorVoice(clash.heroA)"
                      class="mt-2 text-[11px] font-label-ui font-semibold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span class="material-symbols-rounded text-xs">volume_up</span>
                      <span>Слушать реплику</span>
                    </button>
                  </div>
                </div>

                <!-- Hero B -->
                <div class="p-3.5 rounded-xl bg-surface-container-low border border-secondary/20 flex items-start gap-3 relative overflow-hidden">
                  <div class="absolute top-0 left-0 w-1 h-full bg-secondary"></div>
                  <app-actor-avatar
                    [avatar]="clash.heroB.avatarIcon"
                    containerClass="w-12 h-12 rounded-xl ring-2 ring-secondary/40 flex-shrink-0"
                  />
                  <div class="min-w-0 flex-1">
                    <div class="font-label-code-sm text-[10px] text-secondary font-bold uppercase">
                      Сторона B · {{ clash.heroB.categoryLabel }}
                    </div>
                    <div class="font-headline-sm text-sm font-bold text-on-surface truncate">
                      {{ clash.heroB.name }}
                    </div>
                    <div class="mt-1 text-xs font-body-sm text-on-surface-variant flex items-center gap-1.5">
                      <span class="material-symbols-rounded text-sm text-secondary">favorite</span>
                      <span class="font-medium truncate">«{{ clash.activityB }}»</span>
                    </div>
                    <button
                      type="button"
                      (click)="arena.previewActorVoice(clash.heroB)"
                      class="mt-2 text-[11px] font-label-ui font-semibold text-secondary hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span class="material-symbols-rounded text-xs">volume_up</span>
                      <span>Слушать реплику</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Funny Story Conflict Snippet -->
              <div class="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/25 text-xs font-body-sm text-on-surface-variant leading-relaxed">
                <span class="font-bold text-on-surface">🔥 Сюжет столкновения:</span>
                {{ clash.storySnippet }}
              </div>

              <!-- Action CTAs -->
              <div class="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    (click)="launchInField(clash)"
                    class="px-4 py-2.5 rounded-xl bg-primary text-on-primary font-label-ui text-xs font-bold hover:brightness-105 active:scale-95 transition-all shadow-xs inline-flex items-center gap-2 cursor-pointer"
                  >
                    <span class="material-symbols-rounded text-base">swords</span>
                    <span>Разрешить на Игровом Поле →</span>
                  </button>
                  <button
                    type="button"
                    (click)="spin()"
                    [disabled]="isSpinning()"
                    class="px-3.5 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-ui text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span class="material-symbols-rounded text-base">autorenew</span>
                    <span>Другой вызов</span>
                  </button>
                </div>

                <div class="text-[11px] font-label-code-sm text-outline">
                  Слот: 19:00 - 23:00 · Комната Гостиная
                </div>
              </div>
            </div>
          } @else {
            <!-- Empty Placeholder -->
            <div class="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/30 text-center flex flex-col items-center justify-center gap-3">
              <span class="material-symbols-rounded text-4xl text-primary animate-bounce">
                casino
              </span>
              <div class="font-headline-sm text-base font-bold text-on-surface">
                Колесо ждёт вашего броска!
              </div>
              <p class="font-body-sm text-xs text-on-surface-variant max-w-sm">
                Нажмите «Крутить» или выберите вайб настроения вечеринки, чтобы мгновенно сгенерировать схватку двух героев.
              </p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class PartyRouletteComponent implements OnInit {
  protected readonly arena = inject(NeuronArenaService);
  protected readonly sound = inject(PartySoundService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private actorsList: ArenaActorCard[] = [];
  private desireCardsList: ArenaDesireCard[] = [];

  readonly isSpinning = signal<boolean>(false);
  readonly rotationDegrees = signal<number>(0);
  readonly selectedSectorIndex = signal<number>(0);
  readonly activeMood = signal<string>('all');
  readonly activeClash = signal<GeneratedClash | null>(null);

  readonly spinDurationMs = 3200;

  readonly moodFilters = [
    { id: 'all', label: 'Всё', emoji: '✨' },
    { id: 'drive', label: 'Драйв', emoji: '⚡' },
    { id: 'chill', label: 'Чилл', emoji: '🛋️' },
    { id: 'smart', label: 'Ум', emoji: '🧠' },
    { id: 'gastro', label: 'Еда', emoji: '🍕' },
  ];

  readonly sectors: RouletteSector[] = [
    { label: 'Пицца-Пати', icon: '🍕', color: '#e11d48', mood: 'gastro' },
    { label: 'Настолки', icon: '🎲', color: '#d97706', mood: 'smart' },
    { label: 'Ретро-Файтинг', icon: '🎮', color: '#7c3aed', mood: 'drive' },
    { label: 'Коктейли', icon: '🍸', color: '#059669', mood: 'chill' },
    { label: 'Караоке', icon: '🎤', color: '#db2777', mood: 'drive' },
    { label: 'Киномарафон', icon: '🎬', color: '#2563eb', mood: 'chill' },
    { label: 'Квиз-Битва', icon: '🧠', color: '#0891b2', mood: 'smart' },
    { label: 'Челлендж', icon: '⚡', color: '#ca8a04', mood: 'drive' },
  ];

  ngOnInit(): void {
    this.arena.actors$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((actors) => {
        this.actorsList = actors;
        if (!this.activeClash() && actors.length >= 2) {
          this.generateClash(this.sectors[0]);
        }
      });

    this.arena.desireCards$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((cards) => {
        this.desireCardsList = cards;
      });
  }

  spin(): void {
    if (this.isSpinning()) return;
    this.isSpinning.set(true);
    this.sound.playClick();

    // Pick target sector
    const targetSectorIdx = Math.floor(Math.random() * this.sectors.length);
    const sectorAngle = 360 / this.sectors.length;
    // Pointer is on top (0 degrees). We want target sector to land at top.
    const targetAngle = 360 - targetSectorIdx * sectorAngle - sectorAngle / 2;
    const extraSpins = (4 + Math.floor(Math.random() * 3)) * 360;
    const nextTotalDegrees = this.rotationDegrees() + extraSpins + targetAngle;

    // Simulate sound ticks during spin
    this.scheduleSpinTicks();

    this.rotationDegrees.set(nextTotalDegrees);

    setTimeout(() => {
      this.isSpinning.set(false);
      this.selectedSectorIndex.set(targetSectorIdx);
      const chosenSector = this.sectors[targetSectorIdx];
      this.generateClash(chosenSector);
      this.sound.playWin();
    }, this.spinDurationMs);
  }

  selectMood(moodId: string): void {
    this.activeMood.set(moodId);
    this.sound.playClick();
    if (moodId === 'all') {
      this.spin();
      return;
    }
    const matching = this.sectors.findIndex((s) => s.mood === moodId);
    if (matching !== -1) {
      this.selectedSectorIndex.set(matching);
      this.generateClash(this.sectors[matching]);
      this.sound.playWin();
    }
  }

  launchInField(clash: GeneratedClash): void {
    this.sound.playClash();
    // Select card in arena service
    const matchingCard = this.desireCardsList.find(
      (c) => c.title.toLowerCase().includes(clash.activityA.toLowerCase()) || c.title.toLowerCase().includes(clash.activityB.toLowerCase())
    );
    if (matchingCard) {
      this.arena.inspectDesireCard(matchingCard.id);
    }
    this.router.navigate(['/party/field']);
  }

  private scheduleSpinTicks(): void {
    const tickIntervals = [100, 140, 190, 260, 360, 500, 700, 1000];
    let elapsed = 0;
    tickIntervals.forEach((interval) => {
      elapsed += interval;
      if (elapsed < this.spinDurationMs - 400) {
        setTimeout(() => {
          if (this.isSpinning()) {
            this.sound.playTick();
          }
        }, elapsed);
      }
    });
  }

  private generateClash(sector: RouletteSector): void {
    if (this.actorsList.length < 2) return;

    // Shuffle and pick 2 distinct heroes
    const shuffled = [...this.actorsList].sort(() => 0.5 - Math.random());
    const heroA = shuffled[0];
    const heroB = shuffled[1];

    const fallbackActivities = [
      sector.label,
      'Настольный квиз',
      'Ночной хакатон идей',
      'Чайная церемония и медитация',
      'Турнир по Mortal Kombat',
      'Шашлыки на балконе',
      'Спор о будущем ИИ до 4 утра',
      'Караоке с хитами 2000-х',
    ];

    const activityA = heroA.favoriteDesire || sector.label;
    const activityB = heroB.favoriteDesire || fallbackActivities[Math.floor(Math.random() * fallbackActivities.length)];

    const compat = 40 + Math.floor(Math.random() * 55);
    const verdicts = [
      '🔥 Взрывоопасная комбинация',
      '⚖️ Непримиримый парадокс',
      '✨ Идеальное дополнение',
      '🎭 Спор года в гостиной',
      '⚡ Битва титанов',
    ];

    const stories = [
      `${heroA.name} считает, что субботний вечер без «${activityA}» прожит зря. Но ${heroB.name} решительно возражает и предлагает «${activityB}». Кто уступит или объединит форматы?`,
      `${heroA.name} уже забронировал локацию под «${activityA}», в то время как ${heroB.name} принёс оборудование для «${activityB}». Гости в предвкушении дебатов!`,
      `В комнате разгорелась дискуссия: ${heroA.name} цитирует «${heroA.quote}», требуя «${activityA}». Сможет ли ${heroB.name} защитить «${activityB}»?`,
    ];

    this.activeClash.set({
      heroA,
      heroB,
      activityA,
      activityB,
      compatibilityPercent: compat,
      verdict: verdicts[Math.floor(Math.random() * verdicts.length)],
      storySnippet: stories[Math.floor(Math.random() * stories.length)],
    });
  }

  getSectorSvgPath(index: number, total: number): string {
    const angle = (2 * Math.PI) / total;
    const startAngle = index * angle - Math.PI / 2;
    const endAngle = (index + 1) * angle - Math.PI / 2;
    const cx = 100;
    const cy = 100;
    const r = 98;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);

    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
  }

  getSectorTextTransform(index: number, total: number): string {
    const step = 360 / total;
    const rotation = index * step + step / 2;
    return `translate(100, 100) rotate(${rotation})`;
  }
}
