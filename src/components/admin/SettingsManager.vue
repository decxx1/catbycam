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

const provinces = ref<{ id: number; name: string }[]>([]);
const shippingCosts = ref<{ province_id: number; cost: number }[]>([]);
const isLoadingShipping = ref(true);
const isSavingShipping = ref(false);

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

const fetchProvinces = async () => {
  try {
    const res = await fetch('/api/provinces');
    if (res.ok) {
      provinces.value = await res.json();
      // Inicializar costos con 0 para todas las provincias
      shippingCosts.value = provinces.value.map(p => ({ province_id: p.id, cost: 0 }));
    }
  } catch (e) {
    console.error('Error fetching provinces', e);
  }
};

const fetchShippingCosts = async () => {
  isLoadingShipping.value = true;
  try {
    const res = await fetch('/api/admin/shipping-costs');
    if (res.ok) {
      const data = await res.json();
      // Actualizar los costos existentes
      for (const item of data) {
        const idx = shippingCosts.value.findIndex(sc => sc.province_id === item.province_id);
        if (idx !== -1) {
          shippingCosts.value[idx].cost = parseFloat(item.cost);
        }
      }
    }
  } catch (e) {
    console.error('Error fetching shipping costs', e);
  } finally {
    isLoadingShipping.value = false;
  }
};

const saveShippingCosts = async () => {
  isSavingShipping.value = true;
  try {
    const res = await fetch('/api/admin/shipping-costs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ costs: shippingCosts.value })
    });
    if (res.ok) {
      toast.success('Costos de envío guardados');
    } else {
      toast.error('Error al guardar costos');
    }
  } catch (e) {
    console.error('Error saving shipping costs', e);
    toast.error('Error al guardar costos');
  } finally {
    isSavingShipping.value = false;
  }
};

const getProvinceName = (provinceId: number) => {
  const province = provinces.value.find(p => p.id === provinceId);
  return province ? province.name : '';
};

onMounted(async () => {
  await fetchSettings();
  await fetchProvinces();
  await fetchShippingCosts();
});
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

    <!-- Shipping Costs Section -->
    <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mt-6">
      <div class="flex items-center gap-3 mb-6">
        <div class="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-orange-600">
            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
            <path d="M15 18H9"/>
            <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
            <circle cx="17" cy="18" r="2"/>
            <circle cx="7" cy="18" r="2"/>
          </svg>
        </div>
        <div>
          <h2 class="text-lg font-bold text-gray-900">Costos de Envío por Provincia</h2>
          <p class="text-sm text-gray-500">Configura el costo de envío para cada provincia</p>
        </div>
      </div>

      <div v-if="isLoadingShipping" class="animate-pulse space-y-3">
        <div v-for="i in 6" :key="i" class="h-12 bg-gray-100 rounded-xl"></div>
      </div>

      <div v-else class="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        <div 
          v-for="sc in shippingCosts" 
          :key="sc.province_id"
          class="flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <span class="flex-1 font-medium text-gray-700 text-sm">{{ getProvinceName(sc.province_id) }}</span>
          <div class="flex items-center gap-2">
            <span class="text-gray-400 text-sm">$</span>
            <input
              v-model.number="sc.cost"
              type="number"
              min="0"
              step="100"
              class="w-28 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-right font-mono"
            />
          </div>
        </div>
      </div>

      <div class="mt-6 flex justify-end">
        <button
          type="button"
          @click="saveShippingCosts"
          :disabled="isSavingShipping"
          class="px-6 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <svg v-if="isSavingShipping" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>{{ isSavingShipping ? 'Guardando...' : 'Guardar costos de envío' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
