import {
  ArenaActorCard,
  ArenaDeckAnalytics,
  ArenaDesireCard,
  ArenaDesireThread,
  ArenaParadoxField,
  ArenaVoiceEntry,
  CombineActivitySuggestion,
  CombineHistoryCard,
  CombineTimeField,
  NeuralTrainingSample,
} from '../models/flow.models';

export interface ArenaStateStore {
  actors: ArenaActorCard[];
  leadActorId: string;
  desireCards: ArenaDesireCard[];
  paradoxes: ArenaParadoxField[];
  activeParadoxId: string;
  threads: ArenaDesireThread[];
  voices: ArenaVoiceEntry[];
  combineTimeFields: CombineTimeField[];
  activeCombineFieldId: string;
  combineSuggestions: CombineActivitySuggestion[];
  combineHistoryCards: CombineHistoryCard[];
}

export function createEmptyArenaStore(): ArenaStateStore {
  return {
    actors: [
      {
        id: 'actor-alexey',
        handle: 'alexey_bathrobe',
        flowId: 'flow-actor-alexey',
        name: 'Алексей (в халате)',
        title: 'Архитектор Уюта & Неформальный Лидер',
        avatarIcon: 'alexey',
        accentColor: 'rose',
        category: 'HUMAN',
        categoryLabel: 'Человек · Вечерний Релакс',
        rankLabel: 'Голос Поля',
        quote: 'Код подождёт, а горячая пицца и хороший фильм стынут!',
        paradoxPhilosophy: 'Баланс труда и качественного отдыха превыше дедлайнов.',
        favoriteDesire: 'Выпить пива и посмотреть фильм',
        affinities: ['пицца', 'кино', 'отдых'],
        traits: { charisma: 95, analytical: 80, rebelVersus: 65 },
        voicePitch: 1.0,
        voiceRate: 1.0,
        sampleVoices: {
          support: 'Идеальное совмещение — стою у плиты и смотрю полезный стрим!',
          counter: 'Зачем спорить, когда можно совместить приятное с полезным?',
          paradox: 'Ребята, после спринта нужен душевный вечер!',
        },
        isLead: true,
        voicesCount: 12,
      },
      {
        id: 'actor-baron',
        handle: 'baron_hedonist',
        flowId: 'flow-actor-baron',
        name: 'Баррон из острова сокровищ',
        title: 'Гедонист & Гурман Гастрономии',
        avatarIcon: 'baron',
        accentColor: 'amber',
        category: 'MYTHIC',
        categoryLabel: 'Персонаж · Гастрономия',
        rankLabel: 'Ветеран Вкуса',
        quote: 'Хороший вечер строится вокруг правильного вкуса и крафтового напитка!',
        paradoxPhilosophy: 'Наслаждение жизнью здесь и сейчас.',
        favoriteDesire: 'Крафтовый эль и сочный стейк',
        affinities: ['крафт', 'кухня', 'веселье'],
        traits: { charisma: 90, analytical: 75, rebelVersus: 85 },
        voicePitch: 0.9,
        voiceRate: 0.95,
        sampleVoices: {
          support: 'Бокал холодного эля сделает любое дело вдвое приятнее!',
          counter: 'Вода и чай? Оставьте это для понедельника!',
          paradox: 'Никаких скучных компромиссов — только праздник вкуса!',
        },
        isLead: false,
        voicesCount: 8,
      },
      {
        id: 'actor-professor',
        handle: 'professor_reason',
        flowId: 'flow-actor-professor',
        name: 'Профессор Разум',
        title: 'Аналитик Времени & AI-Теоретик',
        avatarIcon: 'professor',
        accentColor: 'cyan',
        category: 'SAGE',
        categoryLabel: 'AI · Аналитика',
        rankLabel: 'Стратег',
        quote: 'Слоты времени нужно оптимизировать: подкаст во время рутины удваивает ценность.',
        paradoxPhilosophy: 'Синергия и рациональное распределение ресурсов.',
        favoriteDesire: 'Слушать познавательный подкаст',
        affinities: ['аналитика', 'подкасты', 'тайм-менеджмент'],
        traits: { charisma: 70, analytical: 98, rebelVersus: 40 },
        voicePitch: 1.1,
        voiceRate: 1.05,
        sampleVoices: {
          support: 'Аналитика подтверждает: аудиоформат идеально ложится на ручной труд.',
          counter: 'Бесцельный просмотр ленты снижает нейропластичность.',
          paradox: 'Давайте взвесим факты и выберем рациональный сценарий.',
        },
        isLead: false,
        voicesCount: 15,
      },
      {
        id: 'actor-ginny',
        handle: 'ginny_spark',
        flowId: 'flow-actor-ginny',
        name: 'Джинни',
        title: 'Любительница Overwatch & Искренний Друг',
        avatarIcon: 'ginny',
        accentColor: 'emerald',
        category: 'HUMAN',
        categoryLabel: 'Человек · Уют & Игры',
        rankLabel: 'Душа Компании',
        quote: 'Overwatch с друзьями и хорошая беседа — лучший пятничный вечер!',
        paradoxPhilosophy: 'Искренность, командная поддержка и яркие катки.',
        favoriteDesire: 'Сыграть в Overwatch',
        affinities: ['overwatch', 'игры', 'друзья', 'вечер'],
        traits: { charisma: 92, analytical: 78, rebelVersus: 70 },
        voicePitch: 1.15,
        voiceRate: 1.05,
        sampleVoices: {
          support: 'Включаем Overwatch, берём саппорта и забираем победу!',
          counter: 'Скучный вечер в одиночестве? Только не сегодня, когда пати в сборе!',
          paradox: 'После хорошей катки и суп вкуснее, и настроение на высоте.',
        },
        isLead: false,
        voicesCount: 9,
      },
      {
        id: 'actor-neurobi',
        handle: 'neurobi_inner',
        flowId: 'flow-actor-neurobi',
        name: 'Нейроби',
        title: 'Внутренний Мир Главного Персонажа',
        avatarIcon: 'neurobi',
        accentColor: 'violet',
        category: 'SAGE',
        categoryLabel: 'AI · Эмоциональный Разум',
        rankLabel: 'Внутренний Голос',
        quote: 'Я отражаю внутренний мир Алексея: тепло, уют, горячий суп и гармонию мыслей.',
        paradoxPhilosophy: 'Баланс сознания, кулинарная медитация и ментальный дзен.',
        favoriteDesire: 'Приготовить Суп и Выпить пива',
        affinities: ['суп', 'дзен', 'мысли', 'уют'],
        traits: { charisma: 88, analytical: 94, rebelVersus: 50 },
        voicePitch: 0.95,
        voiceRate: 0.9,
        sampleVoices: {
          support: 'Ароматный горячий суп восстанавливает нейроны лучше любых алгоритмов.',
          counter: 'Спешка только разрушает вкусовой и ментальный баланс.',
          paradox: 'Когда внутренний мир спокоен, любая задача решается легко.',
        },
        isLead: false,
        voicesCount: 11,
      },
      {
        id: 'actor-hades',
        handle: 'hades_underworld',
        flowId: 'flow-actor-hades',
        name: 'Аид',
        title: 'Повелитель Загробного Царства & Мастер Огня',
        avatarIcon: 'hades',
        accentColor: 'cyan',
        category: 'MYTHIC',
        categoryLabel: 'Миф · Подземное Пламя',
        rankLabel: 'Владыка',
        quote: 'Даже в подземном царстве уважают наваристый суп. Добавим адского огонька!',
        paradoxPhilosophy: 'Глубина, стойкость и контроль над стихией огня.',
        favoriteDesire: 'Готовка супа на жарком пламени',
        affinities: ['огонь', 'суп', 'вечер', 'пати'],
        traits: { charisma: 88, analytical: 85, rebelVersus: 92 },
        voicePitch: 0.85,
        voiceRate: 0.95,
        sampleVoices: {
          support: 'Настоящий суп требует огненной выдержки и царских ингредиентов!',
          counter: 'Холодные перекусы оставьте теням, на кухне должен быть жар.',
          paradox: 'Готовить суп в пати — истинное искусство даже для владыки.',
        },
        isLead: false,
        voicesCount: 7,
      },
      {
        id: 'actor-nick',
        handle: 'nick_shadow',
        flowId: 'flow-actor-nick',
        name: 'Ник',
        title: 'Теневой Протагонист & Снайпер Overwatch',
        avatarIcon: 'nick',
        accentColor: 'rose',
        category: 'HUMAN',
        categoryLabel: 'Антагонист · Киберспорт',
        rankLabel: 'Снайпер',
        quote: 'В Overwatch важна точность каждого шота. А после катки — холодное пиво.',
        paradoxPhilosophy: 'Победа любой ценой, но с проверенной командой.',
        favoriteDesire: 'Пиво + Овервотч',
        affinities: ['overwatch', 'пиво', 'снайпер', 'пати'],
        traits: { charisma: 85, analytical: 90, rebelVersus: 88 },
        voicePitch: 0.95,
        voiceRate: 1.05,
        sampleVoices: {
          support: 'Пиво открыто, дискорд подключен — заходим в соревновательный Overwatch!',
          counter: 'Отложить катку ради рутины? Ни за что!',
          paradox: 'Джинни на саппортах, я на острие — идеальный состав на вечер.',
        },
        isLead: false,
        voicesCount: 8,
      },
      {
        id: 'actor-starleader',
        handle: 'starleader',
        flowId: 'flow-actor-starleader',
        name: 'ТимЛид Старлидер',
        title: 'Технический Лидер & Архитектор Lemon Seasons',
        avatarIcon: 'starleader',
        accentColor: 'amber',
        category: 'SAGE',
        categoryLabel: 'Архитектура · Lemon Seasons',
        rankLabel: 'ТимЛид',
        quote: 'Каждый спринт Lemon Seasons приближает нас к идеальному продукту. Запускаем коддинг сессию!',
        paradoxPhilosophy: 'Чистый код, строгая модульность и вдохновляющий дизайн сезонов.',
        favoriteDesire: 'Коддинг Сессия Lemon Seasons',
        affinities: ['lemon seasons', 'коддинг', 'архитектура', 'лидерство'],
        traits: { charisma: 94, analytical: 96, rebelVersus: 75 },
        voicePitch: 1.05,
        voiceRate: 1.02,
        sampleVoices: {
          support: 'Архитектура Lemon Seasons выдержит любые нагрузки! Собираем фичи в прод.',
          counter: 'Перед деплоем сезонов проверяем типизацию и тесты до последнего коммита.',
          paradox: 'Сезон Lemon Party должен стать легендарным: соединяем бэкенд и яркий UI.',
        },
        isLead: false,
        voicesCount: 14,
      },
      {
        id: 'actor-lemon-coder',
        handle: 'lemon_dev',
        flowId: 'flow-actor-lemon-coder',
        name: 'Программист (Lemon Team)',
        title: 'Fullstack Инженер & Кодер Lemon Party',
        avatarIcon: 'lemon-coder',
        accentColor: 'cyan',
        category: 'HUMAN',
        categoryLabel: 'Разработка · Lemon Team',
        rankLabel: 'Сеньор Разработчик',
        quote: 'Пока ТимЛид проектирует Lemon Seasons, я уже рефакторю сторы и пишу стримы.',
        paradoxPhilosophy: 'Меньше багов — больше релизов. Коддинг под хорошую музыку.',
        favoriteDesire: 'Коддинг Сессия Lemon Seasons',
        affinities: ['коддинг', 'lemon seasons', 'angular', 'фичи'],
        traits: { charisma: 82, analytical: 95, rebelVersus: 70 },
        voicePitch: 1.0,
        voiceRate: 1.05,
        sampleVoices: {
          support: 'Все таймлайны и карточки Lemon Seasons протестированы, пушим в мейн!',
          counter: 'Давайте не усложнять стейт-менеджмент, реактивные сигналы решают всё.',
          paradox: 'Коддинг сессия в самом разгаре, кофе налит — Lemon Seasons оживает на глазах!',
        },
        isLead: false,
        voicesCount: 10,
      },
      {
        id: 'actor-zeus',
        handle: 'zeus_thunder',
        flowId: 'flow-actor-zeus',
        name: 'Зевс',
        title: 'Владыка Олимпа & Повелитель Молний',
        avatarIcon: 'zeus',
        accentColor: 'amber',
        category: 'MYTHIC',
        categoryLabel: 'Миф · Олимп',
        rankLabel: 'Громовержец',
        quote: 'Когда гремит гром — партия собирается на великие свершения! Олимп с нами.',
        paradoxPhilosophy: 'Сила небес, решительность и царственное спокойствие.',
        favoriteDesire: 'Громогласный праздник победы',
        affinities: ['молния', 'олимп', 'пати', 'победа'],
        traits: { charisma: 97, analytical: 88, rebelVersus: 80 },
        voicePitch: 0.9,
        voiceRate: 1.0,
        sampleVoices: {
          support: 'Молния рассекает сомнения — действуем сообща!',
          counter: 'Нерешительность недостойна олимпийцев.',
          paradox: 'Даже боги признают силу крепкой дружбы и хорошего супа.',
        },
        isLead: false,
        voicesCount: 9,
      },
      {
        id: 'actor-poseidon',
        handle: 'poseidon_ocean',
        flowId: 'flow-actor-poseidon',
        name: 'Посейдон',
        title: 'Повелитель Океанических Глубин & Штормов',
        avatarIcon: 'hades',
        accentColor: 'cyan',
        category: 'MYTHIC',
        categoryLabel: 'Миф · Океан',
        rankLabel: 'Владыка Морей',
        quote: 'Волны шепчут о великом шторме. В пати с Зевсом и Аидом мы неостановимы.',
        paradoxPhilosophy: 'Неукротимая стихия, глубина мысли и морская сплочённость.',
        favoriteDesire: 'Океанический бриз и морские легенды',
        affinities: ['океан', 'шторм', 'пати', 'глубина'],
        traits: { charisma: 93, analytical: 84, rebelVersus: 85 },
        voicePitch: 0.88,
        voiceRate: 0.98,
        sampleVoices: {
          support: 'Океан поддерживает это решение всей мощью прилива!',
          counter: 'Не поднимайте шторм в стакане воды.',
          paradox: 'Стихия воды очищает разум для ясных тактик.',
        },
        isLead: false,
        voicesCount: 7,
      },
      {
        id: 'actor-alisa',
        handle: 'alisa_quantum',
        flowId: 'flow-actor-alisa',
        name: 'Алиса',
        title: 'Квантовый Исследователь & Стратег',
        avatarIcon: 'alisa',
        accentColor: 'violet',
        category: 'HUMAN',
        categoryLabel: 'Наука · Квантовые Сети',
        rankLabel: 'Аналитик',
        quote: 'Квантовая запутанность наших мыслей доказывает: в пати мы сильнее в разы.',
        paradoxPhilosophy: 'Логика, изящество гипотез и квантовая синергия.',
        favoriteDesire: 'Анализ квантовых парадоксов',
        affinities: ['квант', 'стратегия', 'пати', 'анализ'],
        traits: { charisma: 89, analytical: 99, rebelVersus: 65 },
        voicePitch: 1.1,
        voiceRate: 1.05,
        sampleVoices: {
          support: 'Квантовые вероятности сходятся к успеху нашей команды!',
          counter: 'Этот сценарий содержит критические сингулярности.',
          paradox: 'Мысль одного героя резонирует во всём пространстве партии.',
        },
        isLead: false,
        voicesCount: 8,
      },
      {
        id: 'actor-akin',
        handle: 'akin_guardian',
        flowId: 'flow-actor-akin',
        name: 'Акин',
        title: 'Страж Нейронных Потоков & Хранитель Баланса',
        avatarIcon: 'akin',
        accentColor: 'emerald',
        category: 'SAGE',
        categoryLabel: 'Защита · Нейросети',
        rankLabel: 'Страж',
        quote: 'Баланс нейронной арены непоколебим, пока мы держим строй.',
        paradoxPhilosophy: 'Надёжность, защита слабых и непоколебимая выдержка.',
        favoriteDesire: 'Медитация на страже потоков',
        affinities: ['защита', 'баланс', 'пати', 'стойкость'],
        traits: { charisma: 86, analytical: 92, rebelVersus: 45 },
        voicePitch: 0.95,
        voiceRate: 0.98,
        sampleVoices: {
          support: 'Щиты подняты, тыл прикрыт — двигаемся вперёд!',
          counter: 'Опасно разделяться, когда враг на горизонте.',
          paradox: 'Истинный страж защищает не только поле, но и мысли союзников.',
        },
        isLead: false,
        voicesCount: 6,
      },
    ],
    leadActorId: 'actor-alexey',
    desireCards: [
      {
        id: 'card-drink-beer',
        flowId: 'flow-card-drink-beer',
        title: 'Выпить пива',
        category: 'Бар & Неформальный Релакс',
        description: 'Пойти командой в крафтовый паб после работы, обсудить спринт и поднять бокалы.',
        icon: 'sports_bar',
        colorTheme: 'amber',
        tags: ['#пиво', '#бар', '#пятница'],
        createdByActorName: 'Баррон из острова сокровищ',
        gamesPlayed: 5,
        winsCount: 2,
        lossesCount: 3,
        winRatePercent: 40,
        totalHistoricalVotes: 16,
        analyticsInsight: 'Популярная карточка для завершения рабочей недели.',
        isInCurrentField: true,
        matchHistory: [],
      },
      {
        id: 'card-lemon-seasons',
        flowId: 'flow-card-lemon-seasons',
        title: 'Lemon Seasons — Коддинг Сессия',
        category: 'Разработка & Lemon Seasons',
        description: 'ТимЛид Старлидер и Программист Lemon Team проектируют архитектуру и наполнение нового сезона.',
        icon: 'terminal',
        colorTheme: 'amber',
        tags: ['#lemon_seasons', '#коддинг', '#тимлид', '#архитектура'],
        createdByActorName: 'ТимЛид Старлидер',
        gamesPlayed: 4,
        winsCount: 4,
        lossesCount: 0,
        winRatePercent: 100,
        totalHistoricalVotes: 28,
        analyticsInsight: 'Абсолютный хит спринта: объединяет всю команду вокруг релиза сезонов!',
        isInCurrentField: true,
        matchHistory: [],
      },
      {
        id: 'card-overwatch-beer',
        flowId: 'flow-card-overwatch-beer',
        title: 'Пиво + Овервотч',
        category: 'Игры & Киберспорт',
        description: 'Джинни и Ник объединяются в Overwatch под бокал крафтового пива.',
        icon: 'sports_esports',
        colorTheme: 'emerald',
        tags: ['#overwatch', '#пиво', '#джинни', '#ник'],
        createdByActorName: 'Джинни',
        gamesPlayed: 6,
        winsCount: 5,
        lossesCount: 1,
        winRatePercent: 83,
        totalHistoricalVotes: 26,
        analyticsInsight: 'Идеальное комбо для пятничного вечера: командный соревновательный драйв и релакс.',
        isInCurrentField: true,
        matchHistory: [],
      },
      {
        id: 'card-cook-soup-hades',
        flowId: 'flow-card-cook-soup-hades',
        title: 'Готовка супа в пати с Аидом',
        category: 'Кулинария & Внутренний Баланс',
        description: 'Нейроби готовит наваристый суп вместе с Аидом — огонь стихии и кулинарный дзен.',
        icon: 'soup_kitchen',
        colorTheme: 'violet',
        tags: ['#суп', '#нейроби', '#аид', '#дзен'],
        createdByActorName: 'Нейроби',
        gamesPlayed: 5,
        winsCount: 4,
        lossesCount: 1,
        winRatePercent: 80,
        totalHistoricalVotes: 22,
        analyticsInsight: 'Секретный рецепт восстановления сил: суп на жарком огне Аида возвращает 100% энергии.',
        isInCurrentField: true,
        matchHistory: [],
      },
      {
        id: 'card-watch-movie',
        flowId: 'flow-card-watch-movie',
        title: 'Посмотреть кино',
        category: 'Уют & Киномарафон',
        description: 'Собраться перед большим экраном, заказать пиццу и посмотреть культовое кино.',
        icon: 'movie',
        colorTheme: 'violet',
        tags: ['#кино', '#уют', '#фильм'],
        createdByActorName: 'Алексей (в халате)',
        gamesPlayed: 5,
        winsCount: 4,
        lossesCount: 1,
        winRatePercent: 80,
        totalHistoricalVotes: 24,
        analyticsInsight: 'Лидер колоды по победам в домашних форматах.',
        isInCurrentField: true,
        matchHistory: [],
      },
    ],
    paradoxes: [
      {
        id: 'paradox-friday-afterwork',
        folderPath: 'party/paradox/friday',
        title: 'Пятничный вечер: Крафтовый Паб vs Киномарафон в пледах',
        occasionTag: 'Пятница 20:00',
        contextStory: 'Команда закрыла сложный релиз и выбирает формат вечера.',
        paradoxQuestion: 'Как лучше провести вечер: шумная барная встреча или уютное кино дома?',
        status: 'ACTIVE_BATTLE',
        periodLabel: 'Раунд 1',
      },
    ],
    activeParadoxId: 'paradox-friday-afterwork',
    threads: [
      {
        id: 'thread-beer',
        flowId: 'flow-thread-beer',
        paradoxId: 'paradox-friday-afterwork',
        title: 'Выпить пива',
        subtitle: 'Крафтовый паб с закусками',
        icon: 'sports_bar',
        colorTheme: 'amber',
        proposerActorId: 'actor-baron',
        proposerName: 'Баррон из острова сокровищ',
        proposerIcon: 'baron',
        supporterActorIds: ['actor-baron'],
        supporters: [
          {
            id: 'actor-baron',
            name: 'Баррон из острова сокровищ',
            title: 'Гедонист',
            icon: 'baron',
            accentColor: 'amber',
          },
        ],
        votesCount: 3,
        sharePercent: 37,
        isLeading: false,
        tags: ['#пиво', '#бар'],
        voices: [],
        createdAt: new Date().toISOString(),
      },
      {
        id: 'thread-movie',
        flowId: 'flow-thread-movie',
        paradoxId: 'paradox-friday-afterwork',
        title: 'Посмотреть кино',
        subtitle: 'Уютный киномарафон в пледах',
        icon: 'movie',
        colorTheme: 'violet',
        proposerActorId: 'actor-alexey',
        proposerName: 'Алексей (в халате)',
        proposerIcon: 'alexey',
        supporterActorIds: ['actor-alexey', 'actor-professor'],
        supporters: [
          {
            id: 'actor-alexey',
            name: 'Алексей (в халате)',
            title: 'Архитектор Уюта',
            icon: 'alexey',
            accentColor: 'rose',
          },
          {
            id: 'actor-professor',
            name: 'Профессор Разум',
            title: 'Аналитик',
            icon: 'professor',
            accentColor: 'cyan',
          },
        ],
        votesCount: 5,
        sharePercent: 63,
        isLeading: true,
        tags: ['#кино', '#уют'],
        voices: [],
        createdAt: new Date().toISOString(),
      },
    ],
    voices: [
      {
        id: 'voice-init-1',
        actorId: 'actor-alexey',
        actorName: 'Алексей (в халате)',
        actorTitle: 'Архитектор Уюта',
        actorIcon: 'alexey',
        actorAccent: 'rose',
        paradoxId: 'paradox-friday-afterwork',
        threadId: 'thread-movie',
        threadTitle: 'Посмотреть кино',
        intent: 'PARADOX_OPINION',
        sourceMode: 'AUDIO_VOICE',
        durationSec: 4,
        text: 'После напряженной недели лучший отдых — уютное кино и пицца прямо дома!',
        activeNeuronSessions: ['session-friday'],
        createdAt: new Date().toISOString(),
      },
    ],
    combineTimeFields: [
      {
        id: 'timefield-cooking-evening',
        folderPath: 'party/combine/cooking',
        title: 'Вечерняя готовка ужина',
        baseActivity: 'Готовка ужина',
        baseIcon: 'soup_kitchen',
        durationLabel: '19:30 – 20:45 · 1ч 15м',
        contextDescription: 'Вечернее приготовление еды на кухне под музыку или видео.',
        status: 'ACTIVE_COMBINE',
      },
      {
        id: 'timefield-cleaning-saturday',
        folderPath: 'party/combine/cleaning',
        title: 'Субботняя уборка',
        baseActivity: 'Уборка гостиной',
        baseIcon: 'cleaning_services',
        durationLabel: '11:00 – 12:30 · 1ч 30м',
        contextDescription: 'Наведение порядка, раскладывание вещей и мытье полов.',
        status: 'ACTIVE_COMBINE',
      },
    ],
    activeCombineFieldId: 'timefield-cooking-evening',
    combineSuggestions: [
      {
        id: 'csug-youtube-cooking',
        timeFieldId: 'timefield-cooking-evening',
        title: 'Смотреть YouTube',
        subtitle: 'Пока жарится ужин, включить подкаст или обзор на планшете',
        icon: 'smart_display',
        colorTheme: 'rose',
        actorId: 'actor-alexey',
        actorName: 'Алексей (в халате)',
        actorTitle: 'Архитектор Уюта',
        actorIcon: 'alexey',
        actorAccent: 'rose',
        pitchVoice: 'Включаю ролик прямо у плиты — время летит незаметно!',
        isPinned: true,
        outcome: 'HIT',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'csug-neurobi-soup-hades',
        timeFieldId: 'timefield-cooking-evening',
        title: 'Готовка супа в пати с Аидом',
        subtitle: '20:30, 21:30 — Нейроби и Аид варят фирменный наваристый суп под адским огоньком',
        icon: 'soup_kitchen',
        colorTheme: 'violet',
        actorId: 'actor-neurobi',
        actorName: 'Нейроби',
        actorTitle: 'Внутренний Мир',
        actorIcon: 'neurobi',
        actorAccent: 'violet',
        pitchVoice: 'Суп гармонизирует ментальный баланс и согревает душу!',
        isPinned: true,
        outcome: 'HIT',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'csug-overwatch-beer-ginny',
        timeFieldId: 'timefield-cooking-evening',
        title: 'Пиво + Овервотч',
        subtitle: '22:02 — Джинни и Ник берут саппорта и штурмовика под крафтовое пиво',
        icon: 'sports_esports',
        colorTheme: 'emerald',
        actorId: 'actor-ginny',
        actorName: 'Джинни',
        actorTitle: 'Любительница Overwatch',
        actorIcon: 'ginny',
        actorAccent: 'emerald',
        pitchVoice: 'Катка в пати с Ником и холодное пиво — лучший финал вечера!',
        isPinned: true,
        outcome: 'HIT',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'csug-starleader-lemon-seasons',
        timeFieldId: 'timefield-cooking-evening',
        title: 'Коддинг Сессия Lemon Seasons',
        subtitle: '22:02 — ТимЛид Старлидер и Программист Lemon Team наполняют Lemon Seasons',
        icon: 'terminal',
        colorTheme: 'amber',
        actorId: 'actor-starleader',
        actorName: 'ТимЛид Старлидер',
        actorTitle: 'Технический Лидер',
        actorIcon: 'starleader',
        actorAccent: 'amber',
        pitchVoice: 'Архитектура Lemon Seasons должна сиять! Пушим фичи в мейн.',
        isPinned: true,
        outcome: 'HIT',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'csug-beer-cooking',
        timeFieldId: 'timefield-cooking-evening',
        title: 'Выпить пива',
        subtitle: 'Бокал холодного эля идеально задает пятничный темп на кухне',
        icon: 'sports_bar',
        colorTheme: 'amber',
        actorId: 'actor-baron',
        actorName: 'Баррон из острова сокровищ',
        actorTitle: 'Гедонист & Гурман',
        actorIcon: 'baron',
        actorAccent: 'amber',
        pitchVoice: 'Крафтовый напиток делает любое кулинарное шоу праздником!',
        isPinned: true,
        outcome: 'HIT',
        createdAt: new Date().toISOString(),
      },
    ],
    combineHistoryCards: [],
  };
}

