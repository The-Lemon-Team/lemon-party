<script setup lang="ts">
import type { GalleryImage } from '@lemon-party/blocks';

defineProps<{
  images: GalleryImage[];
}>();
</script>

<template>
  <div class="block-gallery" :class="{ 'block-gallery--single': images.length === 1 }">
    <figure v-for="(image, index) in images" :key="`${image.url}-${index}`" class="block-gallery__item">
      <img :src="image.url" :alt="image.alt || ''" loading="lazy" />
      <figcaption v-if="image.alt" class="block-gallery__caption">{{ image.alt }}</figcaption>
    </figure>
  </div>
</template>
