<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { formatMoney } from '@/utils/formatters';
import { toast } from '@/utils/toast';
import ConfirmModal from '@/components/common/ConfirmModal.vue';

const orders = ref<any[]>([]);
const pagination = ref({
    page: 1,
    totalPages: 1,
    total: 0
});
const isLoading = ref(true);

const showDeleteModal = ref(false);
const orderToDelete = ref<number | null>(null);

const fetchOrders = async (page = 1) => {
  isLoading.value = true;
  try {
    const res = await fetch(`/api/orders?page=${page}`);
    if (res.ok) {
      const response = await res.json();
      orders.value = response.data;
      pagination.value = {
          page: response.page,
          totalPages: response.totalPages,
          total: response.total
      };
    }
  } catch (e) {
    console.error(e);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => fetchOrders(1));

const deleteOrder = (id: number) => {
    orderToDelete.value = id;
    showDeleteModal.value = true;
};

const confirmDelete = async () => {
    if (orderToDelete.value === null) return;
    showDeleteModal.value = false;
    const id = orderToDelete.value;
    try {
        const res = await fetch('/api/orders', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        if (res.ok) {
            toast.success('Pedido eliminado correctamente');
            fetchOrders(pagination.value.page);
        } else {
            const data = await res.json();
            toast.error(data.error || 'Error al eliminar');
        }
    } catch (e) {
        toast.error('Error de conexión');
    } finally {
        orderToDelete.value = null;
    }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'paid': return 'bg-emerald-500 text-white';
    case 'pending': return 'bg-amber-500 text-white';
    case 'cancelled': return 'bg-red-500 text-white';
    case 'refunded': return 'bg-blue-500 text-white';
    default: return 'bg-secondary/10 text-secondary/40';
  }
};

const getStatusLabel = (status: string) => {
    switch (status) {
        case 'paid': return 'Pagado';
        case 'pending': return 'Pendiente';
        case 'cancelled': return 'Cancelado';
        case 'refunded': return 'Reembolsado';
        default: return status;
    }
};
</script>

<template>
  <div class="space-y-6">
    <div v-if="isLoading" class="py-12 text-center">
        <div class="animate-pulse text-secondary/30 font-bold uppercase tracking-widest text-xs">Cargando tus pedidos...</div>
    </div>
    
    <div v-else-if="orders.length === 0" class="bg-accent/30 rounded-2xl p-8 text-center text-secondary/30 border border-secondary/5">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-4 opacity-20"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><path d="M3 6h18"></path><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
        <p class="text-xs font-bold uppercase tracking-widest">Aún no realizaste ninguna compra</p>
    </div>

    <div v-for="order in orders" :key="order.id" class="bg-white rounded-3xl border border-secondary/5 shadow-sm overflow-hidden group hover:shadow-md transition-all">
        <div class="p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-accent/10 border-b border-secondary/5">
            <div>
                <div class="flex items-center gap-3 mb-1">
                    <h4 class="font-black text-secondary uppercase tracking-tight italic">Pedido #{{ order.id }}</h4>
                    <span :class="[getStatusColor(order.status), 'text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shadow-sm']">
                        {{ getStatusLabel(order.status) }}
                    </span>
                </div>
                <p class="text-xs font-bold text-secondary/40 uppercase tracking-widest">{{ new Date(order.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }) }}</p>
            </div>
            <div class="text-left sm:text-right">
                <p class="text-2xl font-black text-primary tracking-tighter">{{ formatMoney(order.total_amount, 0, '$') }}</p>
                <p class="text-[10px] font-bold text-secondary/40 uppercase tracking-widest">{{ order.items.length }} {{ order.items.length === 1 ? 'item' : 'ítems' }}</p>
            </div>
        </div>
        
        <div class="p-6 sm:p-8 space-y-6">
            <div class="space-y-4">
                <div v-for="item in order.items" :key="item.id" class="flex justify-between items-center text-sm">
                    <div class="flex items-center gap-3">
                        <span class="w-6 h-6 bg-accent rounded-lg flex items-center justify-center text-[10px] font-black text-secondary/40">{{ item.quantity }}x</span>
                        <p class="font-bold text-secondary">{{ item.title }}</p>
                    </div>
                    <p class="font-black text-secondary/60 tabular-nums">{{ formatMoney(item.price * item.quantity, 0, '$') }}</p>
                </div>
            </div>

            <div class="pt-6 border-t border-secondary/5 flex flex-col gap-2">
                <p class="text-[10px] font-black uppercase text-secondary/30 tracking-widest">Envío a</p>
                <p class="text-xs font-bold text-secondary/60 leading-relaxed italic">{{ order.shipping_address }}</p>
            </div>

            <div v-if="(order.status === 'pending' || order.status === 'cancelled') && !order.payment_id" class="pt-2 flex flex-col sm:flex-row gap-4">
                 <a v-if="order.status === 'pending' && order.preference_id" :href="'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=' + order.preference_id" target="_blank" class="text-[10px] font-black uppercase text-primary hover:underline tracking-widest">Continuar con el pago &rarr;</a>
                 <button @click="deleteOrder(order.id)" class="text-[10px] font-black uppercase text-red-500/60 hover:text-red-500 hover:underline tracking-widest cursor-pointer">Eliminar Pedido</button>
            </div>
        </div>
    </div>

    <!-- Pagination -->
    <div v-if="pagination.totalPages > 1" class="flex justify-center items-center gap-4 pt-6">
        <button 
            @click="fetchOrders(pagination.page - 1)" 
            :disabled="pagination.page === 1"
            class="p-2 rounded-xl bg-white border border-secondary/5 text-secondary hover:text-primary disabled:opacity-30 disabled:hover:text-secondary transition-all cursor-pointer disabled:cursor-not-allowed"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <span class="text-[10px] font-black uppercase tracking-widest text-secondary/40">
            Página {{ pagination.page }} de {{ pagination.totalPages }}
        </span>
        <button 
            @click="fetchOrders(pagination.page + 1)" 
            :disabled="pagination.page === pagination.totalPages"
            class="p-2 rounded-xl bg-white border border-secondary/5 text-secondary hover:text-primary disabled:opacity-30 disabled:hover:text-secondary transition-all cursor-pointer disabled:cursor-not-allowed"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
    </div>

    <ConfirmModal 
        :show="showDeleteModal"
        title="¿Eliminar pedido?"
        message="Se cancelará el proceso de compra y el pedido se borrará de tu historial."
        confirm-label="Eliminar"
        @confirm="confirmDelete"
        @cancel="showDeleteModal = false"
    />
  </div>
</template>
