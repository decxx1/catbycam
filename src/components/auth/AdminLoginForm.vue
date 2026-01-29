<script setup lang="ts">
import { ref } from 'vue';
import { authClient } from '@/lib/auth-client';

const props = defineProps<{
  error?: string;
}>();

const email = ref('');
const password = ref('');
const isSubmitting = ref(false);
const errorMessage = ref(props.error || '');

async function handleSubmit() {
  if (isSubmitting.value) return;
  
  isSubmitting.value = true;
  errorMessage.value = '';

  try {
    const result = await authClient.signIn.email({
      email: email.value,
      password: password.value,
    });

    if (result.error) {
      errorMessage.value = result.error.message || 'Credenciales incorrectas';
      isSubmitting.value = false;
      return;
    }

    // Verificar que el usuario sea admin
    const session = await authClient.getSession();
    if (!session.data || (session.data.user as any).role !== 'admin') {
      await authClient.signOut();
      errorMessage.value = 'Acceso denegado. Solo administradores.';
      isSubmitting.value = false;
      return;
    }

    // Redirigir al dashboard
    window.location.href = '/admin/dashboard';
  } catch (e: any) {
    errorMessage.value = e.message || 'Error al iniciar sesión';
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="w-full bg-white/5 backdrop-blur-sm p-8 md:p-10 rounded-3xl border border-white/10">
    <div v-if="errorMessage" class="mb-6 p-4 bg-primary/20 border border-primary/30 rounded-xl text-white text-sm font-bold text-center">
      {{ errorMessage }}
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <div class="flex flex-col gap-2">
        <label class="text-[10px] uppercase font-bold tracking-widest text-white/40 ml-1">Email</label>
        <input 
          v-model="email"
          type="email" 
          required
          :disabled="isSubmitting"
          class="w-full bg-white/10 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-white/30 focus:outline-none focus:border-primary/60 focus:bg-white/15 transition-all"
          placeholder="admin@ejemplo.com"
        >
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-[10px] uppercase font-bold tracking-widest text-white/40 ml-1">Contraseña</label>
        <input 
          v-model="password"
          type="password" 
          required
          :disabled="isSubmitting"
          class="w-full bg-white/10 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-white/30 focus:outline-none focus:border-primary/60 focus:bg-white/15 transition-all"
          placeholder="••••••••"
        >
      </div>

      <button 
        type="submit" 
        :disabled="isSubmitting"
        class="w-full btn-primary py-5 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span v-if="isSubmitting">Ingresando...</span>
        <span v-else>Ingresar al Panel</span>
      </button>
    </form>
  </div>
</template>
