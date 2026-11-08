import { CloudDayNote } from '../models/flow.models';

export const SEED_HERO_CLOUD_NOTES: Record<string, CloudDayNote[]> = {
  "2026-11-06": [
    {
      "id": "note-today-alexey-morning-chill",
      "dateKey": "2026-11-06",
      "time": "09:00",
      "timeMinutes": 540,
      "type": "thought",
      "actorId": "actor-alexey",
      "actorName": "Алексей (в халате)",
      "actorAvatar": "alexey",
      "actorAccent": "rose",
      "actorTitle": "Архитектор Уюта & Неформальный Лидер",
      "text": "Утренний китайский чай пуэр и свежий воздух. Настраиваем баланс чилла и продуктивности в штабе.",
      "supporters": [
        "actor-alexey",
        "actor-solomon",
        "actor-fairy-home"
      ],
      "votesCount": 6,
      "moodEmoji": "🍵",
      "createdAt": "2026-11-06T09:00:00Z",
      "visibility": "PUBLIC",
      "isPinnedToHero": true,
      "isPinnedToCloud": true,
      "authorProfileName": "Командный Хаб",
      "partyActorIds": [
        "actor-alexey",
        "actor-solomon"
      ],
      "partyActorNames": [
        "Алексей",
        "Царь Соломон"
      ],
      "subActorId": "actor-solomon",
      "subActorName": "Царь Соломон",
      "subActorAvatar": "solomon",
      "subActorAccent": "amber",
      "likedByActors": [
        {
          "actorId": "actor-alexey",
          "actorName": "Алексей",
          "avatarIcon": "alexey",
          "moodEmoji": "🍵"
        },
        {
          "actorId": "actor-solomon",
          "actorName": "Царь Соломон",
          "avatarIcon": "solomon",
          "moodEmoji": "👑"
        },
        {
          "actorId": "actor-fairy-home",
          "actorName": "Домашняя Фея",
          "avatarIcon": "fairy",
          "moodEmoji": "✨"
        }
      ],
      "floatingTilt": -0.5,
      "floatingDelay": 0.5
    },
    {
      "id": "note-today-zeus-thunder-challenge",
      "dateKey": "2026-11-06",
      "time": "10:00",
      "timeMinutes": 600,
      "type": "action",
      "actorId": "actor-zeus",
      "actorName": "Зевс",
      "actorAvatar": "zeus",
      "actorAccent": "amber",
      "actorTitle": "Громовержец & Лидер",
      "text": "Запускаем сезонный Громовой Турнир на Арене! Собираем команды на парные стратегические схватки.",
      "supporters": [
        "actor-zeus",
        "actor-hades",
        "actor-poseidon",
        "actor-solomon"
      ],
      "votesCount": 9,
      "moodEmoji": "⚡",
      "createdAt": "2026-11-06T10:00:00Z",
      "visibility": "PUBLIC",
      "isPinnedToHero": true,
      "isPinnedToCloud": true,
      "authorProfileName": "Командный Хаб",
      "partyActorIds": [
        "actor-zeus",
        "actor-hades"
      ],
      "partyActorNames": [
        "Зевс",
        "Аид"
      ],
      "likedByActors": [
        {
          "actorId": "actor-zeus",
          "actorName": "Зевс",
          "avatarIcon": "zeus",
          "moodEmoji": "⚡"
        },
        {
          "actorId": "actor-hades",
          "actorName": "Аид",
          "avatarIcon": "hades",
          "moodEmoji": "🔥"
        },
        {
          "actorId": "actor-alexey",
          "actorName": "Алексей",
          "avatarIcon": "alexey",
          "moodEmoji": "👍"
        }
      ],
      "floatingTilt": -0.6,
      "floatingDelay": 0.7
    },
    {
      "id": "note-today-hades-infernal-soup-reply",
      "dateKey": "2026-11-06",
      "time": "10:15",
      "timeMinutes": 615,
      "type": "proposal",
      "actorId": "actor-hades",
      "actorName": "Аид",
      "actorAvatar": "hades",
      "actorAccent": "indigo",
      "actorTitle": "Владыка Подземного Пламени",
      "replyToNoteId": "note-today-zeus-thunder-challenge",
      "replyToAuthorName": "Зевс",
      "replyToTextSnippet": "Запускаем сезонный Громовой Турнир на Арене...",
      "text": "Принимаю вызов на Громовом Турнире! Подготовил колоду огненных парадоксов и десерты с чили.",
      "supporters": [
        "actor-hades",
        "actor-zeus"
      ],
      "votesCount": 5,
      "moodEmoji": "🔥",
      "createdAt": "2026-11-06T10:15:00Z",
      "visibility": "PUBLIC",
      "isPinnedToHero": true,
      "isPinnedToCloud": true,
      "authorProfileName": "Командный Хаб",
      "partyActorIds": [
        "actor-hades",
        "actor-zeus"
      ],
      "partyActorNames": [
        "Аид",
        "Зевс"
      ],
      "likedByActors": [
        {
          "actorId": "actor-hades",
          "actorName": "Аид",
          "avatarIcon": "hades",
          "moodEmoji": "🔥"
        },
        {
          "actorId": "actor-zeus",
          "actorName": "Зевс",
          "avatarIcon": "zeus",
          "moodEmoji": "⚡"
        }
      ],
      "floatingTilt": 0.8,
      "floatingDelay": 1.1
    },
    {
      "id": "note-today-chef-culinary-masterclass",
      "dateKey": "2026-11-06",
      "time": "12:00",
      "timeMinutes": 720,
      "type": "action",
      "actorId": "actor-ratatouille",
      "actorName": "Рататуй",
      "actorAvatar": "ratatouille",
      "actorAccent": "amber",
      "actorTitle": "Шеф Вкусовых Парадоксов",
      "text": "Совместный кулинарный мастер-класс с Пекарем Круассаном! Печём фокаччу с розмарином и вялеными томатами.",
      "supporters": [
        "actor-ratatouille",
        "actor-baker-croissant",
        "actor-alexey"
      ],
      "votesCount": 8,
      "moodEmoji": "🍕",
      "createdAt": "2026-11-06T12:00:00Z",
      "visibility": "PUBLIC",
      "isPinnedToHero": true,
      "isPinnedToCloud": true,
      "authorProfileName": "Командный Хаб",
      "partyActorIds": [
        "actor-ratatouille",
        "actor-baker-croissant"
      ],
      "partyActorNames": [
        "Рататуй",
        "Пекарь Круассан"
      ],
      "subActorId": "actor-baker-croissant",
      "subActorName": "Пекарь Круассан",
      "subActorAvatar": "baker",
      "subActorAccent": "amber",
      "likedByActors": [
        {
          "actorId": "actor-ratatouille",
          "actorName": "Рататуй",
          "avatarIcon": "ratatouille",
          "moodEmoji": "🧀"
        },
        {
          "actorId": "actor-baker-croissant",
          "actorName": "Пекарь Круассан",
          "avatarIcon": "baker",
          "moodEmoji": "🥐"
        },
        {
          "actorId": "actor-alexey",
          "actorName": "Алексей",
          "avatarIcon": "alexey",
          "moodEmoji": "😋"
        }
      ],
      "floatingTilt": 0.5,
      "floatingDelay": 1.4
    },
    {
      "id": "note-today-baker-reply-focaccia",
      "dateKey": "2026-11-06",
      "time": "12:15",
      "timeMinutes": 735,
      "type": "thought",
      "actorId": "actor-baker-croissant",
      "actorName": "Пекарь Круассан",
      "actorAvatar": "baker",
      "actorAccent": "amber",
      "actorTitle": "Мастер Выпечки",
      "replyToNoteId": "note-today-chef-culinary-masterclass",
      "replyToAuthorName": "Рататуй",
      "replyToTextSnippet": "Совместный кулинарный мастер-класс с Пекарем...",
      "text": "Тесто подошло идеально! Добавим немного чесночного масла для золотистой корочки.",
      "supporters": [
        "actor-baker-croissant",
        "actor-ratatouille"
      ],
      "votesCount": 4,
      "moodEmoji": "🥐",
      "createdAt": "2026-11-06T12:15:00Z",
      "visibility": "PUBLIC",
      "isPinnedToHero": false,
      "isPinnedToCloud": true,
      "authorProfileName": "Командный Хаб",
      "partyActorIds": [
        "actor-baker-croissant",
        "actor-ratatouille"
      ],
      "partyActorNames": [
        "Пекарь Круассан",
        "Рататуй"
      ],
      "likedByActors": [
        {
          "actorId": "actor-baker-croissant",
          "actorName": "Пекарь Круассан",
          "avatarIcon": "baker",
          "moodEmoji": "🥐"
        },
        {
          "actorId": "actor-ratatouille",
          "actorName": "Рататуй",
          "avatarIcon": "ratatouille",
          "moodEmoji": "🧀"
        }
      ],
      "floatingTilt": -0.4,
      "floatingDelay": 1.8
    },
    {
      "id": "note-today-ninja-speedrun",
      "dateKey": "2026-11-06",
      "time": "14:30",
      "timeMinutes": 870,
      "type": "action",
      "actorId": "actor-cyber-ninja",
      "actorName": "Кибер Ниндзя",
      "actorAvatar": "ninja",
      "actorAccent": "emerald",
      "actorTitle": "Спидраннер",
      "text": "Спидран ретро-аркады закрыт за 11 минут! Новый рекорд зафиксирован на доске почета Арены.",
      "supporters": [
        "actor-dj-pixel",
        "actor-misha"
      ],
      "votesCount": 6,
      "moodEmoji": "🕹️",
      "createdAt": "2026-11-06T14:30:00Z",
      "visibility": "PUBLIC",
      "isPinnedToHero": true,
      "isPinnedToCloud": true,
      "authorProfileName": "Командный Хаб",
      "partyActorIds": [
        "actor-cyber-ninja",
        "actor-dj-pixel"
      ],
      "partyActorNames": [
        "Кибер Ниндзя",
        "Диджей Пиксель"
      ],
      "likedByActors": [
        {
          "actorId": "actor-cyber-ninja",
          "actorName": "Кибер Ниндзя",
          "avatarIcon": "ninja",
          "moodEmoji": "🕹️"
        },
        {
          "actorId": "actor-dj-pixel",
          "actorName": "Диджей Пиксель",
          "avatarIcon": "pixel",
          "moodEmoji": "🎧"
        }
      ],
      "floatingTilt": 0.9,
      "floatingDelay": 0.4
    },
    {
      "id": "note-today-gm-alexey-quantum-key",
      "dateKey": "2026-11-06",
      "time": "18:00",
      "timeMinutes": 1080,
      "type": "thought",
      "actorId": "actor-alexey",
      "actorName": "Алексей (в халате)",
      "actorAvatar": "alexey",
      "actorAccent": "rose",
      "actorTitle": "Архитектор Уюта & Неформальный Лидер",
      "text": "Архаичный лор мастера: В подкладке махрового халата зашит квантовый ключ от нулевого ядра Арены. Алексей помнит всё до великой перезагрузки.",
      "supporters": [
        "actor-alexey",
        "actor-solomon"
      ],
      "votesCount": 7,
      "moodEmoji": "📜",
      "createdAt": "2026-11-06T18:00:00Z",
      "visibility": "GM_ONLY",
      "isPinnedToHero": true,
      "isPinnedToCloud": false,
      "authorProfileName": "Мастер Арены (GM)",
      "partyActorIds": [
        "actor-alexey"
      ],
      "partyActorNames": [
        "Алексей"
      ],
      "likedByActors": [
        {
          "actorId": "actor-alexey",
          "actorName": "Алексей",
          "avatarIcon": "alexey",
          "moodEmoji": "🧠"
        },
        {
          "actorId": "actor-solomon",
          "actorName": "Царь Соломон",
          "avatarIcon": "solomon",
          "moodEmoji": "👑"
        }
      ],
      "floatingTilt": -1.1,
      "floatingDelay": 2.1
    },
    {
      "id": "note-today-dj-pixel-chill-stream",
      "dateKey": "2026-11-06",
      "time": "20:00",
      "timeMinutes": 1200,
      "type": "action",
      "actorId": "actor-dj-pixel",
      "actorName": "Диджей Пиксель",
      "actorAvatar": "pixel",
      "actorAccent": "cyan",
      "actorTitle": "Саунд-дизайнер Арены",
      "text": "Запустил вечерний сет чилл-хопа и синтвейва на общих аудио-каналах Арены. Полная гармония!",
      "supporters": [
        "actor-dj-pixel",
        "actor-cyber-ninja",
        "actor-fairy-home"
      ],
      "votesCount": 7,
      "moodEmoji": "🎧",
      "createdAt": "2026-11-06T20:00:00Z",
      "visibility": "PUBLIC",
      "isPinnedToHero": true,
      "isPinnedToCloud": true,
      "authorProfileName": "Командный Хаб",
      "partyActorIds": [
        "actor-dj-pixel",
        "actor-cyber-ninja"
      ],
      "partyActorNames": [
        "Диджей Пиксель",
        "Кибер Ниндзя"
      ],
      "likedByActors": [
        {
          "actorId": "actor-dj-pixel",
          "actorName": "Диджей Пиксель",
          "avatarIcon": "pixel",
          "moodEmoji": "🎧"
        },
        {
          "actorId": "actor-alexey",
          "actorName": "Алексей",
          "avatarIcon": "alexey",
          "moodEmoji": "👍"
        }
      ],
      "floatingTilt": 0.6,
      "floatingDelay": 1.2
    }
  ],
  "2026-11-05": [
    {
      "id": "note-yest-1",
      "dateKey": "2026-11-05",
      "time": "09:00",
      "timeMinutes": 540,
      "type": "thought",
      "actorId": "actor-misha",
      "actorName": "Миша (Студент)",
      "actorAvatar": "misha",
      "actorAccent": "cyan",
      "actorTitle": "Любитель Настолок",
      "text": "Вчерашний шторм идей показал, что мы готовы к новому турниру по Манчкину!",
      "supporters": [
        "actor-solomon"
      ],
      "votesCount": 2,
      "moodEmoji": "💡",
      "createdAt": "2026-11-05T09:00:00Z",
      "visibility": "PUBLIC",
      "isPinnedToHero": true,
      "isPinnedToCloud": false,
      "authorProfileName": "Командный Хаб"
    },
    {
      "id": "note-yest-2",
      "dateKey": "2026-11-05",
      "time": "16:30",
      "timeMinutes": 990,
      "type": "proposal",
      "actorId": "actor-ratatouille",
      "actorName": "Рататуй",
      "actorAvatar": "ratatouille",
      "actorAccent": "amber",
      "actorTitle": "Шеф Вкусовых Парадоксов",
      "text": "Провели дегустацию десертов с сыром. Теперь это наш фирменный перекус.",
      "supporters": [
        "actor-baker-croissant",
        "actor-alexey"
      ],
      "votesCount": 3,
      "moodEmoji": "🧀",
      "createdAt": "2026-11-05T16:30:00Z",
      "visibility": "PUBLIC",
      "isPinnedToHero": false,
      "isPinnedToCloud": false,
      "authorProfileName": "Командный Хаб"
    },
    {
      "id": "note-yest-3",
      "dateKey": "2026-11-05",
      "time": "20:15",
      "timeMinutes": 1215,
      "type": "action",
      "actorId": "actor-cyber-ninja",
      "actorName": "Кибер Ниндзя",
      "actorAvatar": "ninja",
      "actorAccent": "emerald",
      "actorTitle": "Спидраннер",
      "text": "Спидран аркады закрыт за 14 минут без единой потери жизней!",
      "supporters": [
        "actor-dj-pixel"
      ],
      "votesCount": 2,
      "moodEmoji": "🕹️",
      "createdAt": "2026-11-05T20:15:00Z",
      "visibility": "PUBLIC",
      "isPinnedToHero": true,
      "isPinnedToCloud": false,
      "authorProfileName": "Командный Хаб"
    }
  ],
  "2026-11-07": [
    {
      "id": "note-tom-1",
      "dateKey": "2026-11-07",
      "time": "11:00",
      "timeMinutes": 660,
      "type": "proposal",
      "actorId": "actor-major-falcon",
      "actorName": "Майор Сокол",
      "actorAvatar": "falcon",
      "actorAccent": "amber",
      "actorTitle": "Инструктор Дисциплины",
      "text": "Субботнее предложение: утренний марш-бросок в парк и кофе на свежем воздухе.",
      "supporters": [
        "actor-kapitan-zaryad"
      ],
      "votesCount": 2,
      "moodEmoji": "🌲",
      "createdAt": "2026-11-07T11:00:00Z",
      "visibility": "PUBLIC",
      "isPinnedToHero": false,
      "isPinnedToCloud": false,
      "authorProfileName": "Командный Хаб"
    },
    {
      "id": "note-tom-2",
      "dateKey": "2026-11-07",
      "time": "15:30",
      "timeMinutes": 930,
      "type": "thought",
      "actorId": "actor-fairy-home",
      "actorName": "Домашняя Фея",
      "actorAvatar": "fairy",
      "actorAccent": "rose",
      "actorTitle": "Фея Уюта",
      "text": "Завтра планирую испечь тыквенный пирог с корицей для всей компании.",
      "supporters": [
        "actor-alexey",
        "actor-baker-croissant"
      ],
      "votesCount": 3,
      "moodEmoji": "🥧",
      "createdAt": "2026-11-07T15:30:00Z",
      "visibility": "PUBLIC",
      "isPinnedToHero": true,
      "isPinnedToCloud": false,
      "authorProfileName": "Командный Хаб"
    },
    {
      "id": "note-tom-3",
      "dateKey": "2026-11-07",
      "time": "20:00",
      "timeMinutes": 1200,
      "type": "proposal",
      "actorId": "actor-baker-croissant",
      "actorName": "Пекарь Круассан",
      "actorAvatar": "baker",
      "actorAccent": "amber",
      "actorTitle": "Мастер Выпечки",
      "text": "Киноночь субботы: смотрим космическую фантастику под свежую выпечку.",
      "supporters": [
        "actor-solomon",
        "actor-misha"
      ],
      "votesCount": 2,
      "moodEmoji": "🍿",
      "createdAt": "2026-11-07T20:00:00Z",
      "visibility": "PUBLIC",
      "isPinnedToHero": false,
      "isPinnedToCloud": false,
      "authorProfileName": "Командный Хаб"
    }
  ]
};
