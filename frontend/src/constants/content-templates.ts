export type ContentTemplateForm = 'youtube' | 'link';

import type { ContentTypeId } from '@lemon-party/blocks';

export type { ContentTypeId };

export interface ContentTemplate {
  id: string;
  chipLabel: string;
  contentTypeId: ContentTypeId;
  color: string;
  form: ContentTemplateForm;
  title: string;
  hint: string;
  urlPlaceholder: string;
}

export function formatTemplateTagLabel(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return 'Музыка';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export function templateForMusicTag(tag: string): ContentTemplate {
  const normalized = tag.trim().toLowerCase();
  const found = CONTENT_TEMPLATES.find(
    (t) =>
      formatTemplateTagLabel(t.chipLabel).toLowerCase() === normalized ||
      t.chipLabel.toLowerCase() === normalized,
  );
  return found ?? CONTENT_TEMPLATES[0];
}

export const CONTENT_TEMPLATES: ContentTemplate[] = [
  {
    id: 'music-youtube',
    chipLabel: 'музыка',
    contentTypeId: 'music',
    color: '#7c3aed',
    form: 'youtube',
    title: 'Музыка с YouTube',
    hint: 'Вставьте ссылку на трек или плейлист с YouTube — в чате появится превью.',
    urlPlaceholder: 'https://www.youtube.com/watch?v=…',
  },
  {
    id: 'lofi',
    chipLabel: 'lo-fi',
    contentTypeId: 'lofi',
    color: '#2563eb',
    form: 'youtube',
    title: 'Lo-fi с YouTube',
    hint: 'Плейлист или видео с YouTube для фона.',
    urlPlaceholder: 'https://www.youtube.com/watch?v=…',
  },
  {
    id: 'design',
    chipLabel: 'дизайн',
    contentTypeId: 'design',
    color: '#2563eb',
    form: 'link',
    title: 'Дизайн-референс',
    hint: 'Ссылка на статью, Behance, Pinterest или другой источник.',
    urlPlaceholder: 'https://…',
  },
];
