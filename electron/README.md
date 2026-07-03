# Lemon Party Desktop

Electron-клиент с Telegram-подобным сайдбаром.

## Разработка (рекомендуется)

**Не нужно собирать `.exe` на каждую правку.** Electron в dev-режиме открывает Vite на `http://localhost:5173` — работает HMR, как в браузере.

Из корня репозитория:

```bash
npm install
npm run desktop
```

Скрипт поднимает:

1. **backend** — API на `:3000`
2. **frontend** — Vite dev server (`dev:desktop`) на `:5173`
3. **Electron** — окно на `http://localhost:5173/chats/general`

Пересборка нужна только при изменении `electron/src/*` (main, preload) — `tsc -w` делает это автоматически.

### Без backend

Только UI + Electron (если API не нужен):

```bash
npm run desktop:shell
```

### По частям (три терминала)

```bash
npm run dev:backend
npm run dev:frontend:desktop
npm run dev:electron   # после первого npm run build --prefix electron
```

Первый запуск Electron: `npm run build --prefix electron`, дальше — `npm run dev:electron`.

### Preview shell в браузере (без Electron)

```bash
npm run dev:frontend:desktop
```

Откройте `http://localhost:5173` — тот же desktop UI, API через Vite proxy.

## Production-сборка (.exe)

**Backend запускается отдельно** — в `.env.electron` зашит `VITE_API_BASE=http://localhost:3000`.

```bash
# 1. Backend должен быть доступен
npm run dev:backend

# 2. Сборка установщика
cd electron
npm install
npm run dist
```

Артефакты в `electron/release/`:

- `Lemon Party Setup 0.1.0.exe` — установщик
- `win-unpacked/Lemon Party.exe` — portable без установки

### Почему .exe мог не работать

1. **Backend не запущен** — приложение обращается к `http://localhost:3000`
2. **CORS** — упакованное приложение грузится с `file://`; backend должен принимать запросы без `Origin` (исправлено в `backend/src/main.ts`)

## Переменные

| Переменная | Описание |
|------------|----------|
| `FRONTEND_URL` | URL dev-сервера для Electron (по умолчанию `http://localhost:5173`) |
| `VITE_SHELL=desktop` | Включить desktop shell в браузере (`.env.desktop`) |
| `VITE_API_BASE` | URL backend без `/api` (для electron-сборки, напр. `http://localhost:3000`) |

## Иконка

Перед первой сборкой: `electron/build/icon.png` (512×512). Скрипт: `electron/scripts/create-icon.ps1`.
