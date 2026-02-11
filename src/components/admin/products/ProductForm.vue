<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import type { Product, ProductImage } from '@/services/productService';
import type { Category } from '@/services/categoryService';
import { toast } from '@/utils/toast';

const props = defineProps<{
  initialData?: Product;
  categories: Category[];
}>();

const emit = defineEmits(['save', 'cancel']);

const formRef = ref<HTMLFormElement | null>(null);
const isUploading = ref(false);

const dollarVenta = ref<number | null>(null);
const dollarType = ref('oficial');

const product = ref<Product>(props.initialData ? { ...props.initialData } : {
  title: '',
  description: '',
  price: 0,
  dollar_enabled: false,
  dollar_price: null,
  stock: 1,
  status: 'active',
  item_condition: 'new',
  category_id: null,
  main_image: '',
  main_image_full: '',
  main_image_width: 0,
  main_image_height: 0,
  images: []
});

const convertedPrice = computed(() => {
  if (product.value.dollar_enabled && product.value.dollar_price && dollarVenta.value) {
    return Math.round(product.value.dollar_price * dollarVenta.value * 100) / 100;
  }
  return null;
});

watch(convertedPrice, (val) => {
  if (val !== null) {
    product.value.price = val;
  }
});

const fetchDollarRate = async () => {
  try {
    const res = await fetch('/api/admin/dollar-rates');
    if (res.ok) {
      const data = await res.json();
      dollarType.value = data.dollar_type;
      if (data.selected_rate) {
        dollarVenta.value = data.selected_rate.venta;
      }
    }
  } catch (e) {
    console.error('Error fetching dollar rate:', e);
  }
};

// Extraer solo las URLs de thumbnail para mostrar en el formulario
const extraImages = ref<ProductImage[]>(props.initialData?.images || []);

const handleFileUpload = async (event: Event, isMain: boolean, index?: number) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    // Validate size (e.g., 5MB)
    if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen es demasiado grande (máx 5MB)');
        return;
    }

    isUploading.value = true;
    try {
        const formData = new FormData();
        formData.append('image', file);
        
        // Si estamos editando un producto existente, pasar el ID para guardar en su carpeta
        if (product.value.id) {
            formData.append('productId', String(product.value.id));
        }

        const res = await fetch('/api/admin/upload', {
            method: 'POST',
            body: formData
        });

        if (!res.ok) throw new Error();

        const data = await res.json();
        // El endpoint ahora devuelve: { url, urlFull, width, height }

        if (isMain) {
            product.value.main_image = data.url;
            product.value.main_image_full = data.urlFull;
            product.value.main_image_width = data.width;
            product.value.main_image_height = data.height;
        } else if (index !== undefined) {
            extraImages.value[index] = {
                url: data.url,
                urlFull: data.urlFull,
                width: data.width,
                height: data.height
            };
        } else {
            extraImages.value.push({
                url: data.url,
                urlFull: data.urlFull,
                width: data.width,
                height: data.height
            });
        }
        toast.success('Imagen subida correctamente');
    } catch (e) {
        toast.error('Error al subir la imagen');
    } finally {
        isUploading.value = false;
        target.value = ''; // Reset input
    }
};

const removeExtraImage = (index: number) => {
  extraImages.value.splice(index, 1);
};

onMounted(fetchDollarRate);

const handleSubmit = () => {
  if (formRef.value?.reportValidity()) {
    if (!product.value.main_image) {
        toast.error('La foto de portada es obligatoria');
        return;
    }
    product.value.images = extraImages.value.filter(img => img.url && img.url.trim() !== '');
    emit('save', { ...product.value });
  }
};
</script>

