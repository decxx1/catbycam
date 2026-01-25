<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useStore } from '@nanostores/vue';
import { cartCount } from '@/stores/cartStore';

const count = useStore(cartCount);
const isMounted = ref(false);

onMounted(() => {
  isMounted.value = true;
});

defineEmits(['toggle-cart']);
</script>

<template>
  <button 
    @click="$emit('toggle-cart')"
    class="relative p-2 text-secondary hover:text-primary transition-colors duration-300 outline-none group"
    aria-label="Abrir carrito"
  >
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      stroke-width="2.5" 
      stroke-linecap="round" 
      stroke-linejoin="round"
      class="group-hover:scale-110 transition-transform duration-300"
    >
      <circle cx="8" cy="21" r="1"></circle>
      <circle cx="19" cy="21" r="1"></circle>
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
    </svg>
    
    <span 
      v-if="isMounted && count > 0"
      class="absolute top-0 right-0 w-5 h-5 bg-primary text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-lg shadow-primary/20 animate-in zoom-in duration-300"
    >
      {{ count }}
    </span>
  </button>
</template>
