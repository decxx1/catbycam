<script setup lang="ts">
interface Props {
  show: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
}

const props = withDefaults(defineProps<Props>(), {
  confirmLabel: 'Confirmar',
  cancelLabel: 'Cancelar',
  variant: 'danger'
});

const emit = defineEmits(['confirm', 'cancel']);

const handleConfirm = () => emit('confirm');
const handleCancel = () => emit('cancel');
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="show" class="fixed inset-0 z-150 flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div @click="handleCancel" class="absolute inset-0 bg-secondary/60 backdrop-blur-sm"></div>

      <!-- Modal Card -->
      <div class="relative bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-10 animate-in fade-in zoom-in duration-300">
        <div 
          :class="[
            variant === 'danger' ? 'bg-primary/10 text-primary' : 'bg-emerald-500/10 text-emerald-500',
            'w-20 h-20 rounded-3xl flex items-center justify-center mb-8'
          ]"
        >
          <svg
            v-if="variant === 'danger'"
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M3 6h18"></path>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
             <circle cx="12" cy="12" r="10"></circle>
             <path d="m9 12 2 2 4-4"></path>
          </svg>
        </div>

        <h3 class="text-3xl font-black text-secondary uppercase tracking-tighter italic mb-4">{{ title }}</h3>
        <p class="text-secondary/60 font-bold leading-relaxed mb-10">{{ message }}</p>

        <div class="flex items-center gap-4">
          <button
            @click="handleCancel"
            class="grow bg-accent/50 hover:bg-accent text-secondary font-black uppercase tracking-widest text-[10px] py-5 rounded-2xl transition-all cursor-pointer"
          >
            {{ cancelLabel }}
          </button>
          <button
            @click="handleConfirm"
            :class="[
               variant === 'danger' ? 'bg-primary shadow-primary/20' : 'bg-emerald-500 shadow-emerald-500/20',
               'grow text-white font-black uppercase tracking-widest text-[10px] py-5 rounded-2xl transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
            ]"
          >
            {{ confirmLabel }}
          </button>
        </div>
      </div>
    </div>
    </Transition>
  </Teleport>
</template>
