<script setup lang="ts">
import { ref, onMounted } from 'vue';

const props = defineProps<{
  initialIsLoggedIn: boolean
}>();

const isLoggedIn = ref(props.initialIsLoggedIn);

onMounted(() => {
  // Check for the presence of the auxiliary auth cookie
  const cookies = document.cookie.split('; ');
  const hasCookie = cookies.some(c => c.trim().startsWith('cb_logged_in='));
  
  // Update state if different from server (important for static pages)
  if (hasCookie !== isLoggedIn.value) {
    isLoggedIn.value = hasCookie;
  }
});
</script>

<template>
  <div v-if="isLoggedIn">
    <a
      href="/profile"
      class="flex items-center gap-3 text-sm font-bold text-secondary hover:text-primary transition-colors"
    >
      <div class="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>
      Mi Perfil
    </a>
  </div>
  <div v-else class="flex items-center gap-4">
    <a
      href="/login"
      class="text-sm font-bold text-secondary/60 hover:text-primary transition-colors"
    >
      Ingresar
    </a>
    <a
      href="/register"
      class="btn-primary text-sm py-2 px-5"
    >
      Regístrate
    </a>
  </div>
</template>
