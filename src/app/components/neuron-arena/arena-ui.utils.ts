import { ArenaAccentColor, ArenaActorCard } from '../../core/models/flow.models';

export function getAccentAvatarClasses(color: ArenaAccentColor, isHighlighted: boolean): string {
  if (isHighlighted) {
    return 'bg-primary-container text-on-primary-container border-primary';
  }
  switch (color) {
    case 'amber':
      return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30';
    case 'emerald':
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
    case 'indigo':
      return 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30';
    case 'rose':
      return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30';
    case 'violet':
      return 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30';
    case 'cyan':
      return 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30';
  }
}

export function getAccentPillClasses(color: ArenaAccentColor): string {
  switch (color) {
    case 'amber':
      return 'bg-amber-500/15 text-amber-800 dark:text-amber-200 border-amber-500/30';
    case 'emerald':
      return 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border-emerald-500/30';
    case 'indigo':
      return 'bg-indigo-500/15 text-indigo-800 dark:text-indigo-200 border-indigo-500/30';
    case 'rose':
      return 'bg-rose-500/15 text-rose-800 dark:text-rose-200 border-rose-500/30';
    case 'violet':
      return 'bg-violet-500/15 text-violet-800 dark:text-violet-200 border-violet-500/30';
    case 'cyan':
      return 'bg-cyan-500/15 text-cyan-800 dark:text-cyan-200 border-cyan-500/30';
  }
}

export function getBarBgClass(color: ArenaAccentColor): string {
  switch (color) {
    case 'amber':
      return 'bg-amber-500';
    case 'emerald':
      return 'bg-emerald-500';
    case 'indigo':
      return 'bg-indigo-500';
    case 'rose':
      return 'bg-rose-500';
    case 'violet':
      return 'bg-violet-500';
    case 'cyan':
      return 'bg-cyan-500';
  }
}

const ACTOR_ALIASES: Record<string, string[]> = {
  'actor-akin': ['акин', 'акином', 'акина', 'акину', 'акине', 'akin'],
  'actor-lemon-coder': [
    'программист',
    'lemon team',
    'lemon coder',
    'лемон тим',
    'программистом',
    'программиста',
    'кодер',
    'lemon-coder',
  ],
  'actor-alexey': ['алексей', 'алексеем', 'алексея', 'алексею', 'alexey', 'халат'],
  'actor-sarah': ['сарра', 'саррой', 'сарру', 'сарре', 'сара', 'сарой', 'sarah'],
  'actor-alisa': ['алиса', 'алисой', 'алису', 'алисе', 'alisa'],
  'actor-hades': ['аид', 'аидом', 'аида', 'аиде', 'hades'],
  'actor-ginny': ['джинни', 'гинни', 'ginny'],
  'actor-nick': ['ник', 'ником', 'ника', 'нику', 'nick'],
  'actor-zeus': ['зевс', 'зевсом', 'зевса', 'зевсу', 'zeus'],
  'actor-poseidon': ['посейдон', 'посейдоном', 'посейдона', 'poseidon'],
  'actor-baron': ['баррон', 'барон', 'барроном', 'бароном', 'baron'],
  'actor-professor': ['профессор', 'профессором', 'профессора', 'разум', 'professor'],
  'actor-neurobi': ['нейроби', 'neurobi'],
  'actor-starleader': ['старлидер', 'старлидером', 'тимлид', 'тимлидом', 'starleader'],
  'actor-misha': ['миша', 'мишей', 'мишу', 'misha'],
  'actor-ratatouille': ['рататуй', 'рататуем', 'ratatouille'],
  'actor-cyber-ninja': ['кибер ниндзя', 'ниндзя', 'ninja', 'cyber-ninja'],
  'actor-major-falcon': ['майор сокол', 'сокол', 'соколом', 'falcon'],
  'actor-fairy-home': ['домашняя фея', 'фея', 'феей', 'fairy'],
  'actor-baker-croissant': ['пекарь', 'круассан', 'пекарем', 'baker'],
  'actor-dj-pixel': ['dj pixel', 'диджей', 'пиксель', 'pixel'],
  'actor-kot-rebel': ['бунтарь кот', 'кот', 'котом'],
  'actor-kapitan-zaryad': ['капитан заряд', 'заряд'],
  'actor-solomon': ['соломон', 'соломоном'],
  'actor-billionaire': [
    'миллиардер',
    'миллиардера',
    'миллиардеру',
    'миллиардером',
    'миллиардере',
    'миллиардеров',
    'billionaire',
  ],
  'actor-jung': [
    'юнг',
    'юнга',
    'юнгом',
    'юнге',
    'юнгу',
    'карл юнг',
    'карлом юнгом',
    'карла юнга',
    'jung',
    'carl jung',
    'архетип',
    'архетипы',
    'психолог',
  ],
  'actor-jm-joint': [
    'jm joint',
    'jm',
    'джей эм джойнт',
    'джей эм',
    'джойнт',
    'джойнтом',
    'джойнта',
    'jm_joint',
    'питерский типок',
    'типок',
    'типом',
    'питерский',
    'андеграунд',
  ],
  'actor-shinigami': [
    'шинигами',
    'шинигаме',
    'шинигамием',
    'шинигамию',
    'shinigami',
    'легкая рука',
    'легкой руки',
    'легкой рукой',
    'вечный начинатель',
    'начать заново',
  ],
};

const STOP_WORDS = new Set(['из', 'для', 'под', 'над', 'тим', 'the']);
const ACTOR_TOKENS_CACHE = new Map<string, { key: string; tokens: string[] }>();

function getActorSearchTokens(actor: ArenaActorCard): string[] {
  const cacheKey = `${actor.id}:${actor.handle}:${actor.name}`;
  const cached = ACTOR_TOKENS_CACHE.get(actor.id);
  if (cached && cached.key === cacheKey) {
    return cached.tokens;
  }

  const tokens = new Set<string>(ACTOR_ALIASES[actor.id] || []);
  const handleLower = actor.handle.toLowerCase();
  tokens.add(handleLower);
  tokens.add(`@${handleLower}`);

  const nameParts = actor.name
    .toLowerCase()
    .replace(/[()]/g, '')
    .split(/\s+/)
    .filter((p) => p.length >= 3 && !STOP_WORDS.has(p));

  for (const part of nameParts) {
    tokens.add(part.length > 4 ? part.substring(0, 4) : part);
  }

  const result = Array.from(tokens);
  ACTOR_TOKENS_CACHE.set(actor.id, { key: cacheKey, tokens: result });
  return result;
}

/**
 * Автоматически распознает персонажей, упомянутых в тексте сообщения,
 * по именам, склонениям, псевдонимам (@handle) и ключевым ролям.
 */
export function detectMentionedActors(
  text: string,
  actors: ArenaActorCard[],
  excludeActorId?: string | null,
): ArenaActorCard[] {
  if (!text || !text.trim() || !actors || actors.length === 0) return [];
  const lower = text.toLowerCase();
  const matched: ArenaActorCard[] = [];

  for (const actor of actors) {
    if (excludeActorId && actor.id === excludeActorId) continue;

    const tokens = getActorSearchTokens(actor);
    for (let i = 0; i < tokens.length; i++) {
      if (lower.includes(tokens[i])) {
        matched.push(actor);
        break;
      }
    }
  }

  return matched;
}