export function computeCardDerivedStats(
  card: ArenaDesireCard,
  allCardsMap: Map<string, string>,
  activeFieldCardIds: Set<string>,
): ArenaDesireCard {
  const history = card.matchHistory ?? [];
  const gamesPlayed = history.length;
  const winsCount = history.filter((m) => m.outcome === 'WON').length;
  const lossesCount = gamesPlayed - winsCount;
  const winRatePercent = gamesPlayed > 0 ? Math.round((winsCount / gamesPlayed) * 100) : 0;
  const totalHistoricalVotes = history.reduce((acc, m) => acc + m.votesReceived, 0);

  const lossToWinnerCounts = new Map<string, { title: string; count: number }>();
  for (const m of history) {
    if (m.outcome === 'LOST' && m.winnerCardId && m.winnerCardId !== card.id) {
      const winnerTitle = allCardsMap.get(m.winnerCardId) ?? m.winnerCardTitle;
      const cur = lossToWinnerCounts.get(m.winnerCardId) ?? { title: winnerTitle, count: 0 };
      cur.count += 1;
      lossToWinnerCounts.set(m.winnerCardId, cur);
    }
  }

  let nemesisCardTitle: string | null = null;
  let nemesisScore: string | null = null;
  let topLossCount = 0;

  for (const [, val] of lossToWinnerCounts.entries()) {
    if (val.count > topLossCount) {
      topLossCount = val.count;
      nemesisCardTitle = val.title;
    }
  }

  if (nemesisCardTitle && topLossCount > 0) {
    nemesisScore = `Уступала карточке «${nemesisCardTitle}» в ${topLossCount} из ${lossesCount} поражений`;
  }

  let analyticsInsight = '';
  if (gamesPlayed === 0) {
    analyticsInsight = 'Новая карточка желания в колоде — ещё не участвовала в завершённых периодах.';
  } else if (nemesisCardTitle && topLossCount >= 2 && winsCount < lossesCount) {
    analyticsInsight = `Участвовала в ${gamesPlayed} играх (${winsCount} побед, ${lossesCount} пораж.), всегда ярко стартует, но в очных спорах чаще выигрывало «${nemesisCardTitle}» (${topLossCount} раз)!`;
  } else if (winRatePercent >= 65) {
    analyticsInsight = `Фаворит команды (${winsCount} побед в ${gamesPlayed} играх, ${winRatePercent}% WR). Чаще других перетягивает голоса во второй половине периода!`;
  } else {
    analyticsInsight = `Стабильный участник Versus-битв: ${gamesPlayed} игр, ${winsCount} побед (${winRatePercent}% WR), собрала суммарно ${totalHistoricalVotes} голосов поддержки.`;
  }

  return {
    ...card,
    gamesPlayed,
    winsCount,
    lossesCount,
    winRatePercent,
    totalHistoricalVotes,
    nemesisCardTitle,
    nemesisScore,
    analyticsInsight,
    isInCurrentField: activeFieldCardIds.has(card.id),
  };
}

