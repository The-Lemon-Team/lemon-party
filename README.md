# Lemon Party

Личный дневник-чат для записей «Узнал», «Вспомнил» и «Сделать» с регистрацией и публичным бордом.

## Стек

- **Frontend:** Vue 3, Vue Router, Pinia, Vite, блоки + entities
- **Desktop:** Electron (Telegram-style shell)
- **Backend:** NestJS, JWT, Prisma
- **База:** PostgreSQL

## Быстрый старт

### 1. PostgreSQL

PostgreSQL слушает порт **5433** (если 5432 уже занят локальным Postgres).

```bash
docker compose up -d
```

### 2. Backend

```bash
cd backend
npm install
npx prisma migrate dev
npm run start:dev
```

API: `http://localhost:3000`

В `.env` задайте `JWT_SECRET` для production.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

UI: `http://localhost:5173`

## Возможности

- **Теги** — «Узнал», «Вспомнил», «Сделать» + свои (lo-fi, музыка, книги…)
- **Группы** (`/tags`) — управление тегами
- **Регистрация и вход** — личный дневник привязан к аккаунту
- **Чат** (`/chat`) — structured-сообщения: JSON-блоки (текст с entities, ссылки, картинки, YouTube)
- **Публичный борд** (`/`) — записи сообщества с фильтром по тегам
- **Лента, календарь, топ** — личная аналитика

Mobile-first UI по прототипам из `prototypes/`. Desktop: от 768px.

## Формат сообщения

```
Узнал:
 - Как варить суп

lo-fi:
 - Jazz-hop плейлист

Сделать:
 - Поесть
```

Неизвестный тег в заголовке создаётся автоматически.

## API

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| POST | `/auth/register` | — | Регистрация |
| POST | `/auth/login` | — | Вход |
| GET | `/auth/me` | JWT | Текущий пользователь |
| GET | `/tags` | JWT | Список тегов пользователя |
| POST | `/tags` | JWT | Создать тег |
| PATCH | `/tags/:id` | JWT | Обновить тег |
| DELETE | `/tags/:id` | JWT | Удалить тег |
| GET | `/entries/public?tagId=` | — | Публичный борд |
| POST | `/entries/messages` | JWT | Отправить сообщение |
| GET | `/entries/messages` | JWT | История сообщений |
| GET | `/entries/timeline` | JWT | Лента по дням |
| GET | `/entries/calendar?month=&year=` | JWT | Календарь |
| GET | `/entries/top?limit=10` | JWT | Топ личных записей |
| PATCH | `/entries/:id/public` | JWT | Переключить публичность |
| POST | `/uploads` | JWT | Загрузить изображение |
| POST | `/entries/:id/vote` | опц. | Голос «полезно» |

## Desktop (Electron)

Telegram-style shell: сайдбар с навигацией и папками тегов, чат как главный экран.

```bash
# всё сразу (backend + frontend + electron)
npm install
npm run desktop
```

Или по частям — см. [electron/README.md](electron/README.md).

Preview shell в браузере: `cd frontend && npm run dev:desktop`

Production-сборка: `cd electron && npm run dist`

## Блоки и entities

Как в Notion/Telegram: сообщение хранится как `rawText` (для парсера записей) и `content` (JSON-документ).

- `packages/blocks` — типы, парсер `rawText` → `MessageDocument`, entities для URL
- `frontend/src/blocks` — Vue-компоненты рендеринга

```json
{
  "version": 1,
  "blocks": [
    {
      "type": "section",
      "tag": "музыка",
      "children": [
        { "type": "text", "text": "…", "entities": [{ "type": "url", "offset": 0, "length": 20, "url": "…" }] },
        { "type": "youtube", "url": "…", "videoId": "…", "title": "…" }
      ]
    }
  ]
}
```

## Структура

```
lemon-party/
├── backend/          # NestJS API
├── frontend/         # Vue UI
├── electron/         # Desktop client
├── packages/blocks/  # блоки + entities (types, parser)
└── docker-compose.yml
```
