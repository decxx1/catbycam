<script setup lang="ts">
import { ref, onMounted } from 'vue';
import CartIcon from './CartIcon.vue';
import CartOverlay from './CartOverlay.vue';

const isCartOpen = ref(false);
const isMounted = ref(false);

onMounted(() => {
  isMounted.value = true;
});

const toggleCart = () => {
  isCartOpen.value = !isCartOpen.value;
};
</script>

<template>
  <div class="flex items-center">
    <CartIcon @toggle-cart="toggleCart" />
    <Teleport to="body" v-if="isMounted">
      <CartOverlay :is-open="isCartOpen" @close="isCartOpen = false" />
    </Teleport>
  </div>
</template>
