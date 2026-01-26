<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { toast } from '@/utils/toast';
import { formatMoney } from '@/utils/formatters';
import Modal from '@/components/common/Modal.vue';
import type { Category } from '@/services/categoryService';

interface SimpleProduct {
  id: number;
  title: string;
  price: number;
  stock: number;
  status: string;
  category_id: number | null;
  category_name?: string;
}

interface PricePreview {
  id: number;
  title: string;
  oldPrice: number;
  newPrice: number;
}

const products = ref<SimpleProduct[]>([]);
const categories = ref<Category[]>([]);
const isLoading = ref(false);
const searchQuery = ref('');
const selectedCategory = ref('');

const bulkPercentage = ref<number>(10);
const bulkCategoryId = ref<string>('');
const isBulkUpdating = ref(false);
const showPreviewModal = ref(false);
const pricePreview = ref<PricePreview[]>([]);

const editingCell = ref<{ id: number; field: string } | null>(null);
const editValue = ref<string | number>('');

const filteredProducts = computed(() => {
  let result = products.value;
  
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(p => p.title.toLowerCase().includes(q));
  }
  
  if (selectedCategory.value) {
    result = result.filter(p => p.category_id === Number(selectedCategory.value));
  }
  
  return result;
});

const fetchProducts = async () => {
  isLoading.value = true;
  try {
    const res = await fetch('/api/admin/products/quick-update');
    if (res.ok) {
      products.value = await res.json();
    }
  } catch (e) {
    toast.error('Error al cargar productos');
  } finally {
    isLoading.value = false;
  }
};

const fetchCategories = async () => {
  try {
    const res = await fetch('/api/admin/categories');
    if (res.ok) {
      categories.value = await res.json();
    }
  } catch (e) {
    console.error(e);
  }
};

const startEdit = (product: SimpleProduct, field: string) => {
  editingCell.value = { id: product.id, field };
  editValue.value = (product as any)[field];
};

const cancelEdit = () => {
  editingCell.value = null;
  editValue.value = '';
};

const saveEdit = async (product: SimpleProduct) => {
  if (!editingCell.value) return;
  
  const { field } = editingCell.value;
  let value: any = editValue.value;
  
  if (field === 'price' || field === 'stock') {
    value = Number(value);
    if (isNaN(value) || value < 0) {
      toast.error('Valor inválido');
      return;
    }
  }
  
  try {
    const res = await fetch('/api/admin/products/quick-update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: product.id, [field]: value })
    });
    
    if (res.ok) {
      (product as any)[field] = value;
      toast.success('Actualizado');
    } else {
      throw new Error();
    }
  } catch (e) {
    toast.error('Error al actualizar');
  } finally {
    cancelEdit();
  }
};

const toggleStatus = async (product: SimpleProduct) => {
  const newStatus = product.status === 'active' ? 'inactive' : 'active';
  
  try {
    const res = await fetch('/api/admin/products/quick-update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: product.id, status: newStatus })
    });
    
    if (res.ok) {
      product.status = newStatus;
      toast.success(newStatus === 'active' ? 'Producto activado' : 'Producto desactivado');
    }
  } catch (e) {
    toast.error('Error al cambiar estado');
  }
};

const previewBulkPriceChange = () => {
  if (!bulkPercentage.value || bulkPercentage.value === 0) {
    toast.error('Ingresa un porcentaje válido');
    return;
  }
  
  const multiplier = 1 + (bulkPercentage.value / 100);
  const categoryFilter = bulkCategoryId.value ? Number(bulkCategoryId.value) : null;
  
  const affectedProducts = products.value.filter(p => 
    categoryFilter === null || p.category_id === categoryFilter
  );
  
  if (affectedProducts.length === 0) {
    toast.error('No hay productos que coincidan con el filtro');
    return;
  }
  
  pricePreview.value = affectedProducts.map(p => ({
    id: p.id,
    title: p.title,
    oldPrice: p.price,
    newPrice: Math.round(p.price * multiplier * 100) / 100
  }));
  
  showPreviewModal.value = true;
};

const confirmBulkPriceChange = async () => {
  isBulkUpdating.value = true;
  try {
    const res = await fetch('/api/admin/products/bulk-prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        percentage: bulkPercentage.value,
        categoryId: bulkCategoryId.value || null
      })
    });
    
    const data = await res.json();
    
    if (res.ok) {
      toast.success(data.message);
      showPreviewModal.value = false;
      fetchProducts();
    } else {
      throw new Error(data.error);
    }
  } catch (e: any) {
    toast.error(e.message || 'Error al actualizar precios');
  } finally {
    isBulkUpdating.value = false;
  }
};

