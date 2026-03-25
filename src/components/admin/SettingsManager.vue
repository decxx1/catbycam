<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { toast } from '@/utils/toast';

const isLoading = ref(true);
const isSaving = ref(false);
const showAccessToken = ref(false);

const form = ref({
  mp_public_key: '',
  mp_access_token: '',
  contact_whatsapp: '',
  contact_email: '',
  contact_address: '',
  contact_maps_url: '',
  contact_maps_iframe: '',
  store_purchases_enabled: true,
});

const isTogglingPurchases = ref(false);

const fetchSettings = async () => {
  isLoading.value = true;
  try {
    const res = await fetch('/api/admin/settings');
    if (res.ok) {
      const data = await res.json();
      form.value.mp_public_key = data.mp_public_key || '';
      form.value.mp_access_token = data.mp_access_token || '';
      form.value.contact_whatsapp = data.contact_whatsapp || '';
      form.value.contact_email = data.contact_email || '';
      form.value.contact_address = data.contact_address || '';
      form.value.contact_maps_url = data.contact_maps_url || '';
      form.value.contact_maps_iframe = data.contact_maps_iframe || '';
      form.value.store_purchases_enabled = data.store_purchases_enabled !== false;
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

const togglePurchases = async () => {
  isTogglingPurchases.value = true;
  const newValue = !form.value.store_purchases_enabled;
  try {
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ store_purchases_enabled: newValue })
    });
    if (res.ok) {
      form.value.store_purchases_enabled = newValue;
      toast.success(newValue ? 'Compras habilitadas' : 'Compras deshabilitadas');
    } else {
      toast.error('Error al cambiar el estado');
    }
  } catch (error) {
    console.error('Error toggling purchases:', error);
    toast.error('Error al cambiar el estado');
  } finally {
    isTogglingPurchases.value = false;
  }
};

onMounted(async () => {
  await fetchSettings();
});

// ---- MiCorreo ----
const mcValidateResult = ref<{ customerId?: string; createdAt?: string; error?: string } | null>(null);
const isMcValidating = ref(false);
const showRegisterForm = ref(false);
const isMcRegistering = ref(false);
const mcRegisterResult = ref<{ customerId?: string; createdAt?: string; error?: string } | null>(null);
const mcRegisterForm = ref({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  documentType: 'DNI' as 'DNI' | 'CUIT',
  documentId: '',
  phone: '',
  address: {
    streetName: '',
    streetNumber: '',
    city: '',
    locality: '',
    provinceCode: 'X',
    postalCode: '',
  },
});
const mcTestZip = ref('');
const isMcTesting = ref(false);
const mcTestResult = ref<any>(null);

const validateMcCredentials = async () => {
  isMcValidating.value = true;
  mcValidateResult.value = null;
  try {
    const res = await fetch('/api/admin/shipping/validate');
    const data = await res.json();
    mcValidateResult.value = res.ok ? data : { error: data.error ?? 'Error desconocido' };
  } catch {
    mcValidateResult.value = { error: 'Error de conexión' };
  } finally {
    isMcValidating.value = false;
  }
};

const registerMcUser = async () => {
  isMcRegistering.value = true;
  mcRegisterResult.value = null;
  try {
    const res = await fetch('/api/admin/shipping/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mcRegisterForm.value),
    });
    const data = await res.json();
    mcRegisterResult.value = res.ok ? data : { error: data.error ?? 'Error al registrar' };
    if (res.ok) toast.success('Usuario registrado. Copiá el customerId y actualizá MC_CUSTOMER_ID en .env');
  } catch {
    mcRegisterResult.value = { error: 'Error de conexión' };
  } finally {
    isMcRegistering.value = false;
  }
};

