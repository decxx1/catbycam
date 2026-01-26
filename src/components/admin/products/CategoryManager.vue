<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Category } from '@/services/categoryService';

const props = defineProps<{
  categories: Category[];
}>();

const emit = defineEmits(['create', 'delete', 'update']);

const newCategory = ref('');
const editingId = ref<number | null>(null);
const editingName = ref('');
const currentPage = ref(1);
const itemsPerPage = 5;

const totalPages = computed(() => Math.ceil(props.categories.length / itemsPerPage));

const paginatedCategories = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return props.categories.slice(start, start + itemsPerPage);
});

const handleCreate = () => {
    if (newCategory.value.trim()) {
        emit('create', newCategory.value.trim());
        newCategory.value = '';
    }
};

const startEdit = (cat: Category) => {
    editingId.value = cat.id;
    editingName.value = cat.name;
};

const cancelEdit = () => {
    editingId.value = null;
    editingName.value = '';
};

const saveEdit = () => {
    if (editingId.value && editingName.value.trim()) {
        emit('update', { id: editingId.value, name: editingName.value.trim() });
        cancelEdit();
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
        <div v-for="cat in paginatedCategories" :key="cat.id" class="flex items-center justify-between p-4 bg-accent/30 rounded-xl group">
            <template v-if="editingId === cat.id">
                <input 
                    v-model="editingName"
                    type="text"
                    @keyup.enter="saveEdit"
                    @keyup.escape="cancelEdit"
                    class="grow bg-white border border-primary/40 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none"
                    autofocus
                />
                <div class="flex gap-2 ml-3">
                    <button 
                        @click="saveEdit"
                        class="w-8 h-8 flex items-center justify-center bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all cursor-pointer"
                        title="Guardar"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                    </button>
                    <button 
                        @click="cancelEdit"
                        class="w-8 h-8 flex items-center justify-center bg-secondary/20 text-secondary rounded-lg hover:bg-secondary/30 transition-all cursor-pointer"
                        title="Cancelar"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                </div>
            </template>
            <template v-else>
                <span class="font-bold text-sm text-secondary">{{ cat.name }}</span>
                <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        @click="startEdit(cat)"
                        class="w-8 h-8 flex items-center justify-center bg-secondary/10 text-secondary rounded-lg hover:bg-secondary hover:text-white transition-all cursor-pointer"
                        title="Editar"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    </button>
                    <button 
                        @click="emit('delete', cat.id)"
                        class="w-8 h-8 flex items-center justify-center bg-primary/5 text-primary rounded-lg hover:bg-primary hover:text-white transition-all cursor-pointer"
                        title="Eliminar"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                    </button>
                </div>
            </template>
        </div>

        <div v-if="categories.length === 0" class="text-center py-8 text-secondary/40 text-sm font-bold">
            No hay categorías creadas
        </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex justify-center items-center gap-3 pt-4 border-t border-secondary/10">
        <button 
            @click="currentPage--"
            :disabled="currentPage === 1"
            class="w-8 h-8 rounded-lg flex items-center justify-center bg-accent/50 text-secondary/60 hover:bg-primary hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <span class="text-xs font-bold text-secondary/50">{{ currentPage }} / {{ totalPages }}</span>
        <button 
            @click="currentPage++"
            :disabled="currentPage >= totalPages"
            class="w-8 h-8 rounded-lg flex items-center justify-center bg-accent/50 text-secondary/60 hover:bg-primary hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="rotate-180"><path d="m15 18-6-6 6-6"/></svg>
        </button>
    </div>
  </div>
</template>

