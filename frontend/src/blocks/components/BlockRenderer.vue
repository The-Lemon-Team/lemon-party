<script setup lang="ts">
import type { ContentBlock } from '@lemon-party/blocks';
import BlockGallery from './BlockGallery.vue';
import BlockImage from './BlockImage.vue';
import BlockLink from './BlockLink.vue';
import BlockMusic from './BlockMusic.vue';
import BlockSection from './BlockSection.vue';
import BlockText from './BlockText.vue';
import BlockYoutube from './BlockYoutube.vue';

defineProps<{
  blocks: ContentBlock[];
  compact?: boolean;
}>();
</script>

<template>
  <div class="block-renderer">
    <template v-for="(block, index) in blocks" :key="index">
      <BlockText
        v-if="block.type === 'text'"
        :text="block.text"
        :entities="block.entities"
      />
      <BlockLink
        v-else-if="block.type === 'link'"
        :url="block.url"
        :label="block.label"
      />
      <BlockImage
        v-else-if="block.type === 'image'"
        :url="block.url"
        :alt="block.alt"
      />
      <BlockYoutube
        v-else-if="block.type === 'youtube'"
        :url="block.url"
        :video-id="block.videoId"
        :title="block.title"
      />
      <BlockMusic
        v-else-if="block.type === 'music'"
        :url="block.url"
        :video-id="block.videoId"
        :title="block.title"
        :heading="block.heading"
        :description="block.description"
        :tag="block.tag"
        :extra-tags="block.extraTags"
        :display="block.display"
        :size="compact ? 'compact' : 'default'"
      />
      <BlockGallery
        v-else-if="block.type === 'gallery'"
        :images="block.images"
      />
      <BlockSection
        v-else-if="block.type === 'section'"
        :tag="block.tag"
        :tag-color="block.tagColor"
        :children="block.children"
        :compact="compact"
      />
    </template>
  </div>
</template>
