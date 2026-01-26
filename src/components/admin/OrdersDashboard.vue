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
        const res = await fetch(`/api/admin/orders?page=${page}`);
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
        const res = await fetch('/api/admin/orders', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        if (res.ok) {
            toast.success('Pedido eliminado');
            fetchOrders(pagination.value.page);
        } else {
            const data = await res.json();
            toast.error(data.error || 'Error');
        }
    } catch (e) {
        toast.error('Error de red');
    } finally {
        orderToDelete.value = null;
    }
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'paid': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
        case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
        case 'refunded': return 'bg-blue-100 text-blue-700 border-blue-200';
        default: return 'bg-gray-100 text-gray-700 border-gray-200';
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
    <div class="space-y-8">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h1 class="text-3xl font-black text-secondary uppercase italic tracking-tighter">Pedidos Realizados</h1>
                <p class="text-secondary/40 font-bold uppercase text-[10px] tracking-widest mt-1">Gestión centralizada de ventas</p>
            </div>
            <button @click="fetchOrders" class="p-3 bg-white border border-secondary/10 rounded-xl hover:bg-accent transition-all">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" :class="{'animate-spin': isLoading}"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
            </button>
        </div>

        <div v-if="isLoading" class="grid grid-cols-1 gap-4 opacity-50">
            <div v-for="i in 3" :key="i" class="h-32 bg-white rounded-3xl border border-secondary/5 animate-pulse"></div>
        </div>

        <div v-else-if="orders.length === 0" class="py-20 text-center bg-white rounded-[3rem] border border-secondary/5 shadow-xl shadow-secondary/5">
            <div class="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-6 text-secondary/10">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            </div>
            <p class="font-bold text-secondary/40 uppercase tracking-widest text-xs">No hay pedidos registrados todavía</p>
        </div>

        <div v-else class="grid grid-cols-1 gap-6">
            <div v-for="order in orders" :key="order.id" class="bg-white rounded-[2rem] border border-secondary/5 shadow-xl shadow-secondary/5 overflow-hidden group hover:border-primary/20 transition-all">
                <div class="p-8 flex flex-col lg:flex-row justify-between gap-8">
                    <!-- Left: Basic Info -->
                    <div class="flex-1 space-y-4">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary font-black italic shadow-inner">
                                #{{ order.id }}
                            </div>
                            <div>
                                <h3 class="font-black text-secondary uppercase tracking-tight text-lg line-clamp-1">{{ order.user_name }}</h3>
                                <p class="text-xs font-bold text-secondary/30 uppercase tracking-widest">{{ order.user_email }}</p>
                            </div>
                        </div>
                        <div class="flex flex-wrap gap-4 items-center pt-2">
                             <span :class="[getStatusColor(order.status), 'text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border shadow-sm']">
                                {{ getStatusLabel(order.status) }}
                            </span>
                            <p class="text-[10px] font-bold text-secondary/40 uppercase tracking-widest border-l border-secondary/10 pl-4">{{ new Date(order.created_at).toLocaleString('es-AR') }}</p>
                             <p v-if="order.payment_id" class="text-[10px] font-bold text-secondary/20 uppercase tracking-widest">ID Pago: {{ order.payment_id }}</p>
                        </div>
                    </div>

                    <!-- Middle: Items Summary -->
                    <div class="flex-1 border-y lg:border-y-0 lg:border-x border-secondary/5 px-0 lg:px-8 py-6 lg:py-0">
                         <div class="space-y-3">
                            <div v-for="item in order.items" :key="item.id" class="flex justify-between items-center text-xs">
                                <span class="text-secondary/60 font-bold"><span class="text-primary">{{ item.quantity }}x</span> {{ item.title }}</span>
                                <span class="font-black text-secondary/40 tabular-nums">{{ formatMoney(item.price * item.quantity, 0, '$') }}</span>
                            </div>
                         </div>
                    </div>

                    <!-- Right: Total and Actions -->
                    <div class="lg:w-48 text-left lg:text-right flex flex-col justify-center gap-4">
                         <div>
                            <p class="text-[10px] font-black uppercase text-secondary/20 tracking-widest mb-1">Total del Pedido</p>
                            <p class="text-3xl font-black text-primary tracking-tighter">{{ formatMoney(order.total_amount, 0, '$') }}</p>
                         </div>
                         <div class="flex flex-col gap-2">
                            <p class="text-[9px] font-bold text-secondary/40 uppercase leading-none">Envío a:</p>
                            <p class="text-[10px] font-medium text-secondary/60 line-clamp-2 italic">{{ order.shipping_address }}</p>
                         </div>
                         <div v-if="(order.status === 'pending' || order.status === 'cancelled') && !order.payment_id" class="pt-4">
                             <button @click="deleteOrder(order.id)" class="text-[10px] font-black uppercase text-red-500 hover:underline tracking-widest cursor-pointer">Eliminar Pedido</button>
                         </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Pagination -->
        <div v-if="pagination.totalPages > 1" class="flex justify-center items-center gap-6 pt-10">
            <button 
                @click="fetchOrders(pagination.page - 1)" 
                :disabled="pagination.page === 1"
                class="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-secondary/10 text-secondary font-bold uppercase text-[10px] tracking-widest hover:bg-accent disabled:opacity-30 disabled:hover:bg-white transition-all cursor-pointer disabled:cursor-not-allowed"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                Anterior
            </button>
            
            <div class="flex items-center gap-2">
                <span class="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-black italic shadow-lg shadow-primary/20">{{ pagination.page }}</span>
                <span class="text-[10px] font-black text-secondary/20 uppercase tracking-widest italic">de {{ pagination.totalPages }}</span>
            </div>

            <button 
                @click="fetchOrders(pagination.page + 1)" 
                :disabled="pagination.page === pagination.totalPages"
                class="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-secondary/10 text-secondary font-bold uppercase text-[10px] tracking-widest hover:bg-accent disabled:opacity-30 disabled:hover:bg-white transition-all cursor-pointer disabled:cursor-not-allowed"
            >
                Siguiente
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
        </div>

        <ConfirmModal 
            :show="showDeleteModal"
            title="¿Eliminar pedido?"
            message="Esta acción es irreversible y el registro de la venta se perderá por completo."
            confirm-label="Eliminar"
            @confirm="confirmDelete"
            @cancel="showDeleteModal = false"
        />
    </div>
</template>
