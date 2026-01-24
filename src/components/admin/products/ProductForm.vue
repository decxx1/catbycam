<script setup lang="ts">
import { ref } from 'vue';
import type { Product } from '@/services/productService';
import type { Category } from '@/services/categoryService';
import { toast } from '@/utils/toast';

const props = defineProps<{
  initialData?: Product;
  categories: Category[];
}>();

const emit = defineEmits(['save', 'cancel']);

const formRef = ref<HTMLFormElement | null>(null);
const isUploading = ref(false);

const product = ref<Product>(props.initialData ? { ...props.initialData } : {
  title: '',
  description: '',
  price: 0,
  stock: 1,
  status: 'active',
  item_condition: 'new',
  category_id: null,
  main_image: '',
  images: []
});

const extraImages = ref<string[]>(props.initialData?.images || []);

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

        const res = await fetch('/api/admin/upload', {
            method: 'POST',
            body: formData
        });

        if (!res.ok) throw new Error();

        const data = await res.json();
        const url = data.url;

        if (isMain) {
            product.value.main_image = url;
        } else if (index !== undefined) {
            extraImages.value[index] = url;
        } else {
            extraImages.value.push(url);
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

const handleSubmit = () => {
  if (formRef.value?.reportValidity()) {
    if (!product.value.main_image) {
        toast.error('La foto de portada es obligatoria');
        return;
    }
    product.value.images = extraImages.value.filter(img => img.trim() !== '');
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

        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
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
                    <img v-if="extraImages[index]" :src="extraImages[index]" class="absolute inset-0 w-full h-full object-cover" />
                    <button v-if="extraImages[index]" @click.prevent="removeExtraImage(index)" class="absolute top-2 right-2 w-6 h-6 bg-primary text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                    <label v-if="!extraImages[index]" class="w-full h-full cursor-pointer flex items-center justify-center">
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
        class="flex-grow bg-primary hover:bg-secondary text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-primary/20 disabled:opacity-50 disabled:cursor-wait"
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

