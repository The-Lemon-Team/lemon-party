import { Injectable } from '@nestjs/common';
import {
  collectHashtagsFromDocument,
  extractHashtagsFromText,
  isDocumentEmpty,
  isMessageDocument,
  parseHashtagList,
} from '@lemon-party/blocks';
import { TagsService } from '../tags/tags.service';

export interface ParsedEntry {
  content: string;
  tagId: string;
}

@Injectable()
export class EntryParserService {
  constructor(private readonly tagsService: TagsService) {}

  /** Индексирует только хештеги (#vibe) — не парсит секции и списки. */
  async parseForUser(
    userId: string,
    rawText: string,
    content?: Record<string, unknown>,
  ): Promise<ParsedEntry[]> {
    const hashtagNames = new Map<string, string>();

    function rememberHashtag(name: string) {
      const key = name.toLowerCase();
      if (!hashtagNames.has(key)) {
        hashtagNames.set(key, name);
      }
    }

    for (const line of rawText.split(/\r?\n/)) {
      const trimmed = line.trim();
      const tagsLineMatch = trimmed.match(/^tags:\s*(.+)$/i);
      if (tagsLineMatch) {
        for (const name of parseHashtagList(tagsLineMatch[1])) {
          rememberHashtag(name);
        }
      }
    }

    for (const name of extractHashtagsFromText(rawText)) {
      rememberHashtag(name);
    }

    if (isMessageDocument(content)) {
      for (const name of collectHashtagsFromDocument(content)) {
        rememberHashtag(name);
      }
    }

    const resolved: ParsedEntry[] = [];
    for (const name of hashtagNames.values()) {
      const tag = await this.tagsService.findOrCreateByHeader(userId, name);
      if (!tag) continue;
      resolved.push({ content: `#${name}`, tagId: tag.id });
    }

    return resolved;
  }

  hasMessageBody(rawText: string, content?: Record<string, unknown>) {
    if (isMessageDocument(content) && !isDocumentEmpty(content)) {
      return true;
    }

    const trimmed = rawText.trim();
    if (!trimmed) return false;

    const withoutMeta = trimmed
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !/^tags:\s*.+/i.test(line))
      .join('\n')
      .trim();

    return Boolean(withoutMeta);
  }
}