export function computeDeckAnalytics(cards: ArenaDesireCard[]): ArenaDeckAnalytics {
  const sortedByWins = [...cards].sort(
    (a, b) => b.winsCount - a.winsCount || b.winRatePercent - a.winRatePercent,
  );
  const sortedByGames = [...cards].sort((a, b) => b.gamesPlayed - a.gamesPlayed);
  const topWinnerCard = sortedByWins[0] ?? null;
  const mostPlayedCard = sortedByGames[0] ?? null;

  const beerCard = cards.find((c) => c.id === 'card-drink-beer' || c.title.toLowerCase().includes('пив'));
  const movieCard = cards.find((c) => c.id === 'card-watch-movie' || c.title.toLowerCase().includes('кино'));

  let headlineConclusion = '';
  if (beerCard && movieCard) {
    headlineConclusion = `Карточка «${beerCard.title}» участвовала в ${beerCard.gamesPlayed} играх (${beerCard.winsCount} побед, ${beerCard.lossesCount} пораж.) и чаще других зажигает спор, однако в итоге чаще выигрывало «${movieCard.title}» (${movieCard.winsCount} побед из ${movieCard.gamesPlayed}, винрейт ${movieCard.winRatePercent}%)!`;
  } else if (topWinnerCard && mostPlayedCard) {
    headlineConclusion = `Самая частая карточка в спорах — «${mostPlayedCard.title}» (${mostPlayedCard.gamesPlayed} игр), а максимальный процент побед удерживает «${topWinnerCard.title}» (${topWinnerCard.winRatePercent}% WR).`;
  }

  const rivalryInsights = cards
    .filter((c) => c.gamesPlayed > 0)
    .map((c) => `«${c.title}»: ${c.analyticsInsight}`);

  return {
    totalGamesAnalyzed: Math.max(...cards.map((c) => c.gamesPlayed), 0),
    topWinnerCard,
    mostPlayedCard,
    headlineConclusion,
    rivalryInsights,
  };
}

