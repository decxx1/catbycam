<script setup lang="ts">
import { ref } from 'vue';
import type { Category } from '@/services/categoryService';

const props = defineProps<{
  categories: Category[];
}>();

const emit = defineEmits(['create', 'delete']);

const newCategory = ref('');

const handleCreate = () => {
    if (newCategory.value.trim()) {
        emit('create', newCategory.value.trim());
        newCategory.value = '';
    }
};
</script>

<template>
  <div class="space-y-6">
    <div class="flex gap-2">
        <input 
            v-model="newCategory"
            type="text" 
            placeholder="Nueva categoría..."
            @keyup.enter="handleCreate"
            class="grow bg-accent/50 border border-secondary/10 rounded-xl px-5 py-3 focus:outline-none focus:border-primary/40 transition-all font-bold"
        />
        <button 
            @click="handleCreate"
            class="px-6 py-3 bg-primary text-white font-black rounded-xl hover:bg-secondary transition-all shadow-lg shadow-primary/10 cursor-pointer"
        >
            + Añadir
        </button>
    </div>

    <div class="grid grid-cols-1 gap-2">
        <div v-for="cat in categories" :key="cat.id" class="flex items-center justify-between p-4 bg-accent/30 rounded-xl group">
            <span class="font-bold text-sm text-secondary">{{ cat.name }}</span>
            <button 
                @click="emit('delete', cat.id)"
                class="w-8 h-8 flex items-center justify-center bg-primary/5 text-primary rounded-lg opacity-0 group-hover:opacity-100 hover:bg-primary hover:text-white transition-all cursor-pointer"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
            </button>
        </div>
    </div>
  </div>
</template>

