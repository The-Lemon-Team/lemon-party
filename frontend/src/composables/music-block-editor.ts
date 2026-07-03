import type { InjectionKey } from 'vue';
import type { MusicDisplay, ContentTypeId } from '@lemon-party/blocks';

export interface MusicBlockFormPayload {
  url: string;
  videoId: string;
  title?: string;
  heading?: string;
  description?: string;
  tag: string;
  contentTypeId: ContentTypeId;
  extraTags?: string[];
  display: MusicDisplay;
}

export interface MusicBlockEditorContext {
  openEdit: (
    initial: MusicBlockFormPayload,
    onSave: (payload: MusicBlockFormPayload) => void,
  ) => void;
}

export const musicBlockEditorKey: InjectionKey<MusicBlockEditorContext> =
  Symbol('musicBlockEditor');