export function enrichActiveThreads(
  state: ArenaStateStore,
  actors: ArenaActorCard[],
  paradox: ArenaParadoxField | undefined,
  desireCards: ArenaDesireCard[],
): ArenaDesireThread[] {
  if (!paradox) return [];
  const rawThreads = state.threads.filter((t) => t.paradoxId === paradox.id);
  const totalVotes = rawThreads.reduce((acc, t) => acc + t.supporterActorIds.length, 0);
  const maxVotes = rawThreads.reduce((max, t) => Math.max(max, t.supporterActorIds.length), 0);
  const actorMap = new Map(actors.map((a) => [a.id, a]));
  const cardMap = new Map(desireCards.map((c) => [c.id, c]));

  return rawThreads
    .map((t) => {
      const supporters = t.supporterActorIds
        .map((id) => actorMap.get(id))
        .filter((a): a is ArenaActorCard => !!a)
        .map((a) => ({
          id: a.id,
          name: a.name,
          title: a.title,
          icon: a.avatarIcon,
          accentColor: a.accentColor,
        }));
      const votesCount = supporters.length;
      const sharePercent = totalVotes > 0 ? Math.round((votesCount / totalVotes) * 100) : 0;
      const threadVoices = state.voices
        .filter((v) => v.paradoxId === paradox.id && v.threadId === t.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      const linkedCard = t.desireCardId ? cardMap.get(t.desireCardId) : undefined;

      return {
        ...t,
        supporters,
        votesCount,
        sharePercent,
        isLeading: votesCount > 0 && votesCount === maxVotes,
        isWinner: paradox.resolvedSummary?.winnerThreadId === t.id,
        voices: threadVoices,
        cardStats: linkedCard
          ? {
              gamesPlayed: linkedCard.gamesPlayed,
              winsCount: linkedCard.winsCount,
              winRatePercent: linkedCard.winRatePercent,
              nemesisCardTitle: linkedCard.nemesisCardTitle,
              analyticsInsight: linkedCard.analyticsInsight,
            }
          : undefined,
      };
    })
    .sort((a, b) => b.votesCount - a.votesCount || a.createdAt.localeCompare(b.createdAt));
}

export function buildTrainingSamples(
  state: ArenaStateStore,
  actors: ArenaActorCard[],
): NeuralTrainingSample[] {
  const actorMap = new Map(actors.map((a) => [a.id, a]));
  const paradoxMap = new Map(state.paradoxes.map((p) => [p.id, p]));

  return state.voices
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((v) => {
      const actor = actorMap.get(v.actorId);
      const paradox = paradoxMap.get(v.paradoxId);
      const competingDesires = state.threads
        .filter((t) => t.paradoxId === v.paradoxId)
        .map((t) => `${t.title} (${t.supporterActorIds.length})`);

      return {
        id: `sample-${v.id}`,
        timestamp: v.createdAt,
        actorHandle: actor?.handle ?? 'unknown_actor',
        actorName: v.actorName,
        actorCategory: actor?.category ?? 'HUMAN',
        neuronPath: paradox?.folderPath ?? 'arena.friday_sync',
        activeSessionSnapshot: v.activeNeuronSessions,
        stimulusParadox: paradox?.paradoxQuestion ?? '',
        competingDesires,
        intent: v.intent,
        chosenThread: v.threadTitle ?? null,
        voiceOutput: v.text,
        sourceMode: v.sourceMode,
      };
    });
}
