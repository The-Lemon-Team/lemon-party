# @lemon-party/blocks

JSON-документ сообщения: блоки и inline-entities в стиле Telegram / Notion.

## MessageDocument

```json
{
  "version": 1,
  "blocks": [
    {
      "type": "section",
      "tag": "музыка",
      "children": [
        { "type": "text", "text": "Jazz-hop", "entities": [] },
        { "type": "youtube", "url": "…", "videoId": "…", "title": "…" }
      ]
    }
  ]
}
```

## Блоки

- `text` — текст с опциональными `entities` (url, bold, …)
- `link` — карточка ссылки
- `image` — изображение
- `youtube` — embed-превью
- `section` — группа с тегом

Vue-рендерер: `frontend/src/blocks/`.
