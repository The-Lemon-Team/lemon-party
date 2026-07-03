import { serializeYoutubeMarker } from '@lemon-party/blocks';
import type { ContentTemplate } from '@/constants/content-templates';

export interface TemplateFormData {
  url: string;
  title: string;
  note: string;
}

export function buildMessageFromTemplate(
  template: ContentTemplate,
  data: TemplateFormData,
): string {
  const lines: string[] = [];

  if (data.note.trim()) {
    lines.push(data.note.trim());
  }

  if (template.form === 'youtube') {
    const marker = serializeYoutubeMarker(data.url, data.title || undefined);
    lines.push(marker);
  } else if (data.url.trim()) {
    lines.push(data.url.trim());
  }

  return lines.join('\n');
}
