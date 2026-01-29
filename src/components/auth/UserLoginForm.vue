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
      errorMessage.value = result.error.message || 'Email o contraseña incorrectos';
      isSubmitting.value = false;
      return;
    }

    // Redirigir al perfil
    window.location.href = '/profile';
  } catch (e: any) {
    errorMessage.value = e.message || 'Error al iniciar sesión';
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="w-full max-w-md mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-2xl border border-secondary/5">
    <div class="text-center mb-10">
      <h2 class="text-3xl font-black mb-2">Bienvenido</h2>
      <p class="text-secondary/50 text-sm">Ingresá tus credenciales para continuar</p>
    </div>

    <div v-if="errorMessage" class="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-xl text-primary text-sm font-bold text-center">
      {{ errorMessage }}
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <div class="flex flex-col gap-2">
        <label class="text-[10px] uppercase font-bold tracking-widest text-secondary/40 ml-1">Email</label>
        <input 
          v-model="email"
          type="email" 
          required
          :disabled="isSubmitting"
          class="w-full bg-accent/50 border border-secondary/10 rounded-xl px-5 py-4 focus:outline-none focus:border-primary/40 focus:bg-white transition-all disabled:opacity-50"
          placeholder="email@ejemplo.com"
        >
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-[10px] uppercase font-bold tracking-widest text-secondary/40 ml-1">Contraseña</label>
        <input 
          v-model="password"
          type="password" 
          required
          :disabled="isSubmitting"
          class="w-full bg-accent/50 border border-secondary/10 rounded-xl px-5 py-4 focus:outline-none focus:border-primary/40 focus:bg-white transition-all disabled:opacity-50"
          placeholder="••••••••"
        >
      </div>

      <button 
        type="submit" 
        :disabled="isSubmitting"
        class="w-full btn-primary py-5 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span v-if="isSubmitting">Ingresando...</span>
        <span v-else>Iniciar Sesión</span>
      </button>
    </form>

    <div class="mt-10 text-center">
      <p class="text-secondary/40 text-sm font-medium">
        ¿No tenés una cuenta?
        <a href="/register" class="text-primary font-bold hover:underline ml-1">Registrate</a>
      </p>
    </div>
  </div>
</template>
