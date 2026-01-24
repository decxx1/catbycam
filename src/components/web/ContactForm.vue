<script setup>
import { ref } from 'vue';

const form = ref({
  name: '',
  email: '',
  phone: '',
  message: ''
});

const isSubmitting = ref(false);
const submitted = ref(false);

const handleSubmit = () => {
  isSubmitting.value = true;
  // Simulate API call
  setTimeout(() => {
    isSubmitting.value = false;
    submitted.value = true;
    form.value = { name: '', email: '', phone: '', message: '' };
  }, 1500);
};
</script>

<template>
  <div class="bg-white p-8 md:p-12 rounded-3xl shadow-2xl shadow-secondary/5 border border-secondary/5">
    <div v-if="!submitted">
      <h3 class="text-2xl font-black mb-8">Envianos un <span class="text-primary italic">mensaje</span></h3>
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="flex flex-col gap-2">
            <label class="text-[10px] uppercase font-bold tracking-widest text-secondary/40 ml-1">Nombre Completo</label>
            <input 
              v-model="form.name"
              type="text" 
              required
              class="w-full bg-accent/50 border border-secondary/10 rounded-xl px-5 py-4 focus:outline-none focus:border-primary/40 focus:bg-white transition-all"
              placeholder="Juan Pérez"
            >
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-[10px] uppercase font-bold tracking-widest text-secondary/40 ml-1">Teléfono</label>
            <input 
              v-model="form.phone"
              type="tel" 
              required
              class="w-full bg-accent/50 border border-secondary/10 rounded-xl px-5 py-4 focus:outline-none focus:border-primary/40 focus:bg-white transition-all"
              placeholder="+54 261 ..."
            >
          </div>
        </div>
        
        <div class="flex flex-col gap-2">
          <label class="text-[10px] uppercase font-bold tracking-widest text-secondary/40 ml-1">Email</label>
          <input 
            v-model="form.email"
            type="email" 
            required
            class="w-full bg-accent/50 border border-secondary/10 rounded-xl px-5 py-4 focus:outline-none focus:border-primary/40 focus:bg-white transition-all"
            placeholder="juan@ejemplo.com"
          >
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-[10px] uppercase font-bold tracking-widest text-secondary/40 ml-1">Mensaje</label>
          <textarea 
            v-model="form.message"
            rows="4" 
            required
            class="w-full bg-accent/50 border border-secondary/10 rounded-xl px-5 py-4 focus:outline-none focus:border-primary/40 focus:bg-white transition-all resize-none"
            placeholder="¿En qué podemos ayudarte?"
          ></textarea>
        </div>

        <button 
          type="submit" 
          :disabled="isSubmitting"
          class="w-full btn-primary flex items-center justify-center gap-3 py-5 text-lg"
          :class="{ 'opacity-70 cursor-wait': isSubmitting }"
        >
          <span v-if="!isSubmitting">Enviar Consulta</span>
          <span v-else>Enviando...</span>
          <svg v-if="!isSubmitting" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </form>
    </div>

    <!-- Success Message -->
    <div v-else class="text-center py-12">
      <div class="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-8">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </div>
      <h3 class="text-3xl font-black mb-4">¡Mensaje Enviado!</h3>
      <p class="text-secondary/60 text-lg mb-8 leading-relaxed">
        Gracias por contactarnos. Un especialista se pondrá en contacto con vos a la brevedad.
      </p>
      <button 
        @click="submitted = false"
        class="text-primary font-bold uppercase tracking-widest text-sm hover:underline"
      >
        Enviar otro mensaje
      </button>
    </div>
  </div>
</template>
