<script setup lang="ts">
import Modal from '@/components/common/Modal.vue';

const props = defineProps<{
  show: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: 'primary' | 'secondary' | 'danger';
}>();

const emit = defineEmits(['confirm', 'cancel']);

const variants = {
    primary: 'bg-primary text-white shadow-lg shadow-primary/20',
    secondary: 'bg-secondary text-white shadow-lg shadow-secondary/10',
    danger: 'bg-red-500 text-white shadow-lg shadow-red-500/20'
};
</script>

<template>
  <Modal :show="show" :title="title" size="sm" @close="emit('cancel')">
    <div class="flex flex-col items-center text-center">
        <div class="w-20 h-20 bg-primary/5 rounded-3xl flex items-center justify-center text-primary mb-8">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        </div>
        <p class="text-secondary/60 text-lg leading-relaxed mb-10">
            {{ message }}
        </p>
        
        <div class="flex items-center gap-4 w-full">
            <button 
                @click="emit('cancel')"
                class="flex-grow bg-accent/50 hover:bg-accent text-secondary font-bold py-5 rounded-2xl transition-all cursor-pointer"
            >
                Cancelar
            </button>
            <button 
                @click="emit('confirm')"
                :class="[variants[confirmVariant || 'primary'], 'flex-grow font-black py-5 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer']"
            >
                {{ confirmLabel || 'Confirmar' }}
            </button>
        </div>
    </div>
  </Modal>
</template>
鼓
