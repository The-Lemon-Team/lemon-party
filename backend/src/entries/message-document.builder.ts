import {
  parseRawTextToDocument,
  type MessageDocument,
} from '@lemon-party/blocks';

function isMessageDocument(value: unknown): value is MessageDocument {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as MessageDocument;
  return candidate.version === 1 && Array.isArray(candidate.blocks);
}

export function buildMessageDocument(rawText: string): MessageDocument {
  return parseRawTextToDocument(rawText);
}

export function resolveMessageContent(
  rawText: string,
  content?: Record<string, unknown>,
): MessageDocument {
  if (isMessageDocument(content)) {
    return content;
  }
  return buildMessageDocument(rawText);
}
