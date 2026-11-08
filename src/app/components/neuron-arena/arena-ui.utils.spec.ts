import { ArenaActorCard } from '../../core/models/flow.models';
import { detectMentionedActors } from './arena-ui.utils';

describe('detectMentionedActors', () => {
  const mockActors: ArenaActorCard[] = [
    {
      id: 'actor-akin',
      handle: 'akin_lead',
      flowId: 'flow-actor-akin',
      name: 'Акин',
      title: 'Лидер команды',
      avatarIcon: 'akin',
      accentColor: 'indigo',
      category: 'HUMAN',
      categoryLabel: 'Лидерство',
      rankLabel: 'Стратег',
      quote: 'Вперёд!',
      paradoxPhilosophy: 'Баланс',
      favoriteDesire: 'Кодинг',
      affinities: ['кодинг'],
      traits: { charisma: 90, analytical: 85, rebelVersus: 40 },
      voicePitch: 1.0,
      voiceRate: 1.0,
      sampleVoices: { support: 'Да!', counter: 'Нет!', paradox: 'Возможно!' },
      isLead: true,
      voicesCount: 15,
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
      categoryLabel: 'Разработка',
      rankLabel: 'Сеньор Разработчик',
      quote: 'Меньше багов',
      paradoxPhilosophy: 'Код под музыку',
      favoriteDesire: 'Коддинг Сессия',
      affinities: ['коддинг', 'angular'],
      traits: { charisma: 82, analytical: 95, rebelVersus: 70 },
      voicePitch: 1.0,
      voiceRate: 1.05,
      sampleVoices: { support: 'Готово!', counter: 'Рефакторим!', paradox: 'Реактивность!' },
      isLead: false,
      voicesCount: 10,
    },
    {
      id: 'actor-alexey',
      handle: 'alexey_bathrobe',
      flowId: 'flow-actor-alexey',
      name: 'Алексей (в халате)',
      title: 'Архитектор Уюта',
      avatarIcon: 'alexey',
      accentColor: 'rose',
      category: 'HUMAN',
      categoryLabel: 'Уют',
      rankLabel: 'Лидер',
      quote: 'Главное уют',
      paradoxPhilosophy: 'Чай и плед',
      favoriteDesire: 'Чай',
      affinities: ['уют'],
      traits: { charisma: 95, analytical: 70, rebelVersus: 30 },
      voicePitch: 1.0,
      voiceRate: 1.0,
      sampleVoices: { support: 'Отлично!', counter: 'Не спеши!', paradox: 'Уют победит!' },
      isLead: false,
      voicesCount: 12,
    },
    {
      id: 'actor-sarah',
      handle: 'sarah_streamer',
      flowId: 'flow-actor-sarah',
      name: 'Сарра',
      title: 'Стримерша Overwatch',
      avatarIcon: 'sarah',
      accentColor: 'rose',
      category: 'HUMAN',
      categoryLabel: 'Стриминг',
      rankLabel: 'Стример',
      quote: 'Го в катку!',
      paradoxPhilosophy: 'Победа в раунде',
      favoriteDesire: 'Стрим',
      affinities: ['игры', 'overwatch'],
      traits: { charisma: 90, analytical: 75, rebelVersus: 65 },
      voicePitch: 1.1,
      voiceRate: 1.1,
      sampleVoices: { support: 'Красавчики!', counter: 'Пушим точку!', paradox: 'Ульта готова!' },
      isLead: false,
      voicesCount: 8,
    },
    {
      id: 'actor-billionaire',
      handle: 'billionaire',
      flowId: 'flow-actor-billionaire',
      name: 'Миллиардер',
      title: 'Венчурный Инвестор',
      avatarIcon: 'billionaire',
      accentColor: 'emerald',
      category: 'HUMAN',
      categoryLabel: 'Инвестиции',
      rankLabel: 'Магнат',
      quote: 'Время — деньги',
      paradoxPhilosophy: 'Инвестиции в качество',
      favoriteDesire: 'Пиво + Кино',
      affinities: ['кино', 'пиво'],
      traits: { charisma: 95, analytical: 92, rebelVersus: 75 },
      voicePitch: 0.95,
      voiceRate: 1.0,
      sampleVoices: { support: 'Сделка закрыта!', counter: 'Слишком дёшево!', paradox: 'Время релакса!' },
      isLead: false,
      voicesCount: 8,
    },
    {
      id: 'actor-jung',
      handle: 'carl_jung',
      flowId: 'flow-actor-jung',
      name: 'Карл Юнг',
      title: 'Основатель Аналитической Психологии',
      avatarIcon: 'jung',
      accentColor: 'violet',
      category: 'SAGE',
      categoryLabel: 'Психология',
      rankLabel: 'Мудрец',
      quote: 'Кто смотрит внутрь — пробуждается',
      paradoxPhilosophy: 'Синтез противоположностей',
      favoriteDesire: 'Анализ архетипов',
      affinities: ['психология', 'архетипы'],
      traits: { charisma: 90, analytical: 99, rebelVersus: 60 },
      voicePitch: 0.92,
      voiceRate: 0.96,
      sampleVoices: { support: 'Синхроничность!', counter: 'Интегрируйте Тень!', paradox: 'Брак противоположностей!' },
      isLead: false,
      voicesCount: 9,
    },
    {
      id: 'actor-jm-joint',
      handle: 'jm_joint',
      flowId: 'flow-actor-jm-joint',
      name: 'JM Joint',
      title: 'Питерский Андеграунд & Поэт Крыш',
      avatarIcon: 'jm-joint',
      accentColor: 'indigo',
      category: 'HUMAN',
      categoryLabel: 'Андеграунд',
      rankLabel: 'Голос Дворов',
      quote: 'Питерские крыши и правильный бит',
      paradoxPhilosophy: 'Истина во дворах-колодцах',
      favoriteDesire: 'Чилл на питерских крышах',
      affinities: ['питер', 'андеграунд'],
      traits: { charisma: 94, analytical: 80, rebelVersus: 95 },
      voicePitch: 0.86,
      voiceRate: 0.92,
      sampleVoices: { support: 'Чёткий движ!', counter: 'Слишком попсово!', paradox: 'Держи флоу!' },
      isLead: false,
      voicesCount: 10,
    },
    {
      id: 'actor-shinigami',
      handle: 'shinigami',
      flowId: 'flow-actor-shinigami',
      name: 'Шинигами',
      title: 'Мастер Легкой Руки & Вечный Начинатель',
      avatarIcon: 'shinigami',
      accentColor: 'violet',
      category: 'MYTHIC',
      categoryLabel: 'Миф',
      rankLabel: 'Вечный Начинатель',
      quote: 'Всё начать с легкой руки!',
      paradoxPhilosophy: 'Начать заново',
      favoriteDesire: 'Всё начать с нуля',
      affinities: ['шинигами', 'легкая рука', 'старт'],
      traits: { charisma: 96, analytical: 84, rebelVersus: 94 },
      voicePitch: 0.88,
      voiceRate: 1.04,
      sampleVoices: { support: 'Запускаем!', counter: 'Начнём заново!', paradox: 'Бесконечный старт!' },
      isLead: false,
      voicesCount: 11,
    },
  ];

  it('should detect both Akin and Lemon Coder in "Кодин сессия с Акином + Программист из Lemon Team"', () => {
    const text = 'Кодин сессия с Акином + Программист из Lemon Team';
    const detected = detectMentionedActors(text, mockActors);

    const ids = detected.map((a) => a.id);
    expect(ids).toContain('actor-akin');
    expect(ids).toContain('actor-lemon-coder');
    expect(ids.length).toBe(2);
  });

  it('should detect Akin by Russian instrumental case "с Акином"', () => {
    const text = 'Обсуждаем архитектуру с Акином';
    const detected = detectMentionedActors(text, mockActors);

    expect(detected.length).toBe(1);
    expect(detected[0].id).toBe('actor-akin');
  });

  it('should detect Sarah and Alexey in "Сарра и Алексей готовят стрим"', () => {
    const text = 'Сарра и Алексей готовят стрим';
    const detected = detectMentionedActors(text, mockActors);

    const ids = detected.map((a) => a.id);
    expect(ids).toContain('actor-sarah');
    expect(ids).toContain('actor-alexey');
  });

  it('should exclude active actor id when specified', () => {
    const text = 'Кодин сессия с Акином + Программист из Lemon Team';
    const detected = detectMentionedActors(text, mockActors, 'actor-akin');

    const ids = detected.map((a) => a.id);
    expect(ids).not.toContain('actor-akin');
    expect(ids).toContain('actor-lemon-coder');
  });

  it('should detect Billionaire in "Пиво + кино с Миллиардером"', () => {
    const text = 'Пиво + кино с Миллиардером';
    const detected = detectMentionedActors(text, mockActors);

    const ids = detected.map((a) => a.id);
    expect(ids).toContain('actor-billionaire');
  });

  it('should detect Carl Jung in "Анализ архетипов вместе с Юнгом"', () => {
    const text = 'Анализ архетипов вместе с Юнгом';
    const detected = detectMentionedActors(text, mockActors);

    const ids = detected.map((a) => a.id);
    expect(ids).toContain('actor-jung');
  });

  it('should detect JM Joint in "Завариваем пуэр с JM Joint на крыше"', () => {
    const text = 'Завариваем пуэр с JM Joint на крыше';
    const detected = detectMentionedActors(text, mockActors);

    const ids = detected.map((a) => a.id);
    expect(ids).toContain('actor-jm-joint');
  });

  it('should detect Shinigami in "Шинигами с легкой руки предложил начать все заново"', () => {
    const text = 'Шинигами с легкой руки предложил начать все заново';
    const detected = detectMentionedActors(text, mockActors);

    const ids = detected.map((a) => a.id);
    expect(ids).toContain('actor-shinigami');
  });

  it('should return empty array for text with no mentions', () => {
    const text = 'Просто обычное сообщение без персонажей';
    const detected = detectMentionedActors(text, mockActors);

    expect(detected).toEqual([]);
  });
});
