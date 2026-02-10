<script setup lang="ts">
import { ref, onMounted } from 'vue';

const props = defineProps<{
  show: boolean;
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}>();

const emit = defineEmits(['close']);

const isMounted = ref(false);
onMounted(() => {
  isMounted.value = true;
});

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl'
};
</script>

<template>
  <Teleport to="body" v-if="isMounted">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="show" class="fixed inset-0 z-100 flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-secondary/60 backdrop-blur-sm""></div>
        
        <!-- Modal Content -->
        <div 
          :class="[sizes[size || 'md'], 'w-full bg-white rounded-3xl shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden translate-z-0']"
          class="animate-in fade-in zoom-in duration-300"
        >
          <!-- Header -->
          <div class="px-8 py-6 border-b border-secondary/5 flex items-center justify-between shrink-0">
            <h3 class="text-2xl font-black">{{ title }}</h3>
            <button 
              @click="emit('close')"
              class="w-10 h-10 flex items-center justify-center rounded-xl bg-accent/50 text-secondary hover:bg-secondary hover:text-white transition-all cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          
          <!-- Body -->
          <div class="p-8 overflow-y-auto custom-scrollbar">
            <slot />
          </div>
          
          <!-- Footer (Optional) -->
          <div v-if="$slots.footer" class="px-8 py-6 border-t border-secondary/5 bg-accent/5 shrink-0">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}
</style>
