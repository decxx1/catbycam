<script setup>
import { ref } from 'vue';

const props = defineProps({
  mode: {
    type: String,
    default: 'login' // 'login' or 'register'
  },
  error: {
    type: String,
    default: ''
  }
});

const form = ref({
  name: '',
  email: '',
  password: ''
});

const isSubmitting = ref(false);
</script>

<template>
  <div class="w-full max-w-md mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-2xl border border-secondary/5">
    <div class="text-center mb-10">
      <h2 class="text-3xl font-black mb-2">
        {{ mode === 'login' ? 'Bienvenido' : 'Crear Cuenta' }}
      </h2>
      <p class="text-secondary/50 text-sm">
        {{ mode === 'login' ? 'Ingresá tus credenciales para continuar' : 'Completá los datos para registrarte' }}
      </p>
    </div>

    <div v-if="error" class="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-xl text-primary text-sm font-bold text-center">
      {{ error }}
    </div>

    <form method="POST" class="space-y-6">
      <div v-if="mode === 'register'" class="flex flex-col gap-2">
        <label class="text-[10px] uppercase font-bold tracking-widest text-secondary/40 ml-1">Nombre Completo</label>
        <input 
          name="name"
          type="text" 
          required
          class="w-full bg-accent/50 border border-secondary/10 rounded-xl px-5 py-4 focus:outline-none focus:border-primary/40 focus:bg-white transition-all"
          placeholder="Juan Pérez"
        >
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-[10px] uppercase font-bold tracking-widest text-secondary/40 ml-1">Email</label>
        <input 
          name="email"
          type="email" 
          required
          class="w-full bg-accent/50 border border-secondary/10 rounded-xl px-5 py-4 focus:outline-none focus:border-primary/40 focus:bg-white transition-all"
          placeholder="email@ejemplo.com"
        >
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-[10px] uppercase font-bold tracking-widest text-secondary/40 ml-1">Contraseña</label>
        <input 
          name="password"
          type="password" 
          required
          class="w-full bg-accent/50 border border-secondary/10 rounded-xl px-5 py-4 focus:outline-none focus:border-primary/40 focus:bg-white transition-all"
          placeholder="••••••••"
        >
      </div>

      <button 
        type="submit" 
        class="w-full btn-primary py-5 text-lg"
      >
        {{ mode === 'login' ? 'Iniciar Sesión' : 'Registrarse' }}
      </button>
    </form>

    <div class="mt-10 text-center">
      <p class="text-secondary/40 text-sm font-medium">
        {{ mode === 'login' ? '¿No tenés una cuenta?' : '¿Ya tenés una cuenta?' }}
        <a 
          :href="mode === 'login' ? '/register' : '/login'" 
          class="text-primary font-bold hover:underline ml-1"
        >
          {{ mode === 'login' ? 'Registrate' : 'Iniciá Sesión' }}
        </a>
      </p>
    </div>
  </div>
</template>
