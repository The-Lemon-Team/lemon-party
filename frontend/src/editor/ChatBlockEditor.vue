<script setup lang="ts">
import { EditorContent, useEditor } from '@tiptap/vue-3';
import { onBeforeUnmount, watch } from 'vue';
import {
  documentToRawText,
  emptyDocument,
  isDocumentEmpty,
  messageDocumentToTiptap,
  tiptapToMessageDocument,
  type ContentTypeId,
  type GalleryImage,
  type MessageDocument,
  type MusicDisplay,
} from '@lemon-party/blocks';
import { createChatEditorExtensions } from './extensions';

const props = defineProps<{
  disabled?: boolean;
}>();

const editor = useEditor({
  extensions: createChatEditorExtensions(),
  content: messageDocumentToTiptap(emptyDocument()),
  editable: !props.disabled,
  editorProps: {
    attributes: {
      class: 'chat-block-editor__prose',
    },
  },
});

watch(
  () => props.disabled,
  (disabled) => {
    editor.value?.setEditable(!disabled);
  },
);

onBeforeUnmount(() => {
  editor.value?.destroy();
});

function getDocument(): MessageDocument {
  if (!editor.value) return emptyDocument();
  return tiptapToMessageDocument(editor.value.getJSON());
}

function getRawText(): string {
  return documentToRawText(getDocument());
}

function isEmpty(): boolean {
  return isDocumentEmpty(getDocument());
}

function clear() {
  editor.value?.commands.setContent(messageDocumentToTiptap(emptyDocument()));
}

function insertMusicBlock(options: {
  tag?: string;
  contentTypeId?: ContentTypeId;
  extraTags?: string[];
  url: string;
  videoId: string;
  title?: string;
  heading?: string;
  description?: string;
  display: MusicDisplay;
}) {
  editor.value
    ?.chain()
    .focus('end')
    .insertContent({
      type: 'musicBlock',
      attrs: {
        url: options.url,
        videoId: options.videoId,
        title: options.title ?? null,
        heading: options.heading ?? null,
        description: options.description ?? null,
        tag: options.tag ?? 'Музыка',
        contentTypeId: options.contentTypeId ?? 'music',
        extraTags: options.extraTags?.length ? options.extraTags : [],
        display: options.display,
      },
    })
    .run();
}

function insertGallery(images: GalleryImage[]) {
  if (images.length === 0) return;
  editor.value
    ?.chain()
    .focus('end')
    .insertContent({
      type: 'galleryBlock',
      attrs: { images },
    })
    .run();
}

function insertImages(urls: string[]) {
  if (urls.length === 0) return;
  if (urls.length === 1) {
    editor.value
      ?.chain()
      .focus('end')
      .insertContent({
        type: 'imageBlock',
        attrs: { url: urls[0], alt: null },
      })
      .run();
    return;
  }
  insertGallery(urls.map((url) => ({ url })));
}

function insertLinkSection(options: {
  note?: string;
  url: string;
  contentTypeId?: ContentTypeId;
}) {
  const nodes: Record<string, unknown>[] = [];

  if (options.note?.trim()) {
    nodes.push({
      type: 'paragraph',
      content: [{ type: 'text', text: options.note.trim() }],
    });
  }

  nodes.push({
    type: 'linkBlock',
    attrs: {
      url: options.url,
      label: options.url,
      contentTypeId: options.contentTypeId ?? null,
    },
  });

  editor.value?.chain().focus('end').insertContent(nodes).run();
}

defineExpose({
  getDocument,
  getRawText,
  isEmpty,
  clear,
  insertMusicBlock,
  insertGallery,
  insertImages,
  insertLinkSection,
});
</script>

<template>
  <EditorContent :editor="editor" class="chat-block-editor" />
</template>
