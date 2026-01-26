<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { toast } from '@/utils/toast';

const isLoading = ref(true);
const isSaving = ref(false);
const showAccessToken = ref(false);

const form = ref({
  mp_public_key: '',
  mp_access_token: ''
});

const fetchSettings = async () => {
  isLoading.value = true;
  try {
    const res = await fetch('/api/admin/settings');
    if (res.ok) {
      const data = await res.json();
      form.value.mp_public_key = data.mp_public_key || '';
      form.value.mp_access_token = data.mp_access_token || '';
    }
  } catch (error) {
    console.error('Error fetching settings:', error);
    toast.error('Error al cargar la configuración');
  } finally {
    isLoading.value = false;
  }
};

const saveSettings = async () => {
  isSaving.value = true;
  try {
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    });

    if (res.ok) {
      toast.success('Configuración guardada correctamente');
    } else {
      const data = await res.json();
      toast.error(data.error || 'Error al guardar');
    }
  } catch (error) {
    console.error('Error saving settings:', error);
    toast.error('Error al guardar la configuración');
  } finally {
    isSaving.value = false;
  }
};

onMounted(fetchSettings);
</script>

<template>
  <div class="max-w-3xl">
    <!-- Loading State -->
    <div v-if="isLoading" class="bg-white rounded-2xl p-8 shadow-sm">
      <div class="animate-pulse space-y-4">
        <div class="h-4 bg-gray-200 rounded w-1/4"></div>
        <div class="h-10 bg-gray-200 rounded"></div>
        <div class="h-4 bg-gray-200 rounded w-1/4 mt-6"></div>
        <div class="h-10 bg-gray-200 rounded"></div>
      </div>
    </div>

    <!-- Settings Form -->
    <form v-else @submit.prevent="saveSettings" class="space-y-6">
      <!-- MercadoPago Section -->
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600">
              <rect width="20" height="14" x="2" y="5" rx="2"/>
              <line x1="2" x2="22" y1="10" y2="10"/>
            </svg>
          </div>
          <div>
            <h2 class="text-lg font-bold text-gray-900">MercadoPago</h2>
            <p class="text-sm text-gray-500">Configura las credenciales de tu cuenta de MercadoPago</p>
          </div>
        </div>

        <div class="space-y-4">
          <!-- Public Key -->
          <div>
            <label for="mp_public_key" class="block text-sm font-medium text-gray-700 mb-1">
              Public Key
            </label>
            <input
              id="mp_public_key"
              v-model="form.mp_public_key"
              type="text"
              placeholder="APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
            />
            <p class="mt-1 text-xs text-gray-400">
              Encuentra tu Public Key en el panel de MercadoPago → Credenciales
            </p>
          </div>

          <!-- Access Token -->
          <div>
            <label for="mp_access_token" class="block text-sm font-medium text-gray-700 mb-1">
              Access Token
            </label>
            <div class="relative">
              <input
                id="mp_access_token"
                v-model="form.mp_access_token"
                :type="showAccessToken ? 'text' : 'password'"
                placeholder="APP_USR-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxx"
                class="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
              />
              <button
                type="button"
                @click="showAccessToken = !showAccessToken"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg v-if="showAccessToken" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" x2="23" y1="1" y2="23"/>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
            <p class="mt-1 text-xs text-gray-400">
              El Access Token es privado. Nunca lo compartas públicamente.
            </p>
          </div>
        </div>

        <!-- Info Box -->
        <div class="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div class="flex gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-amber-600 shrink-0 mt-0.5">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <line x1="12" x2="12" y1="9" y2="13"/>
              <line x1="12" x2="12.01" y1="17" y2="17"/>
            </svg>
            <div class="text-sm text-amber-800">
              <p class="font-medium mb-1">Importante</p>
              <p>Asegúrate de usar las credenciales de <strong>producción</strong> para recibir pagos reales, o las de <strong>sandbox</strong> para pruebas.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Submit Button -->
      <div class="flex justify-end">
        <button
          type="submit"
          :disabled="isSaving"
          class="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <svg v-if="isSaving" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>{{ isSaving ? 'Guardando...' : 'Guardar configuración' }}</span>
        </button>
      </div>
    </form>
  </div>
</template>
