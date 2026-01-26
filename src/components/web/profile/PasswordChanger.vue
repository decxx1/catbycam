<script setup lang="ts">
import { ref } from 'vue';
import { toast } from '@/utils/toast';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const isLoading = ref(false);
const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

const handleSubmit = async () => {
  if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
    toast.error('Todos los campos son requeridos');
    return;
  }

  if (newPassword.value !== confirmPassword.value) {
    toast.error('Las contraseñas nuevas no coinciden');
    return;
  }

  if (newPassword.value.length < 6) {
    toast.error('La contraseña debe tener al menos 6 caracteres');
    return;
  }

  isLoading.value = true;
  try {
    const res = await fetch('/api/profile/password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword: currentPassword.value,
        newPassword: newPassword.value,
        confirmPassword: confirmPassword.value
      })
    });

    const data = await res.json();

    if (res.ok) {
      toast.success(data.message);
      emit('close');
    } else {
      toast.error(data.error || 'Error al cambiar contraseña');
    }
  } catch (e) {
    toast.error('Error de conexión');
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="fixed inset-0 bg-secondary/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click.self="emit('close')">
    <div class="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-black text-secondary uppercase tracking-tight">Cambiar Contraseña</h2>
        <button @click="emit('close')" class="text-secondary/40 hover:text-secondary transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-5">
        <div class="flex flex-col gap-2">
          <label class="text-[10px] font-black uppercase tracking-widest text-secondary/40">Contraseña Actual</label>
          <div class="relative">
            <input 
              v-model="currentPassword" 
              :type="showCurrentPassword ? 'text' : 'password'" 
              required 
              class="w-full bg-accent/30 border-none rounded-xl py-4 px-6 pr-12 focus:ring-2 focus:ring-primary outline-none font-bold"
              placeholder="••••••••"
            />
            <button 
              type="button" 
              @click="showCurrentPassword = !showCurrentPassword"
              class="absolute right-4 top-1/2 -translate-y-1/2 text-secondary/40 hover:text-secondary"
            >
              <svg v-if="showCurrentPassword" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-[10px] font-black uppercase tracking-widest text-secondary/40">Nueva Contraseña</label>
          <div class="relative">
            <input 
              v-model="newPassword" 
              :type="showNewPassword ? 'text' : 'password'" 
              required 
              minlength="6"
              class="w-full bg-accent/30 border-none rounded-xl py-4 px-6 pr-12 focus:ring-2 focus:ring-primary outline-none font-bold"
              placeholder="Mínimo 6 caracteres"
            />
            <button 
              type="button" 
              @click="showNewPassword = !showNewPassword"
              class="absolute right-4 top-1/2 -translate-y-1/2 text-secondary/40 hover:text-secondary"
            >
              <svg v-if="showNewPassword" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-[10px] font-black uppercase tracking-widest text-secondary/40">Repetir Nueva Contraseña</label>
          <div class="relative">
            <input 
              v-model="confirmPassword" 
              :type="showConfirmPassword ? 'text' : 'password'" 
              required 
              minlength="6"
              class="w-full bg-accent/30 border-none rounded-xl py-4 px-6 pr-12 focus:ring-2 focus:ring-primary outline-none font-bold"
              placeholder="Repetir contraseña"
            />
            <button 
              type="button" 
              @click="showConfirmPassword = !showConfirmPassword"
              class="absolute right-4 top-1/2 -translate-y-1/2 text-secondary/40 hover:text-secondary"
            >
              <svg v-if="showConfirmPassword" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
          <p v-if="newPassword && confirmPassword && newPassword !== confirmPassword" class="text-xs text-red-500 font-bold mt-1">
            Las contraseñas no coinciden
          </p>
        </div>

        <div class="flex gap-3 pt-4">
          <button 
            type="button" 
            @click="emit('close')"
            class="flex-1 py-4 rounded-xl font-black uppercase tracking-widest text-xs border border-secondary/20 hover:bg-accent transition-all"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            :disabled="isLoading || (newPassword && confirmPassword && newPassword !== confirmPassword)"
            class="flex-1 btn-primary py-4 rounded-xl font-black uppercase tracking-widest text-xs disabled:opacity-50"
          >
            {{ isLoading ? 'Guardando...' : 'Cambiar' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