const testMcRates = async () => {
  if (!mcTestZip.value) return;
  isMcTesting.value = true;
  mcTestResult.value = null;
  try {
    const res = await fetch('/api/shipping/rates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postalCodeDestination: mcTestZip.value, dimensions: { weight: 1500, height: 20, width: 30, length: 40 } }),
    });
    mcTestResult.value = await res.json();
  } catch {
    mcTestResult.value = { error: 'Error de conexión' };
  } finally {
    isMcTesting.value = false;
  }
};
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
      <!-- Panic Button Section -->
      <div :class="['rounded-2xl p-6 shadow-sm border transition-all', form.store_purchases_enabled ? 'bg-white border-gray-100' : 'bg-red-50 border-red-200']">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div :class="['w-10 h-10 rounded-xl flex items-center justify-center transition-colors', form.store_purchases_enabled ? 'bg-green-100' : 'bg-red-100']">
              <svg v-if="form.store_purchases_enabled" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-600"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-600"><circle cx="12" cy="12" r="10"/><line x1="4.93" x2="19.07" y1="4.93" y2="19.07"/></svg>
            </div>
            <div>
              <h2 class="text-lg font-bold text-gray-900">Estado de la Tienda</h2>
              <p class="text-sm" :class="form.store_purchases_enabled ? 'text-green-600' : 'text-red-600'">
                {{ form.store_purchases_enabled ? 'Las compras están habilitadas' : 'Las compras están deshabilitadas' }}
              </p>
            </div>
          </div>
          <button
            type="button"
            @click="togglePurchases"
            :disabled="isTogglingPurchases"
            :class="[
              'px-5 py-3 font-bold rounded-xl transition-all text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed',
              form.store_purchases_enabled
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            ]"
          >
            <svg v-if="isTogglingPurchases" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ form.store_purchases_enabled ? 'Detener Compras' : 'Habilitar Compras' }}
          </button>
        </div>
        <p v-if="!form.store_purchases_enabled" class="mt-4 text-xs text-red-500 font-medium bg-red-100 rounded-lg px-4 py-2">
          Los usuarios no pueden realizar compras en este momento. El botón "Comprar Ahora" y el checkout están bloqueados.
        </p>
      </div>

      <!-- Contact Info Section -->
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-600">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 18.92z"/>
            </svg>
          </div>
          <div>
            <h2 class="text-lg font-bold text-gray-900">Datos de Contacto</h2>
            <p class="text-sm text-gray-500">Información que se muestra en la web (footer y página de contacto)</p>
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <label for="contact_whatsapp" class="block text-sm font-medium text-gray-700 mb-1">
              WhatsApp
            </label>
            <input
              id="contact_whatsapp"
              v-model="form.contact_whatsapp"
              type="text"
              placeholder="+54 261 346-4334"
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
            />
            <p class="mt-1 text-xs text-gray-400">
              Número con código de país. Se usará para generar el link de WhatsApp.
            </p>
          </div>

          <div>
            <label for="contact_email" class="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              id="contact_email"
              v-model="form.contact_email"
              type="email"
              placeholder="info@catbycam.com.ar"
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
            />
          </div>

          <div>
            <label for="contact_address" class="block text-sm font-medium text-gray-700 mb-1">
              Dirección
            </label>
            <input
              id="contact_address"
              v-model="form.contact_address"
              type="text"
              placeholder="Santa Fe 687, Mendoza, Argentina"
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
            />
          </div>

          <div>
            <label for="contact_maps_url" class="block text-sm font-medium text-gray-700 mb-1">
              URL de Google Maps
            </label>
            <input
              id="contact_maps_url"
              v-model="form.contact_maps_url"
              type="url"
              placeholder="https://maps.app.goo.gl/..."
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
            />
            <p class="mt-1 text-xs text-gray-400">
              Link corto de Google Maps para que la dirección sea clickeable.
            </p>
          </div>

          <div>
            <label for="contact_maps_iframe" class="block text-sm font-medium text-gray-700 mb-1">
              Iframe del mapa (Base64)
            </label>
            <textarea
              id="contact_maps_iframe"
              v-model="form.contact_maps_iframe"
              rows="3"
              placeholder="PGlmcmFtZSBzcmM9Imh0dHBz..."
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono text-xs"
            />
            <p class="mt-1 text-xs text-gray-400">
              Código iframe de Google Maps codificado en Base64. Se decodifica automáticamente en la web.
            </p>
          </div>
        </div>
      </div>

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

      <!-- MiCorreo Section -->
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-amber-600">
              <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
            </svg>
          </div>
          <div>
            <h2 class="text-lg font-bold text-gray-900">MiCorreo (Correo Argentino)</h2>
            <p class="text-sm text-gray-500">Verificar credenciales, registrar usuario de test y probar cotización de envíos</p>
          </div>
        </div>

        <div class="space-y-6">
          <!-- Validate credentials -->
          <div>
            <p class="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Validar credenciales</p>
            <button
              type="button"
              @click="validateMcCredentials"
              :disabled="isMcValidating"
              class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg v-if="isMcValidating" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isMcValidating ? 'Validando...' : 'Validar credenciales' }}
            </button>
            <div v-if="mcValidateResult" class="mt-3 p-3 rounded-xl text-sm font-mono" :class="mcValidateResult.error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'">
              <span v-if="mcValidateResult.error">{{ mcValidateResult.error }}</span>
              <span v-else>customerId: <strong>{{ mcValidateResult.customerId }}</strong> · createdAt: {{ mcValidateResult.createdAt }}</span>
            </div>
          </div>

          <!-- Register user -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <p class="text-xs font-bold uppercase tracking-widest text-gray-500">Registrar usuario en MiCorreo</p>
              <button type="button" @click="showRegisterForm = !showRegisterForm" class="text-xs text-gray-400 hover:text-gray-600 underline">
                {{ showRegisterForm ? 'Ocultar' : 'Mostrar formulario' }}
              </button>
            </div>
            <div v-if="showRegisterForm" class="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
                  <input v-model="mcRegisterForm.firstName" type="text" placeholder="Juan" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-300 focus:border-amber-400" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">Apellido *</label>
                  <input v-model="mcRegisterForm.lastName" type="text" placeholder="Gonzalez" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-300 focus:border-amber-400" />
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                <input v-model="mcRegisterForm.email" type="email" placeholder="test@correo.com" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-300 focus:border-amber-400" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Contraseña *</label>
                <input v-model="mcRegisterForm.password" type="password" placeholder="Mínimo 6 caracteres" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-300 focus:border-amber-400" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">Tipo de documento *</label>
                  <select v-model="mcRegisterForm.documentType" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-300 focus:border-amber-400">
                    <option value="DNI">DNI</option>
                    <option value="CUIT">CUIT</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">Número de documento *</label>
                  <input v-model="mcRegisterForm.documentId" type="text" placeholder="32471960" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-300 focus:border-amber-400" />
                </div>
              </div>
              <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400 pt-1">Dirección (requerida para DNI)</p>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">Calle *</label>
                  <input v-model="mcRegisterForm.address.streetName" type="text" placeholder="Mitre" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-300 focus:border-amber-400" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">Número *</label>
                  <input v-model="mcRegisterForm.address.streetNumber" type="text" placeholder="123" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-300 focus:border-amber-400" />
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">Ciudad *</label>
                  <input v-model="mcRegisterForm.address.city" type="text" placeholder="Cordoba" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-300 focus:border-amber-400" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">Localidad *</label>
                  <input v-model="mcRegisterForm.address.locality" type="text" placeholder="Cordoba" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-300 focus:border-amber-400" />
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">Provincia *</label>
                  <select v-model="mcRegisterForm.address.provinceCode" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-300 focus:border-amber-400">
                    <option value="A">Salta</option>
                    <option value="B">Buenos Aires</option>
                    <option value="C">CABA</option>
                    <option value="D">San Luis</option>
                    <option value="E">Entre Ríos</option>
                    <option value="F">La Rioja</option>
                    <option value="G">Santiago del Estero</option>
                    <option value="H">Chaco</option>
                    <option value="J">San Juan</option>
                    <option value="K">Catamarca</option>
                    <option value="L">La Pampa</option>
                    <option value="M">Mendoza</option>
                    <option value="N">Misiones</option>
                    <option value="P">Formosa</option>
                    <option value="Q">Neuquén</option>
                    <option value="R">Río Negro</option>
                    <option value="S">Santa Fe</option>
                    <option value="T">Tucumán</option>
                    <option value="U">Chubut</option>
                    <option value="V">Tierra del Fuego</option>
                    <option value="W">Corrientes</option>
                    <option value="X">Córdoba</option>
                    <option value="Y">Jujuy</option>
                    <option value="Z">Santa Cruz</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">Código Postal *</label>
                  <input v-model="mcRegisterForm.address.postalCode" type="text" placeholder="5000" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-300 focus:border-amber-400" />
                </div>
              </div>
              <button
                type="button"
                @click="registerMcUser"
                :disabled="isMcRegistering || !mcRegisterForm.firstName || !mcRegisterForm.email || !mcRegisterForm.password || !mcRegisterForm.documentId"
                class="w-full px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ isMcRegistering ? 'Registrando...' : 'Registrar usuario' }}
              </button>
              <div v-if="mcRegisterResult" class="p-3 rounded-xl text-sm font-mono" :class="mcRegisterResult.error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'">
                <span v-if="mcRegisterResult.error">{{ mcRegisterResult.error }}</span>
                <span v-else>customerId: <strong>{{ mcRegisterResult.customerId }}</strong> — Actualizá MC_CUSTOMER_ID en .env</span>
              </div>
            </div>
          </div>

          <!-- Test rates -->
          <div>
            <p class="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Test de cotización</p>
            <div class="flex gap-2">
              <input v-model="mcTestZip" type="text" placeholder="CP destino (ej: 5500)" maxlength="8" class="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-300 focus:border-amber-400 w-40" />
              <button
                type="button"
                @click="testMcRates"
                :disabled="isMcTesting || !mcTestZip"
                class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg v-if="isMcTesting" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ isMcTesting ? 'Cotizando...' : 'Cotizar' }}
              </button>
            </div>
            <div v-if="mcTestResult" class="mt-3">
              <div v-if="mcTestResult.error" class="p-3 rounded-xl text-sm bg-red-50 text-red-700 border border-red-200 font-mono">
                {{ mcTestResult.error }}
              </div>
              <div v-else-if="mcTestResult.rates" class="space-y-2">
                <div v-for="rate in mcTestResult.rates" :key="rate.deliveredType + rate.productType" class="p-3 rounded-xl bg-green-50 border border-green-200 flex justify-between items-center text-sm">
                  <div>
                    <p class="font-bold text-green-800">{{ rate.productName }}</p>
                    <p class="text-xs text-green-600">{{ rate.deliveredType === 'D' ? 'A domicilio' : 'A sucursal' }} · {{ rate.deliveryTimeMin }}-{{ rate.deliveryTimeMax }} días</p>
                  </div>
                  <p class="font-black text-green-800">${{ rate.price.toLocaleString('es-AR', { maximumFractionDigits: 0 }) }}</p>
                </div>
              </div>
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
