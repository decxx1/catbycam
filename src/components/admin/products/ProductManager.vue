<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import type { Product } from '@/services/productService';
import type { Category } from '@/services/categoryService';
import { toast } from '@/utils/toast';
import Modal from '@/components/common/Modal.vue';
import ConfirmModal from '@/components/common/ConfirmModal.vue';
import ProductCard from '@/components/common/ProductCard.vue';
import ProductForm from './ProductForm.vue';
import CategoryManager from './CategoryManager.vue';

const products = ref<Product[]>([]);
const categories = ref<Category[]>([]);
const totalProducts = ref(0);
const currentPage = ref(1);
const limit = 10;
const searchQuery = ref('');
const selectedCategory = ref('');
const isLoading = ref(false);

const showProductModal = ref(false);
const showCategoryModal = ref(false);
const showDeleteConfirm = ref(false);
const productToDelete = ref<number | null>(null);
const editingProduct = ref<Product | null>(null);

// Fetch Data
const fetchProducts = async () => {
  isLoading.value = true;
  try {
    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      limit: limit.toString(),
      search: searchQuery.value,
      categoryId: selectedCategory.value
    });
    const res = await fetch(`/api/admin/products?${params}`);
    const data = await res.json();
    products.value = data.products;
    totalProducts.value = data.total;
  } catch (e) {
    toast.error('Error al cargar productos');
  } finally {
    isLoading.value = false;
  }
};

const fetchCategories = async () => {
  try {
    const res = await fetch('/api/admin/categories');
    categories.value = await res.json();
  } catch (e) {
    toast.error('Error al cargar categorías');
  }
};

// Methods
const openCreateModal = () => {
  editingProduct.value = null;
  showProductModal.value = true;
};

const openEditModal = (product: Product) => {
  editingProduct.value = { ...product };
  showProductModal.value = true;
};

const saveProduct = async (data: Product) => {
  try {
    const method = data.id ? 'PUT' : 'POST';
    const res = await fetch('/api/admin/products', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (res.ok) {
      toast.success(data.id ? 'Producto actualizado' : 'Producto creado');
      showProductModal.value = false;
      fetchProducts();
    } else {
      throw new Error();
    }
  } catch (e) {
    toast.error('Error al guardar el producto');
  }
};

const confirmDelete = (id: number) => {
    productToDelete.value = id;
    showDeleteConfirm.value = true;
};

const handleDelete = async () => {
    if (!productToDelete.value) return;
    try {
        const res = await fetch('/api/admin/products', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: productToDelete.value })
        });
        if (res.ok) {
            toast.success('Producto eliminado permanentemente');
            fetchProducts();
        } else {
            throw new Error();
        }
    } catch (e) {
        toast.error('Error al eliminar');
    } finally {
        showDeleteConfirm.value = false;
        productToDelete.value = null;
    }
};

const createCategory = async (name: string) => {
    try {
        const res = await fetch('/api/admin/categories', {
            method: 'POST',
            body: JSON.stringify({ name })
        });
        if (res.ok) {
            toast.success('Categoría creada');
            fetchCategories();
        }
    } catch (e) {
        toast.error('Error al crear categoría');
    }
};

const deleteCategory = async (id: number) => {
    // For categories we still use a simple confirmation or we could use another ConfirmModal
    // Let's use ConfirmModal for everything later, for now just avoid window.confirm
    if (confirm('¿Eliminar categoría? Esto afectará a los productos asociados.')) {
        try {
            const res = await fetch('/api/admin/categories', {
                method: 'DELETE',
                body: JSON.stringify({ id })
            });
            if (res.ok) {
                toast.success('Categoría eliminada');
                fetchCategories();
            }
        } catch (e) {
            toast.error('Error al eliminar categoría');
        }
    }
};

// Watchers for reactivity
watch([searchQuery, selectedCategory], () => {
  currentPage.value = 1;
  fetchProducts();
});

watch(currentPage, fetchProducts);

onMounted(() => {
  fetchProducts();
  fetchCategories();
});

const totalPages = () => Math.ceil(totalProducts.value / limit);
</script>