<template>
  <form ref="formRef" @submit.prevent="handleSubmit" class="space-y-8">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <!-- Info Section -->
      <div class="space-y-6">
        <h4 class="text-lg font-bold border-b border-secondary/5 pb-2">Información Básica</h4>
        
        <div class="flex flex-col gap-2">
          <label class="text-[10px] uppercase font-bold tracking-widest text-secondary/40 ml-1">Título del Producto</label>
          <input 
            v-model="product.title"
            type="text" 
            required 
            maxlength="100"
            placeholder="Ej: Excavadora Michigan Clark 150"
            class="w-full bg-accent/50 border border-secondary/10 rounded-xl px-5 py-4 focus:outline-none focus:border-primary/40 focus:bg-white transition-all font-bold"
          />
        </div>

        <!-- Dollar Toggle -->
        <div class="flex items-center gap-3 p-4 rounded-xl border-2 transition-all" :class="product.dollar_enabled ? 'border-green-500/30 bg-green-50/50' : 'border-secondary/10 bg-accent/30'">
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" v-model="product.dollar_enabled" class="sr-only peer" />
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
          </label>
          <div>
            <span class="text-sm font-bold" :class="product.dollar_enabled ? 'text-green-700' : 'text-secondary/50'">Precio en dólares</span>
            <p v-if="dollarVenta" class="text-[10px] text-secondary/40">Dólar {{ dollarType }} venta: ${{ dollarVenta.toLocaleString('es-AR') }}</p>
          </div>
        </div>

        <!-- Dollar Price Fields -->
        <div v-if="product.dollar_enabled" class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-[10px] uppercase font-bold tracking-widest text-green-600 ml-1">Precio (USD)</label>
            <div class="relative">
                <span class="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-green-500">U$D</span>
                <input 
                    v-model.number="product.dollar_price"
                    type="number" 
                    required 
                    min="0"
                    step="0.01"
                    class="w-full bg-green-50 border border-green-200 rounded-xl pl-14 pr-5 py-4 focus:outline-none focus:border-green-400 focus:bg-white transition-all font-bold"
                />
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-[10px] uppercase font-bold tracking-widest text-secondary/40 ml-1">Precio (ARS) - Calculado</label>
            <div class="relative">
                <span class="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-secondary/40">$</span>
                <input 
                    :value="convertedPrice ?? product.price"
                    type="number" 
                    disabled
                    class="w-full bg-gray-100 border border-secondary/10 rounded-xl pl-10 pr-5 py-4 font-bold text-secondary/60 cursor-not-allowed"
                />
            </div>
            <p v-if="!dollarVenta" class="text-[10px] text-red-500 font-medium">No hay cotización disponible. El precio no se calculará.</p>
          </div>
        </div>

        <!-- Regular Price + Stock -->
        <div class="grid grid-cols-2 gap-4">
          <div v-if="!product.dollar_enabled" class="flex flex-col gap-2">
            <label class="text-[10px] uppercase font-bold tracking-widest text-secondary/40 ml-1">Precio (ARS)</label>
            <div class="relative">
                <span class="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-secondary/40">$</span>
                <input 
                    v-model.number="product.price"
                    type="number" 
                    required 
                    min="0"
                    step="1"
                    class="w-full bg-accent/50 border border-secondary/10 rounded-xl pl-10 pr-5 py-4 focus:outline-none focus:border-primary/40 focus:bg-white transition-all font-bold"
                />
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-[10px] uppercase font-bold tracking-widest text-secondary/40 ml-1">Stock</label>
            <input 
              v-model.number="product.stock"
              type="number" 
              required 
              min="0"
              class="w-full bg-accent/50 border border-secondary/10 rounded-xl px-5 py-4 focus:outline-none focus:border-primary/40 focus:bg-white transition-all font-bold"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-[10px] uppercase font-bold tracking-widest text-secondary/40 ml-1">Condición</label>
            <select 
              v-model="product.item_condition"
              class="w-full bg-accent/50 border border-secondary/10 rounded-xl px-5 py-4 focus:outline-none focus:border-primary/40 focus:bg-white transition-all font-bold appearance-none"
            >
              <option value="new">Nuevo</option>
              <option value="used">Usado</option>
              <option value="not_specified">No especificado</option>
            </select>
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-[10px] uppercase font-bold tracking-widest text-secondary/40 ml-1">Categoría</label>
            <select 
              v-model="product.category_id"
              required
              class="w-full bg-accent/50 border border-secondary/10 rounded-xl px-5 py-4 focus:outline-none focus:border-primary/40 focus:bg-white transition-all font-bold appearance-none"
            >
              <option :value="null" disabled>Seleccionar...</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-[10px] uppercase font-bold tracking-widest text-secondary/40 ml-1">Estado del Producto</label>
          <div class="grid grid-cols-4 gap-2">
            <label 
              v-for="option in [
                { value: 'active', label: 'Activo', color: 'bg-green-500' },
                { value: 'inactive', label: 'Inactivo', color: 'bg-gray-400' },
                { value: 'out_of_stock', label: 'Agotado', color: 'bg-red-500' },
                { value: 'paused', label: 'Pausado', color: 'bg-amber-500' }
              ]"
              :key="option.value"
              :class="[
                'flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all',
                product.status === option.value 
                  ? 'border-primary bg-primary/5' 
                  : 'border-secondary/10 hover:border-secondary/20'
              ]"
            >
              <input 
                type="radio" 
                v-model="product.status" 
                :value="option.value" 
                class="hidden"
              />
              <span :class="['w-3 h-3 rounded-full', option.color]"></span>
              <span class="text-xs font-bold">{{ option.label }}</span>
            </label>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-[10px] uppercase font-bold tracking-widest text-secondary/40 ml-1">Descripción</label>
          <textarea 
            v-model="product.description"
            rows="5"
            required
            class="w-full bg-accent/50 border border-secondary/10 rounded-xl px-5 py-4 focus:outline-none focus:border-primary/40 focus:bg-white transition-all font-medium text-sm"
          ></textarea>
        </div>
      </div>

      <!-- Images Section -->
      <div class="space-y-6">
        <h4 class="text-lg font-bold border-b border-secondary/5 pb-2">Multimedia</h4>
        
        <div class="flex flex-col gap-3">
          <label class="text-[10px] uppercase font-bold tracking-widest text-secondary/40 ml-1">Foto de Portada (Obligatoria)</label>
          <label class="relative group cursor-pointer aspect-video rounded-3xl overflow-hidden bg-accent border-2 border-dashed border-secondary/10 hover:border-primary/40 transition-all flex flex-col items-center justify-center gap-2">
             <img v-if="product.main_image" :src="product.main_image" class="absolute inset-0 w-full h-full object-cover" />
             <div v-if="product.main_image" class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span class="text-white font-black text-xs uppercase tracking-widest">Cambiar Portada</span>
             </div>
             <template v-if="!product.main_image">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-secondary/20"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                <span class="text-[10px] font-black uppercase text-secondary/30">Subir Portada</span>
             </template>
             <input type="file" accept="image/*" class="hidden" @change="handleFileUpload($event, true)" :disabled="isUploading" />
          </label>
        </div>

        <div class="grid grid-cols-3 gap-4">
            <template v-for="(img, index) in 6" :key="index">
                <div class="relative group aspect-square rounded-2xl overflow-hidden bg-accent border-2 border-dashed border-secondary/10 hover:border-primary/20 transition-all flex items-center justify-center">
                    <img v-if="extraImages[index]?.url" :src="extraImages[index].url" class="absolute inset-0 w-full h-full object-cover" />
                    <button v-if="extraImages[index]?.url" @click.prevent="removeExtraImage(index)" class="absolute top-2 right-2 w-6 h-6 bg-primary text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                    <label v-if="!extraImages[index]?.url" class="w-full h-full cursor-pointer flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" class="text-secondary/20"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                        <input type="file" accept="image/*" class="hidden" @change="handleFileUpload($event, false, index)" :disabled="isUploading" />
                    </label>
                </div>
            </template>
        </div>
        <p class="text-[10px] text-center text-secondary/30 font-bold uppercase tracking-widest mt-4">Hasta 6 fotos adicionales</p>
      </div>
    </div>

    <div class="flex items-center gap-4 pt-8 border-t border-secondary/5">
      <button 
        type="submit" 
        :disabled="isUploading"
        class="grow bg-primary hover:bg-secondary text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-primary/20 disabled:opacity-50 disabled:cursor-wait"
      >
        <span v-if="isUploading">Subiendo imágenes...</span>
        <span v-else>{{ initialData ? 'Actualizar Producto' : 'Crear Producto' }}</span>
      </button>
      <button 
        type="button"
        @click="emit('cancel')"
        class="px-12 py-4 text-secondary/40 font-bold uppercase tracking-widest text-xs hover:text-secondary transition-colors"
      >
        Cancelar
      </button>
    </div>
  </form>
</template>

