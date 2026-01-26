<script setup lang="ts">
import { ref } from 'vue';
import ProfileEditor from './ProfileEditor.vue';

const props = defineProps<{
  userName: string;
  userEmail: string;
}>();

const showEditor = ref(false);
const currentName = ref(props.userName);
const currentEmail = ref(props.userEmail);

const handleUpdated = (data: { name: string; email: string }) => {
  currentName.value = data.name;
  currentEmail.value = data.email;
};
</script>

<template>
  <div class="space-y-8">
    <div class="flex items-center justify-between mb-8 pb-4 border-b border-secondary/5">
      <h3 class="font-bold text-lg">Información de la cuenta</h3>
      <button 
        @click="showEditor = true"
        class="text-primary font-bold text-xs uppercase tracking-widest hover:underline cursor-pointer"
      >
        Editar
      </button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-8">
      <div>
        <label class="block text-[10px] uppercase font-bold tracking-widest text-secondary/30 mb-1">Nombre</label>
        <p class="font-bold text-secondary">{{ currentName }}</p>
      </div>
      <div>
        <label class="block text-[10px] uppercase font-bold tracking-widest text-secondary/30 mb-1">Email</label>
        <p class="font-bold text-secondary">{{ currentEmail }}</p>
      </div>
    </div>

    <ProfileEditor 
      v-if="showEditor"
      :initial-name="currentName"
      :initial-email="currentEmail"
      @close="showEditor = false"
      @updated="handleUpdated"
    />
  </div>
</template>