<template>
  <div class="space-y-8 relative z-10">
    <!-- toolbar -->
    <div class="flex flex-col md:flex-row gap-6 items-center justify-between bg-white p-6 rounded-3xl border border-secondary/5 shadow-sm">
        <div class="flex grow gap-4 w-full md:max-w-2xl">
            <div class="relative grow">
                <input 
                    v-model="searchQuery"
                    type="text" 
                    placeholder="Buscar por título o descripción..." 
                    class="w-full bg-accent/50 border border-secondary/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-primary/40 focus:bg-white transition-all font-bold"
                />
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="absolute left-4 top-3 text-secondary/30"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
            <select 
                v-model="selectedCategory"
                class="bg-accent/50 border border-secondary/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/40 focus:bg-white transition-all font-bold appearance-none min-w-[150px]"
            >
                <option value="">Todas las categorías</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
        </div>

        <div class="flex items-center gap-3 w-full md:w-auto">
            <button 
                @click="showCategoryModal = true"
                class="grow md:grow-0 px-6 py-3 bg-secondary text-white font-black text-sm rounded-xl hover:bg-secondary/90 transition-all cursor-pointer"
            >
                Categorías
            </button>
            <button 
                @click="openCreateModal"
                class="grow md:grow-0 px-6 py-3 bg-primary text-white font-black text-sm rounded-xl hover:bg-secondary transition-all shadow-lg shadow-primary/20 cursor-pointer"
            >
                + Nuevo Producto
            </button>
        </div>
    </div>

    <!-- main list -->
    <div v-if="products.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
      <div v-for="product in products" :key="product.id" class="relative group">
        <ProductCard 
            :title="product.title"
            :category="product.category_name || 'Sin categoría'"
            :image="product.main_image"
            :price="product.price"
        />
        <!-- Admin Controls Overlay -->
        <div class="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
                @click="openEditModal(product)"
                class="w-10 h-10 bg-white shadow-xl rounded-xl flex items-center justify-center text-secondary hover:text-primary transition-colors cursor-pointer"
                title="Editar"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
            </button>
            <button 
                @click="confirmDelete(product.id!)"
                class="w-10 h-10 bg-white shadow-xl rounded-xl flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all cursor-pointer"
                title="Eliminar"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!isLoading" class="py-24 text-center bg-white rounded-3xl border border-dashed border-secondary/20">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" class="mx-auto mb-6 text-secondary/20"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
        <h3 class="text-xl font-bold text-secondary">No se encontraron productos</h3>
        <p class="text-secondary/40 mt-2">Prueba cambiando los filtros o crea uno nuevo.</p>
    </div>

    <!-- Pagination -->
    <div v-if="totalProducts > limit" class="flex justify-center items-center gap-4 py-8">
        <button 
            @click="currentPage--"
            :disabled="currentPage === 1"
            class="w-10 h-10 rounded-lg flex items-center justify-center bg-white border border-secondary/10 text-secondary/60 hover:border-primary hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div class="flex items-center gap-2">
            <span class="text-sm font-bold text-secondary/40">Página</span>
            <span class="text-sm font-black">{{ currentPage }}</span>
            <span class="text-sm font-bold text-secondary/40">de {{ totalPages() }}</span>
        </div>
        <button 
            @click="currentPage++"
            :disabled="currentPage >= totalPages()"
            class="w-10 h-10 rounded-lg flex items-center justify-center bg-white border border-secondary/10 text-secondary/60 hover:border-primary hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="rotate-180"><path d="m15 18-6-6 6-6"/></svg>
        </button>
    </div>

    <!-- Modal: Product Form -->
    <Modal 
        :show="showProductModal" 
        :title="editingProduct ? 'Editar Producto' : 'Nuevo Producto'"
        size="lg"
        @close="showProductModal = false"
    >
        <ProductForm 
            :initial-data="editingProduct || undefined"
            :categories="categories"
            @save="saveProduct"
            @cancel="showProductModal = false"
        />
    </Modal>

    <!-- Modal: Category Manager -->
    <Modal 
        :show="showCategoryModal" 
        title="Gestionar Categorías"
        size="sm"
        @close="showCategoryModal = false"
    >
        <CategoryManager 
            :categories="categories"
            @create="createCategory"
            @delete="deleteCategory"
        />
    </Modal>

    <!-- Confirm Modal: Delete Product -->
    <ConfirmModal 
        :show="showDeleteConfirm"
        title="¿Eliminar producto?"
        message="Esta acción eliminará el producto y todas sus imágenes de forma permanente. No se puede deshacer."
        confirm-label="Eliminar para siempre"
        confirm-variant="danger"
        @confirm="handleDelete"
        @cancel="showDeleteConfirm = false"
    />
  </div>
</template>