onMounted(() => {
  fetchProducts();
  fetchCategories();
});
</script>

<template>
  <div class="space-y-8">
    <!-- Bulk Price Update -->
    <div class="bg-white p-6 rounded-3xl border border-secondary/5 shadow-sm">
      <h2 class="font-black text-secondary mb-4">Actualización Masiva de Precios</h2>
      <div class="flex flex-wrap gap-4 items-end">
        <div class="flex flex-col gap-2">
          <label class="text-[10px] font-black uppercase tracking-widest text-secondary/40">Porcentaje</label>
          <div class="flex items-center gap-2">
            <input 
              v-model.number="bulkPercentage"
              type="number"
              step="1"
              class="w-24 bg-accent/50 border border-secondary/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-primary/40"
              placeholder="10"
            />
            <span class="text-secondary font-bold">%</span>
          </div>
          <p class="text-[10px] text-secondary/40">Usa valores negativos para reducir</p>
        </div>
        
        <div class="flex flex-col gap-2">
          <label class="text-[10px] font-black uppercase tracking-widest text-secondary/40">Categoría (opcional)</label>
          <select 
            v-model="bulkCategoryId"
            class="bg-accent/50 border border-secondary/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-primary/40 min-w-[180px]"
          >
            <option value="">Todos los productos</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>
        
        <button 
          @click="previewBulkPriceChange"
          class="px-6 py-3 bg-primary text-white font-black text-sm rounded-xl hover:bg-secondary transition-all shadow-lg shadow-primary/20 cursor-pointer"
        >
          Previsualizar
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex gap-4">
      <div class="relative grow max-w-md">
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Buscar producto..." 
          class="w-full bg-white border border-secondary/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-primary/40 font-bold"
        />
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="absolute left-4 top-3 text-secondary/30"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      </div>
      <select 
        v-model="selectedCategory"
        class="bg-white border border-secondary/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-primary/40 min-w-[150px]"
      >
        <option value="">Todas las categorías</option>
        <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
      </select>
    </div>

    <!-- Products Table -->
    <div class="bg-white rounded-3xl border border-secondary/5 shadow-sm overflow-hidden">
      <div v-if="isLoading" class="p-12 text-center">
        <div class="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        <p class="text-secondary/40 mt-4 font-bold">Cargando productos...</p>
      </div>
      
      <div v-else-if="filteredProducts.length === 0" class="p-12 text-center">
        <p class="text-secondary/40 font-bold">No se encontraron productos</p>
      </div>
      
      <table v-else class="w-full">
        <thead class="bg-accent/30 border-b border-secondary/10">
          <tr>
            <th class="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/50">Producto</th>
            <th class="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/50">Categoría</th>
            <th class="text-right px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/50">Precio</th>
            <th class="text-right px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/50">Stock</th>
            <th class="text-center px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/50">Estado</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-secondary/5">
          <tr v-for="product in filteredProducts" :key="product.id" class="hover:bg-accent/20 transition-colors">
            <!-- Title -->
            <td class="px-6 py-4">
              <div v-if="editingCell?.id === product.id && editingCell?.field === 'title'" class="flex gap-2">
                <input 
                  v-model="editValue"
                  type="text"
                  @keyup.enter="saveEdit(product)"
                  @keyup.escape="cancelEdit"
                  class="grow bg-accent/50 border border-primary/40 rounded-lg px-3 py-1 text-sm font-bold focus:outline-none"
                  autofocus
                />
                <button @click="saveEdit(product)" class="text-green-500 hover:text-green-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>
                </button>
                <button @click="cancelEdit" class="text-secondary/40 hover:text-secondary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
              <span 
                v-else 
                @dblclick="startEdit(product, 'title')"
                class="font-bold text-secondary cursor-pointer hover:text-primary transition-colors"
                title="Doble clic para editar"
              >
                {{ product.title }}
              </span>
            </td>
            
            <!-- Category -->
            <td class="px-6 py-4">
              <span class="text-sm text-secondary/60">{{ product.category_name || 'Sin categoría' }}</span>
            </td>
            
            <!-- Price -->
            <td class="px-6 py-4 text-right">
              <div v-if="editingCell?.id === product.id && editingCell?.field === 'price'" class="flex gap-2 justify-end">
                <input 
                  v-model.number="editValue"
                  type="number"
                  step="0.01"
                  min="0"
                  @keyup.enter="saveEdit(product)"
                  @keyup.escape="cancelEdit"
                  class="w-28 bg-accent/50 border border-primary/40 rounded-lg px-3 py-1 text-sm font-bold focus:outline-none text-right"
                  autofocus
                />
                <button @click="saveEdit(product)" class="text-green-500 hover:text-green-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>
                </button>
                <button @click="cancelEdit" class="text-secondary/40 hover:text-secondary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
              <span 
                v-else 
                @dblclick="startEdit(product, 'price')"
                class="font-black text-primary cursor-pointer hover:underline tabular-nums"
                title="Doble clic para editar"
              >
                {{ formatMoney(product.price, 0, '$') }}
              </span>
            </td>
            
            <!-- Stock -->
            <td class="px-6 py-4 text-right">
              <div v-if="editingCell?.id === product.id && editingCell?.field === 'stock'" class="flex gap-2 justify-end">
                <input 
                  v-model.number="editValue"
                  type="number"
                  min="0"
                  @keyup.enter="saveEdit(product)"
                  @keyup.escape="cancelEdit"
                  class="w-20 bg-accent/50 border border-primary/40 rounded-lg px-3 py-1 text-sm font-bold focus:outline-none text-right"
                  autofocus
                />
                <button @click="saveEdit(product)" class="text-green-500 hover:text-green-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>
                </button>
                <button @click="cancelEdit" class="text-secondary/40 hover:text-secondary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
              <span 
                v-else 
                @dblclick="startEdit(product, 'stock')"
                :class="[
                  'font-bold cursor-pointer hover:underline tabular-nums',
                  product.stock === 0 ? 'text-red-500' : product.stock < 5 ? 'text-amber-500' : 'text-secondary'
                ]"
                title="Doble clic para editar"
              >
                {{ product.stock }}
              </span>
            </td>
            
            <!-- Status -->
            <td class="px-6 py-4 text-center">
              <button 
                @click="toggleStatus(product)"
                :class="[
                  'px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer',
                  product.status === 'active' 
                    ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                    : 'bg-secondary/10 text-secondary/50 hover:bg-secondary/20'
                ]"
              >
                {{ product.status === 'active' ? 'Activo' : 'Inactivo' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <p class="text-center text-xs text-secondary/40 font-bold">
      💡 Haz doble clic en cualquier celda para editarla rápidamente
    </p>

    <!-- Modal: Price Preview -->
    <Modal 
      :show="showPreviewModal" 
      title="Previsualización de Cambios"
      size="lg"
      @close="showPreviewModal = false"
    >
      <div class="space-y-6">
        <div class="bg-accent/30 rounded-xl p-4">
          <p class="text-sm font-bold text-secondary">
            Se {{ bulkPercentage > 0 ? 'aumentarán' : 'reducirán' }} los precios en 
            <span class="text-primary">{{ Math.abs(bulkPercentage) }}%</span>
            para <span class="text-primary">{{ pricePreview.length }}</span> productos
          </p>
        </div>

        <div class="max-h-80 overflow-y-auto rounded-xl border border-secondary/10">
          <table class="w-full text-sm">
            <thead class="bg-accent/50 sticky top-0">
              <tr>
                <th class="text-left px-4 py-3 font-black text-[10px] uppercase tracking-widest text-secondary/50">Producto</th>
                <th class="text-right px-4 py-3 font-black text-[10px] uppercase tracking-widest text-secondary/50">Precio Actual</th>
                <th class="text-center px-4 py-3 font-black text-[10px] uppercase tracking-widest text-secondary/50"></th>
                <th class="text-right px-4 py-3 font-black text-[10px] uppercase tracking-widest text-secondary/50">Nuevo Precio</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-secondary/5">
              <tr v-for="item in pricePreview" :key="item.id" class="hover:bg-accent/20">
                <td class="px-4 py-3 font-bold text-secondary truncate max-w-[200px]">{{ item.title }}</td>
                <td class="px-4 py-3 text-right font-bold text-secondary/60 tabular-nums">{{ formatMoney(item.oldPrice, 0, '$') }}</td>
                <td class="px-4 py-3 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-secondary/30 mx-auto"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </td>
                <td class="px-4 py-3 text-right font-black tabular-nums" :class="bulkPercentage > 0 ? 'text-green-600' : 'text-primary'">
                  {{ formatMoney(item.newPrice, 0, '$') }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex gap-3 pt-4 border-t border-secondary/10">
          <button 
            @click="showPreviewModal = false"
            class="flex-1 py-4 rounded-xl font-black uppercase tracking-widest text-xs border border-secondary/20 hover:bg-accent transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button 
            @click="confirmBulkPriceChange"
            :disabled="isBulkUpdating"
            class="flex-1 py-4 rounded-xl font-black uppercase tracking-widest text-xs bg-primary text-white hover:bg-secondary transition-all disabled:opacity-50 cursor-pointer"
          >
            {{ isBulkUpdating ? 'Aplicando...' : 'Aplicar Cambios' }}
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>
