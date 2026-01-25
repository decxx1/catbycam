<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { toast } from '@/utils/toast';

const addresses = ref<any[]>([]);
const isLoading = ref(true);
const isEditing = ref(false);
const currentAddress = ref({
  address: '',
  city: '',
  state: '',
  zip: '',
  phone: '',
  is_default: false
});

const fetchAddresses = async () => {
  try {
    const res = await fetch('/api/shipping');
    if (res.ok) {
      addresses.value = await res.json();
    }
  } catch (e) {
    console.error(e);
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchAddresses);

const saveAddress = async () => {
    // Basic validation
    if (!currentAddress.value.address || !currentAddress.value.city || !currentAddress.value.state || !currentAddress.value.phone) {
        toast.error('Completá los campos obligatorios');
        return;
    }

    const method = (currentAddress.value as any).id ? 'PUT' : 'POST';
    try {
        const res = await fetch('/api/shipping', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentAddress.value)
        });
        if (res.ok) {
            toast.success('Dirección guardada correctamente');
            isEditing.value = false;
            fetchAddresses();
        }
    } catch (e) {
        toast.error('Error al guardar la dirección');
    }
};

const editAddress = (addr: any) => {
    currentAddress.value = { ...addr };
    isEditing.value = true;
};

const deleteAddress = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta dirección?')) return;
    try {
        const res = await fetch('/api/shipping', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        if (res.ok) {
            toast.success('Dirección eliminada');
            fetchAddresses();
        }
    } catch (e) {
        toast.error('Error al eliminar');
    }
};

const addNew = () => {
    currentAddress.value = {
        address: '',
        city: '',
        state: '',
        zip: '',
        phone: '',
        is_default: addresses.value.length === 0
    };
    isEditing.value = true;
};
</script>

<template>
  <div class="mt-8 bg-white p-8 rounded-3xl border border-secondary/5 shadow-xl shadow-secondary/5 text-left">
    <div class="flex items-center justify-between mb-8 pb-4 border-b border-secondary/5">
      <h3 class="font-bold text-lg">Direcciones de Envío</h3>
      <button v-if="!isEditing" @click="addNew" class="text-primary font-bold text-xs uppercase tracking-widest hover:underline cursor-pointer">
        Agregar Nueva
      </button>
    </div>

    <div v-if="isEditing" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="flex flex-col gap-2 md:col-span-2">
                <label class="text-[10px] uppercase font-bold tracking-widest text-secondary/40">Dirección *</label>
                <input v-model="currentAddress.address" class="bg-accent/50 border border-secondary/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/40 focus:bg-white transition-all font-bold" placeholder="Calle y número" />
            </div>
            <div class="flex flex-col gap-2">
                <label class="text-[10px] uppercase font-bold tracking-widest text-secondary/40">Ciudad *</label>
                <input v-model="currentAddress.city" class="bg-accent/50 border border-secondary/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/40 focus:bg-white transition-all font-bold" placeholder="Ciudad" />
            </div>
            <div class="flex flex-col gap-2">
                <label class="text-[10px] uppercase font-bold tracking-widest text-secondary/40">Provincia *</label>
                <input v-model="currentAddress.state" class="bg-accent/50 border border-secondary/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/40 focus:bg-white transition-all font-bold" placeholder="Provincia" />
            </div>
             <div class="flex flex-col gap-2">
                <label class="text-[10px] uppercase font-bold tracking-widest text-secondary/40">Código Postal</label>
                <input v-model="currentAddress.zip" class="bg-accent/50 border border-secondary/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/40 focus:bg-white transition-all font-bold" placeholder="CP" />
            </div>
            <div class="flex flex-col gap-2">
                <label class="text-[10px] uppercase font-bold tracking-widest text-secondary/40">Teléfono *</label>
                <input v-model="currentAddress.phone" class="bg-accent/50 border border-secondary/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/40 focus:bg-white transition-all font-bold" placeholder="Teléfono" />
            </div>
            <div class="md:col-span-2 flex items-center gap-3 bg-accent/30 p-4 rounded-xl">
                <input type="checkbox" v-model="currentAddress.is_default" id="is_default" class="w-5 h-5 accent-primary" />
                <label for="is_default" class="text-xs font-bold text-secondary/60 cursor-pointer">Establecer como dirección predeterminada</label>
            </div>
        </div>
        <div class="flex flex-col sm:flex-row gap-4 pt-4">
            <button @click="saveAddress" class="btn-primary flex-1 py-4 text-sm uppercase tracking-widest">Guardar Dirección</button>
            <button @click="isEditing = false" class="bg-secondary/10 hover:bg-secondary/20 text-secondary font-bold py-4 px-8 rounded-xl transition-all text-sm uppercase tracking-widest">Cancelar</button>
        </div>
    </div>

    <div v-else class="space-y-4">
        <div v-if="isLoading" class="py-12 text-center text-secondary/30 font-bold uppercase tracking-widest text-xs animate-pulse">
            Cargando direcciones...
        </div>
        <div v-else-if="addresses.length === 0" class="bg-accent/30 rounded-[2rem] py-12 text-center text-secondary/30 border border-secondary/5 border-dashed">
            <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-20"><path d="m2 22 1-1h3l9-9"/><path d="M20 21v-2a4 4 0 0 0-3-3.87"/><path d="M4 3.13V3c0-.55.45-1 1-1h2c.55 0 1 .45 1 1v1.13c0 .5-.35.93-.84 1.05L5.73 6.13a1 1 0 0 0-.63.63L4.13 8.19c-.12.49-.55.84-1.05.84H2c-.55 0-1-.45-1-1v-2c0-.55.45-1 1-1h1.13c.5 0 .93.35 1.05.84Z"/><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
            </div>
            <p class="text-xs font-bold uppercase tracking-widest">No tenés direcciones guardadas</p>
        </div>
        <div v-for="addr in addresses" :key="addr.id" class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 bg-accent/20 rounded-2xl border border-secondary/5 hover:border-primary/20 transition-all group gap-4">
            <div class="flex flex-col gap-1">
                <div class="flex items-center gap-2 flex-wrap">
                    <p class="font-black text-secondary">{{ addr.address }}</p>
                    <span v-if="addr.is_default" class="bg-primary text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shadow-lg shadow-primary/20">Predeterminada</span>
                </div>
                <p class="text-xs font-bold text-secondary/60">{{ addr.city }}, {{ addr.state }} {{ addr.zip ? `(${addr.zip})` : '' }}</p>
                <p class="text-xs font-bold text-secondary/40">Tel: {{ addr.phone }}</p>
            </div>
            <div class="flex gap-4 sm:opacity-0 group-hover:opacity-100 transition-opacity w-full sm:w-auto justify-end border-t sm:border-none pt-4 sm:pt-0">
                <button @click="editAddress(addr)" class="p-2 bg-white rounded-lg shadow-sm text-primary hover:bg-primary hover:text-white transition-all cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                </button>
                <button @click="deleteAddress(addr.id)" class="p-2 bg-white rounded-lg shadow-sm text-secondary/30 hover:bg-primary hover:text-white transition-all cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                </button>
            </div>
        </div>
    </div>
  </div>
</template>
