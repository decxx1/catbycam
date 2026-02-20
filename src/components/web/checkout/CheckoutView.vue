<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useStore } from '@nanostores/vue';
import { cartList, cartTotal, cartCount } from '@/stores/cartStore';
import { formatMoney } from '@/utils/formatters';

const props = defineProps<{
  initialSession: any;
}>();

const items = useStore(cartList);
const total = useStore(cartTotal);
const count = useStore(cartCount);

const step = ref(1); // 1: Identity, 2: Shipping, 3: Payment
const session = ref(props.initialSession);
const isMounted = ref(false);

const addresses = ref<any[]>([]);
const selectedAddressId = ref<number | null>(null);

const shippingData = ref({
  address: '',
  city: '',
  province_id: null as number | null,
  zip: '',
  phone: '',
  comments: ''
});

const provinces = ref<{ id: number; name: string }[]>([]);
const shippingCosts = ref<{ province_id: number; cost: number }[]>([]);
const shippingType = ref<'pickup' | 'delivery'>('pickup');

const fetchProvinces = async () => {
  try {
    const res = await fetch('/api/provinces');
    if (res.ok) {
      provinces.value = await res.json();
    }
  } catch (e) {
    console.error('Error fetching provinces', e);
  }
};

const fetchShippingCosts = async () => {
  try {
    const res = await fetch('/api/shipping-costs');
    if (res.ok) {
      shippingCosts.value = await res.json();
    }
  } catch (e) {
    console.error('Error fetching shipping costs', e);
  }
};

const getShippingCost = computed(() => {
  if (shippingType.value === 'pickup' || !shippingData.value.province_id) return 0;
  const cost = shippingCosts.value.find(sc => sc.province_id === shippingData.value.province_id);
  return cost ? parseFloat(String(cost.cost)) : 0;
});

const finalTotal = computed(() => {
  return total.value + getShippingCost.value;
});

const isPreferenceLoading = ref(false);
const preferenceId = ref<string | null>(null);
const isSandbox = ref(import.meta.env.PUBLIC_MP_SANDBOX === 'true');
const mpPublicKey = ref<string>('');
const purchasesEnabled = ref(true);

const checkStoreStatus = async () => {
  try {
    const res = await fetch('/api/config/store-status');
    if (res.ok) {
      const data = await res.json();
      purchasesEnabled.value = data.purchases_enabled !== false;
    }
  } catch (e) {
    console.error('Error checking store status', e);
  }
};

const getMPPublicKey = async () => {
  try {
    const res = await fetch('/api/config/mercadopago');
    if (res.ok) {
      const data = await res.json();
      mpPublicKey.value = data.publicKey;
    }
  } catch (e) {
    console.error('Error fetching MP public key', e);
  }
};

const fetchAddresses = async () => {
    if (!session.value) return;
    try {
        const res = await fetch('/api/shipping');
        if (res.ok) {
            addresses.value = await res.json();
            const defaultAddr = addresses.value.find(a => a.is_default);
            if (defaultAddr) {
                selectedAddressId.value = defaultAddr.id;
                shippingData.value = { 
                    ...shippingData.value,
                    address: defaultAddr.address,
                    city: defaultAddr.city,
                    province_id: defaultAddr.province_id,
                    zip: defaultAddr.zip,
                    phone: defaultAddr.phone
                };
            }
        }
    } catch (e) {
        console.error(e);
    }
};

onMounted(async () => {
  isMounted.value = true;
  await Promise.all([getMPPublicKey(), checkStoreStatus(), fetchProvinces(), fetchShippingCosts()]);
  if (session.value) {
    step.value = 2;
    await fetchAddresses();
  }
});

const selectSavedAddress = (addr: any) => {
    selectedAddressId.value = addr.id;
    shippingData.value = { 
        ...shippingData.value,
        address: addr.address,
        city: addr.city,
        province_id: addr.province_id,
        zip: addr.zip,
        phone: addr.phone
    };
};

