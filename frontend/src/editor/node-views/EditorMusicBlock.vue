<script setup lang="ts">
import { inject } from 'vue';
import { NodeViewWrapper } from '@tiptap/vue-3';
import type { NodeViewProps } from '@tiptap/vue-3';
import type { MusicDisplay, ContentTypeId } from '@lemon-party/blocks';
import BlockMusic from '@/blocks/components/BlockMusic.vue';
import {
  musicBlockEditorKey,
  type MusicBlockFormPayload,
} from '@/composables/music-block-editor';

const props = defineProps<NodeViewProps>();

const musicEditor = inject(musicBlockEditorKey, null);

function currentPayload(): MusicBlockFormPayload {
  return {
    url: String(props.node.attrs.url ?? ''),
    videoId: String(props.node.attrs.videoId ?? ''),
    title: props.node.attrs.title ? String(props.node.attrs.title) : undefined,
    heading: props.node.attrs.heading ? String(props.node.attrs.heading) : undefined,
    description: props.node.attrs.description ? String(props.node.attrs.description) : undefined,
    tag: props.node.attrs.tag ? String(props.node.attrs.tag) : 'Музыка',
    contentTypeId: (props.node.attrs.contentTypeId
      ? String(props.node.attrs.contentTypeId)
      : 'music') as ContentTypeId,
    extraTags: Array.isArray(props.node.attrs.extraTags)
      ? (props.node.attrs.extraTags as string[]).map(String)
      : [],
    display: (props.node.attrs.display === 'tray' ? 'tray' : 'card') as MusicDisplay,
  };
}

function openEdit() {
  if (!musicEditor) return;
  musicEditor.openEdit(currentPayload(), (updated) => {
    props.updateAttributes({
      url: updated.url,
      videoId: updated.videoId,
      title: updated.title ?? null,
      heading: updated.heading ?? null,
      description: updated.description ?? null,
      tag: updated.tag,
      contentTypeId: updated.contentTypeId,
      extraTags: updated.extraTags ?? [],
      display: updated.display,
    });
  });
}

function onDelete() {
  const confirmed = window.confirm(
    'Удалить этот блок музыки из сообщения?',
  );
  if (!confirmed) return;
  props.deleteNode();
}
</script>

<template>
  <NodeViewWrapper class="editor-node editor-node--music" data-drag-handle>
    <BlockMusic
      :url="String(props.node.attrs.url)"
      :video-id="String(props.node.attrs.videoId)"
      :title="props.node.attrs.title ? String(props.node.attrs.title) : undefined"
      :heading="props.node.attrs.heading ? String(props.node.attrs.heading) : undefined"
      :description="props.node.attrs.description ? String(props.node.attrs.description) : undefined"
      :tag="props.node.attrs.tag ? String(props.node.attrs.tag) : 'Музыка'"
      :extra-tags="
        Array.isArray(props.node.attrs.extraTags)
          ? (props.node.attrs.extraTags as string[])
          : []
      "
      :display="props.node.attrs.display === 'tray' ? 'tray' : 'card'"
      size="compact"
      editable
      @edit="openEdit"
      @delete="onDelete"
    />
  </NodeViewWrapper>
</template>
