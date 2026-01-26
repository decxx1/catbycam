<script setup lang="ts">
import { ref } from 'vue';
import { toast } from '@/utils/toast';

const props = defineProps<{
  initialName: string;
  initialEmail: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'updated', data: { name: string; email: string }): void;
}>();

const name = ref(props.initialName);
const email = ref(props.initialEmail);
const isLoading = ref(false);

const emailChanged = () => email.value !== props.initialEmail;

const handleSubmit = async () => {
  if (!name.value.trim() || !email.value.trim()) {
    toast.error('Nombre y email son requeridos');
    return;
  }

  isLoading.value = true;
  try {
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.value.trim(),
        email: email.value.trim()
      })
    });

    const data = await res.json();

    if (res.ok) {
      if (data.emailChanged) {
        toast.success(data.message);
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      } else {
        toast.success(data.message);
        emit('updated', { name: name.value, email: email.value });
        emit('close');
        window.location.reload();
      }
    } else {
      toast.error(data.error || 'Error al actualizar');
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
        <h2 class="text-xl font-black text-secondary uppercase tracking-tight">Editar Perfil</h2>
        <button @click="emit('close')" class="text-secondary/40 hover:text-secondary transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div class="flex flex-col gap-2">
          <label class="text-[10px] font-black uppercase tracking-widest text-secondary/40">Nombre</label>
          <input 
            v-model="name" 
            type="text" 
            required 
            class="w-full bg-accent/30 border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-primary outline-none font-bold"
            placeholder="Tu nombre"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-[10px] font-black uppercase tracking-widest text-secondary/40">Email</label>
          <input 
            v-model="email" 
            type="email" 
            required 
            class="w-full bg-accent/30 border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-primary outline-none font-bold"
            placeholder="tu@email.com"
          />
          <p v-if="emailChanged()" class="text-xs text-amber-600 font-bold flex items-center gap-2 mt-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            Al cambiar el email deberás iniciar sesión nuevamente
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
            :disabled="isLoading"
            class="flex-1 btn-primary py-4 rounded-xl font-black uppercase tracking-widest text-xs disabled:opacity-50"
          >
            {{ isLoading ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
