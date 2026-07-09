<script setup lang="ts">
import { watch, onUnmounted } from 'vue';

const props = withDefaults(
  defineProps<{
    open: boolean;
    teleport?: boolean;
    teleportTo?: string;
    modalClass?: string;
    dialogClass?: string;
    backdropClass?: string;
    hasBackdrop?: boolean;
    clickOutsideToClose?: boolean;
    ariaLabelledby?: string;
    role?: string;
  }>(),
  {
    teleport: true,
    teleportTo: 'body',
    modalClass: 'base-modal',
    dialogClass: 'base-modal__dialog',
    backdropClass: 'base-modal__backdrop',
    hasBackdrop: true,
    clickOutsideToClose: true,
    role: 'dialog',
  },
);

const emit = defineEmits<{
  close: [];
}>();

function close() {
  emit('close');
}

function handleBackdropClick() {
  if (props.clickOutsideToClose) {
    close();
  }
}

function onEscapeKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return;
  event.preventDefault();
  close();
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      document.addEventListener('keydown', onEscapeKeydown, true);
    } else {
      document.removeEventListener('keydown', onEscapeKeydown, true);
    }
  },
  { immediate: true },
);

onUnmounted(() => {
  document.removeEventListener('keydown', onEscapeKeydown, true);
});
</script>

<template>
  <Teleport v-if="teleport" :to="teleportTo">
    <div v-if="open" :class="modalClass" @click.self="handleBackdropClick">
      <div
        v-if="hasBackdrop"
        :class="backdropClass"
        @click="handleBackdropClick"
      />
      <section
        :class="dialogClass"
        :role="role"
        aria-modal="true"
        :aria-labelledby="ariaLabelledby"
      >
        <slot />
      </section>
    </div>
  </Teleport>
  <div v-else-if="open" :class="modalClass" @click.self="handleBackdropClick">
    <div
      v-if="hasBackdrop"
      :class="backdropClass"
      @click="handleBackdropClick"
    />
    <section
      :class="dialogClass"
      :role="role"
      aria-modal="true"
      :aria-labelledby="ariaLabelledby"
    >
      <slot />
    </section>
  </div>
</template>