const getProvinceName = (provinceId: number | null) => {
  if (!provinceId) return '';
  const province = provinces.value.find(p => p.id === provinceId);
  return province ? province.name : '';
};

const useNewAddress = () => {
    selectedAddressId.value = null;
    shippingData.value = {
        address: '',
        city: '',
        province_id: null,
        zip: '',
        phone: '',
        comments: shippingData.value.comments
    };
};

const createPreference = async () => {
    isPreferenceLoading.value = true;
    try {
        const res = await fetch('/api/checkout/preference', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: items.value.map(i => ({
                    product_id: i.id,
                    title: i.title,
                    price: i.price,
                    quantity: i.quantity
                })),
                total: finalTotal.value,
                shippingType: shippingType.value,
                shippingCost: getShippingCost.value,
                shippingAddress: shippingType.value === 'pickup' 
                  ? 'Retiro en sucursal' 
                  : `${shippingData.value.address}, ${shippingData.value.city}, ${getProvinceName(shippingData.value.province_id)} (CP: ${shippingData.value.zip})`,
                phone: shippingData.value.phone,
                comments: shippingData.value.comments
            })
        });

        if (res.ok) {
            const data = await res.json();
            preferenceId.value = data.preferenceId;
            initMPButton(data.preferenceId);
        }
    } catch (e) {
        console.error('Error creating preference', e);
    } finally {
        isPreferenceLoading.value = false;
    }
};

const initMPButton = (prefId: string) => {
    // @ts-ignore
    const mp = new window.MercadoPago(mpPublicKey.value, {
        locale: 'es-AR'
    });
    const bricksBuilder = mp.bricks();

    const renderComponent = async () => {
        if (window.checkoutButton) window.checkoutButton.unmount();
        // @ts-ignore
        window.checkoutButton = await bricksBuilder.create('wallet', 'wallet_container', {
            initialization: {
                preferenceId: prefId,
                redirectMode: 'modal'
            },
            customization: {
                texts: {
                    valueProp: 'smart_option',
                },
                visual: {
                    buttonBackground: 'default',
                    borderRadius: '16px',
                }
            },
        });
    };
    renderComponent();
};

const handleShippingSubmit = async () => {
  if (shippingType.value === 'delivery') {
    if (!shippingData.value.address || !shippingData.value.city || !shippingData.value.province_id || !shippingData.value.phone) {
      alert('Por favor completa los campos obligatorios');
      return;
    }
  } else {
    if (!shippingData.value.phone) {
      alert('Por favor ingresa un teléfono de contacto');
      return;
    }
  }

  // If logged in and using delivery, save/update this address if it's new
  if (session.value && !selectedAddressId.value && shippingType.value === 'delivery') {
    try {
        await fetch('/api/shipping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...shippingData.value,
                is_default: addresses.value.length === 0
            })
        });
    } catch (e) {
        console.error('Error saving shipping address', e);
    }
  }

  step.value = 3;
  createPreference();
};

const goToLogin = () => {
  window.location.href = `/login?redirect=/checkout`;
};

const goToRegister = () => {
  window.location.href = `/register?redirect=/checkout`;
};

// Re-generate preference if cart changes while on the last step
watch([items, total], () => {
    if (step.value === 3) {
        createPreference();
    }
}, { deep: true });
</script>

<template>
  <div v-if="isMounted" class="container-custom py-20">
    <div v-if="count === 0" class="text-center py-20 flex flex-col items-center gap-6">
      <h1 class="text-4xl font-black text-secondary uppercase italic">Tu carrito está vacío</h1>
      <a href="/catalog" class="btn-primary py-4 px-12 rounded-2xl">Volver al catálogo</a>
    </div>

    <!-- Purchases disabled banner -->
    <div v-else-if="!purchasesEnabled" class="text-center py-20 flex flex-col items-center gap-6">
      <div class="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-500"><circle cx="12" cy="12" r="10"/><line x1="4.93" x2="19.07" y1="4.93" y2="19.07"/></svg>
      </div>
      <h1 class="text-4xl font-black text-secondary uppercase italic">Compras no disponibles</h1>
      <p class="text-secondary/60 font-bold max-w-md">En este momento no es posible realizar compras. Por favor, intentá más tarde o contactanos por WhatsApp.</p>
      <a href="/catalog" class="btn-primary py-4 px-12 rounded-2xl">Volver al catálogo</a>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-12">
      <!-- Checkout Steps -->
      <div class="lg:col-span-8">
        <div class="flex flex-col gap-12">
          
          <!-- Step 1: Identity -->
          <div 
            class="transition-all duration-500" 
            :class="[step === 1 ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none']"
          >
            <div class="flex items-center gap-4 mb-8">
              <span class="w-10 h-10 bg-secondary text-white rounded-full flex items-center justify-center font-black italic">1</span>
              <h2 class="text-3xl font-black text-secondary tracking-tighter uppercase italic">Identificación</h2>
            </div>

            <div v-if="!session" class="bg-white rounded-3xl p-10 border border-secondary/5 shadow-xl">
              <p class="text-secondary/60 font-bold mb-8">Para continuar con la compra, necesitas estar registrado. ¡No perderás los productos de tu carrito!</p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button @click="goToLogin" class="btn-primary py-4 rounded-xl font-black uppercase tracking-widest text-sm">Ya tengo cuenta</button>
                <button @click="goToRegister" class="border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all py-4 rounded-xl font-black uppercase tracking-widest text-sm">Quiero registrarme</button>
              </div>
            </div>
            <div v-else class="bg-primary/5 rounded-3xl p-6 border border-primary/20 flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <div>
                  <p class="font-black text-secondary">Sesión Iniciada</p>
                  <p class="text-xs font-bold text-secondary/40 uppercase tracking-widest">Listo para continuar</p>
                </div>
              </div>
              <span class="text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              </span>
            </div>
          </div>

          <!-- Step 2: Shipping -->
          <div 
            class="transition-all duration-500" 
            :class="[step === 2 ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none']"
          >
            <div class="flex items-center gap-4 mb-8">
              <span class="w-10 h-10 bg-secondary text-white rounded-full flex items-center justify-center font-black italic">2</span>
              <h2 class="text-3xl font-black text-secondary tracking-tighter uppercase italic">Datos de Envío</h2>
            </div>

            <!-- Saved Addresses Selection -->
            <div v-if="session && addresses.length > 0 && !selectedAddressId" class="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                    v-for="addr in addresses" 
                    :key="addr.id"
                    @click="selectSavedAddress(addr)"
                    class="bg-white p-6 rounded-2xl border border-secondary/5 hover:border-primary/40 transition-all text-left group shadow-sm"
                >
                    <p class="font-black text-secondary group-hover:text-primary transition-colors">{{ addr.address }}</p>
                    <p class="text-xs font-bold text-secondary/40 uppercase">{{ addr.city }}, {{ getProvinceName(addr.province_id) }} {{ addr.zip ? `(CP: ${addr.zip})` : '' }}</p>
                    <span class="mt-2 inline-block text-[8px] font-black uppercase tracking-widest text-primary">Usar esta dirección</span>
                </button>
            </div>

            <form @submit.prevent="handleShippingSubmit" class="bg-white rounded-3xl p-10 border border-secondary/5 shadow-xl grid grid-cols-1 md:grid-cols-2 gap-6 relative">
              <!-- Shipping Type Selection -->
              <div class="md:col-span-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-secondary/40 mb-3 block">Tipo de Envío *</label>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button type="button" @click="shippingType = 'pickup'" :class="['p-5 rounded-2xl border-2 transition-all text-left', shippingType === 'pickup' ? 'border-primary bg-primary/5' : 'border-secondary/10 hover:border-secondary/20']">
                    <div class="flex items-center gap-3 mb-2">
                      <div :class="['w-8 h-8 rounded-full flex items-center justify-center', shippingType === 'pickup' ? 'bg-primary text-white' : 'bg-secondary/10 text-secondary/40']">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/><path d="M12 3v6"/></svg>
                      </div>
                      <span :class="['font-black', shippingType === 'pickup' ? 'text-primary' : 'text-secondary']">Retiro en Sucursal</span>
                    </div>
                    <p class="text-xs text-secondary/50 font-medium">Sin costo adicional</p>
                  </button>
                  <button type="button" @click="shippingType = 'delivery'" :class="['p-5 rounded-2xl border-2 transition-all text-left', shippingType === 'delivery' ? 'border-primary bg-primary/5' : 'border-secondary/10 hover:border-secondary/20']">
                    <div class="flex items-center gap-3 mb-2">
                      <div :class="['w-8 h-8 rounded-full flex items-center justify-center', shippingType === 'delivery' ? 'bg-primary text-white' : 'bg-secondary/10 text-secondary/40']">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
                      </div>
                      <span :class="['font-black', shippingType === 'delivery' ? 'text-primary' : 'text-secondary']">Envío a Domicilio</span>
                    </div>
                    <p class="text-xs text-secondary/50 font-medium">Costo según provincia</p>
                  </button>
                </div>
              </div>

              <!-- Pickup Info -->
              <div v-if="shippingType === 'pickup'" class="md:col-span-2 bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
                <div class="flex items-start gap-4">
                  <div class="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-600"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                  </div>
                  <div>
                    <p class="font-black text-emerald-800 mb-1">Retirá tu pedido en nuestra sucursal</p>
                    <p class="text-sm text-emerald-700">Te notificaremos cuando tu pedido esté listo para retirar.</p>
                  </div>
                </div>
              </div>

              <!-- Pickup: Only phone required -->
              <div v-if="shippingType === 'pickup'" class="flex flex-col gap-2 md:col-span-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-secondary/40">Teléfono de contacto *</label>
                <input v-model="shippingData.phone" type="tel" required class="w-full bg-accent/30 border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-primary outline-none font-bold" placeholder="3816556677" />
              </div>

              <!-- Delivery: Full address form -->
              <template v-if="shippingType === 'delivery'">
                <div v-if="selectedAddressId" class="md:col-span-2 bg-primary/5 p-4 rounded-xl flex items-center justify-between mb-2">
                 <div class="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                    <p class="text-xs font-bold text-primary uppercase">Usando dirección guardada</p>
                 </div>
                 <button @click="useNewAddress" type="button" class="text-[10px] font-black uppercase text-secondary/40 hover:text-primary transition-colors">Usar otra</button>
              </div>

              <div class="flex flex-col gap-2 md:col-span-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-secondary/40">Dirección Completa *</label>
                <input v-model="shippingData.address" type="text" required class="w-full bg-accent/30 border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-primary outline-none font-bold" placeholder="Av. Siempre Viva 742" />
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-secondary/40">Ciudad *</label>
                <input v-model="shippingData.city" type="text" required class="w-full bg-accent/30 border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-primary outline-none font-bold" placeholder="Tucumán" />
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-secondary/40">Provincia *</label>
                <select v-model="shippingData.province_id" required class="w-full bg-accent/30 border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-primary outline-none font-bold">
                  <option :value="null" disabled>Seleccionar provincia</option>
                  <option v-for="province in provinces" :key="province.id" :value="province.id">{{ province.name }}</option>
                </select>
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-secondary/40">Código Postal *</label>
                <input v-model="shippingData.zip" type="text" required class="w-full bg-accent/30 border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-primary outline-none font-bold" placeholder="4000" />
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-secondary/40">Teléfono de contacto *</label>
                <input v-model="shippingData.phone" type="tel" required class="w-full bg-accent/30 border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-primary outline-none font-bold" placeholder="3816556677" />
              </div>
              <div class="flex flex-col gap-2 md:col-span-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-secondary/40">Comentarios Adicionales</label>
                <textarea v-model="shippingData.comments" class="w-full bg-accent/30 border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-primary outline-none font-bold h-32" placeholder="Indicaciones para el repartidor..."></textarea>
              </div>
            </template>
            <div class="md:col-span-2 pt-4">
              <button type="submit" class="btn-primary w-full py-5 rounded-2xl font-black uppercase tracking-widest">Continuar al Pago</button>
            </div>
          </form>
          </div>

          <!-- Step 3: Payment -->
          <div 
            class="transition-all duration-500" 
            :class="[step === 3 ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none']"
          >
            <div class="flex items-center gap-4 mb-8">
              <span class="w-10 h-10 bg-secondary text-white rounded-full flex items-center justify-center font-black italic">3</span>
              <h2 class="text-3xl font-black text-secondary tracking-tighter uppercase italic">Pago</h2>
            </div>

            <div class="bg-white rounded-3xl p-10 border border-secondary/5 shadow-xl flex flex-col items-center justify-center text-center gap-6 relative overflow-hidden">
              <div v-if="isSandbox" class="absolute top-0 right-0 bg-amber-500 text-white text-[8px] font-black uppercase tracking-widest px-6 py-1 rotate-45 translate-x-4 translate-y-2 shadow-lg">
                Modo Sandbox
              </div>
              <div class="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
              </div>
              <h3 class="text-2xl font-black text-secondary tracking-tighter uppercase italic">Mercado Pago</h3>
              <p class="text-secondary/60 font-bold max-w-sm">Haz click en el botón de abajo para finalizar tu compra de forma segura con Mercado Pago.</p>
              
              <div id="wallet_container" class="w-full min-h-[48px]">
                <div v-if="isPreferenceLoading" class="w-full h-12 bg-secondary/10 animate-pulse rounded-2xl flex items-center justify-center font-bold text-secondary/30 uppercase tracking-widest text-xs">
                    Generando botón de pago...
                </div>
              </div>

              <button @click="step = 2" class="text-xs font-bold uppercase text-secondary/40 hover:text-primary transition-colors underline mt-4">Volver a datos de envío</button>
            </div>
          </div>

        </div>
      </div>

      <!-- Order Summary Sidebar -->
      <div class="lg:col-span-4 sticky top-32">
        <div class="bg-accent/30 rounded-[40px] p-8 border border-secondary/5">
          <h2 class="text-2xl font-black text-secondary tracking-tighter uppercase italic mb-8 border-b border-secondary/5 pb-4">Tu Pedido</h2>
          
          <ul class="flex flex-col gap-6 mb-8 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
            <li v-for="item in items" :key="item.id" class="flex gap-4 items-center">
              <div class="w-16 h-16 shrink-0 overflow-hidden rounded-xl border border-secondary/5 bg-white">
                <img :src="item.image" :alt="item.title" class="w-full h-full object-cover" />
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="font-black text-secondary text-sm truncate">{{ item.title }}</h4>
                <p class="text-[10px] font-bold text-secondary/40 uppercase tracking-widest">Cant: {{ item.quantity }}</p>
              </div>
              <span class="font-black text-secondary text-sm tabular-nums">{{ formatMoney(item.price * item.quantity, 0, '$') }}</span>
            </li>
          </ul>

          <div class="flex flex-col gap-4 border-t border-secondary/5 pt-8">
            <div class="flex justify-between items-center text-secondary/40 font-bold uppercase tracking-widest text-[10px]">
              <span>Subtotal</span>
              <span class="text-secondary text-sm tabular-nums">{{ formatMoney(total, 0, '$') }}</span>
            </div>
            <div v-if="step > 1" class="flex justify-between items-center text-secondary/40 font-bold uppercase tracking-widest text-[10px]">
              <span>Envío</span>
              <span class="text-secondary text-sm tabular-nums">
                {{ shippingType === 'pickup' ? 'Gratis' : (getShippingCost > 0 ? formatMoney(getShippingCost, 0, '$') : 'Seleccionar provincia') }}
              </span>
            </div>
            <div class="flex justify-between items-center pt-4">
              <span class="font-black text-xl text-secondary tracking-tighter uppercase italic">Total</span>
              <span class="text-3xl font-black text-primary tracking-tighter tabular-nums">{{ formatMoney(finalTotal, 0, '$') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>