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

const getShippingStatusColor = (status: string) => {
    switch (status) {
        case 'processing': return 'bg-amber-100 text-amber-700 border-amber-200';
        case 'shipped': return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'delivered': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
};

const getShippingStatusLabel = (status: string) => {
    switch (status) {
        case 'processing': return 'En Proceso';
        case 'shipped': return 'Enviado';
        case 'delivered': return 'Entregado';
        default: return 'Sin estado';
    }
};

const getShippingTypeColor = (type: string) => {
    return type === 'pickup' 
        ? 'bg-violet-100 text-violet-700 border-violet-200' 
        : 'bg-sky-100 text-sky-700 border-sky-200';
};

const getShippingTypeLabel = (type: string) => {
    return type === 'pickup' ? 'Retiro' : 'Envío';
};

const expandedOrder = ref<number | null>(null);
const editingShipping = ref<number | null>(null);
const shippingForm = ref({
    status: 'processing' as 'processing' | 'shipped' | 'delivered',
    tracking_number: ''
});

const toggleExpand = (orderId: number) => {
    expandedOrder.value = expandedOrder.value === orderId ? null : orderId;
};

const startEditShipping = (order: any) => {
    editingShipping.value = order.id;
    shippingForm.value = {
        status: order.shipping_status || 'processing',
        tracking_number: order.tracking_number || ''
    };
};

const cancelEditShipping = () => {
    editingShipping.value = null;
};

const saveShippingStatus = async (orderId: number) => {
    try {
        const res = await fetch('/api/admin/orders', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: orderId,
                shipping_status: shippingForm.value.status,
                tracking_number: shippingForm.value.tracking_number || null
            })
        });
        if (res.ok) {
            toast.success('Estado de envío actualizado');
            editingShipping.value = null;
            fetchOrders(pagination.value.page);
        } else {
            const data = await res.json();
            toast.error(data.error || 'Error al actualizar');
        }
    } catch (e) {
        toast.error('Error de red');
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
            <div v-for="order in orders" :key="order.id" class="bg-white rounded-3xl border border-secondary/5 shadow-xl shadow-secondary/5 overflow-hidden group hover:border-primary/20 transition-all">
                <!-- Header clickable -->
                <div @click="toggleExpand(order.id)" class="p-6 flex flex-col lg:flex-row justify-between gap-6 cursor-pointer">
                    <!-- Left: Basic Info -->
                    <div class="flex-1 space-y-3">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary font-black italic shadow-inner">
                                #{{ order.id }}
                            </div>
                            <div>
                                <h3 class="font-black text-secondary uppercase tracking-tight text-lg line-clamp-1">{{ order.user_name }}</h3>
                                <p class="text-xs font-bold text-secondary/30 uppercase tracking-widest">{{ order.user_email }}</p>
                            </div>
                        </div>
                        
                        <!-- Status badges con etiquetas claras -->
                        <div class="flex flex-wrap gap-3 items-center">
                            <div class="flex items-center gap-1.5">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-secondary/40"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                                <span class="text-[9px] font-bold text-secondary/40 uppercase">Pago:</span>
                                <span :class="[getStatusColor(order.status), 'text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border shadow-sm']">
                                    {{ getStatusLabel(order.status) }}
                                </span>
                            </div>
                            <div class="flex items-center gap-1.5">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-secondary/40"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/><path d="M12 3v6"/></svg>
                                <span class="text-[9px] font-bold text-secondary/40 uppercase">Tipo:</span>
                                <span :class="[getShippingTypeColor(order.shipping_type || 'delivery'), 'text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border shadow-sm']">
                                    {{ getShippingTypeLabel(order.shipping_type || 'delivery') }}
                                </span>
                            </div>
                            <div v-if="order.status === 'paid' && order.shipping_type !== 'pickup'" class="flex items-center gap-1.5">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-secondary/40"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
                                <span class="text-[9px] font-bold text-secondary/40 uppercase">Estado:</span>
                                <span :class="[getShippingStatusColor(order.shipping_status || 'processing'), 'text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border shadow-sm']">
                                    {{ getShippingStatusLabel(order.shipping_status || 'processing') }}
                                </span>
                            </div>
                            <p class="text-[10px] font-bold text-secondary/40 uppercase tracking-widest">{{ new Date(order.created_at).toLocaleString('es-AR') }}</p>
                        </div>

                        <!-- Teléfono y comentarios visibles -->
                        <div v-if="order.phone || order.comments" class="flex flex-wrap gap-4 pt-2 border-t border-secondary/5">
                            <div v-if="order.phone" class="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                                <span class="text-xs font-bold text-secondary">{{ order.phone }}</span>
                            </div>
                            <div v-if="order.comments" class="flex items-center gap-2 max-w-md">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-amber-500 shrink-0"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                <span class="text-xs font-medium text-secondary/60 italic line-clamp-1">{{ order.comments }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Right: Total -->
                    <div class="lg:w-48 text-left lg:text-right flex flex-col justify-center gap-2">
                        <p class="text-[10px] font-black uppercase text-secondary/20 tracking-widest">Total</p>
                        <p class="text-2xl font-black text-primary tracking-tighter">{{ formatMoney(order.total_amount, 0, '$') }}</p>
                        <div class="flex items-center gap-2 justify-start lg:justify-end text-secondary/40">
                            <span class="text-[10px] font-bold uppercase">{{ expandedOrder === order.id ? 'Ocultar' : 'Ver detalles' }}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" :class="{'rotate-180': expandedOrder === order.id}" class="transition-transform"><path d="m6 9 6 6 6-6"/></svg>
                        </div>
                    </div>
                </div>

                <!-- Expanded Details -->
                <div v-if="expandedOrder === order.id" class="border-t border-secondary/10 bg-accent/20 p-6 space-y-6">
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <!-- Items -->
                        <div class="space-y-3">
                            <h4 class="text-[10px] font-black uppercase text-secondary/40 tracking-widest">Productos</h4>
                            <div class="space-y-2">
                                <div v-for="item in order.items" :key="item.id" class="flex justify-between items-center text-xs bg-white p-3 rounded-xl">
                                    <span class="text-secondary/60 font-bold"><span class="text-primary font-black">{{ item.quantity }}x</span> {{ item.title }}</span>
                                    <span class="font-black text-secondary tabular-nums">{{ formatMoney(item.price * item.quantity, 0, '$') }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Shipping Info -->
                        <div class="space-y-3">
                            <h4 class="text-[10px] font-black uppercase text-secondary/40 tracking-widest">Datos de Envío</h4>
                            <div class="bg-white p-4 rounded-xl space-y-3">
                                <div class="flex items-center gap-2">
                                    <span :class="[getShippingTypeColor(order.shipping_type || 'delivery'), 'text-xs font-black uppercase px-3 py-1 rounded-full border']">
                                        {{ order.shipping_type === 'pickup' ? '📦 Retiro en Sucursal' : '🚚 Envío a Domicilio' }}
                                    </span>
                                </div>
                                <div v-if="order.shipping_type !== 'pickup'">
                                    <p class="text-[9px] font-bold text-secondary/40 uppercase">Dirección</p>
                                    <p class="text-sm font-medium text-secondary">{{ order.shipping_address }}</p>
                                </div>
                                <div v-if="order.phone">
                                    <p class="text-[9px] font-bold text-secondary/40 uppercase">Teléfono</p>
                                    <p class="text-sm font-medium text-secondary">{{ order.phone }}</p>
                                </div>
                                <div v-if="order.shipping_cost > 0">
                                    <p class="text-[9px] font-bold text-secondary/40 uppercase">Costo de Envío</p>
                                    <p class="text-sm font-black text-primary">{{ formatMoney(order.shipping_cost, 0, '$') }}</p>
                                </div>
                                <div v-if="order.comments">
                                    <p class="text-[9px] font-bold text-secondary/40 uppercase">Comentarios</p>
                                    <p class="text-sm font-medium text-secondary/70 italic">{{ order.comments }}</p>
                                </div>
                                <div v-if="order.tracking_number && order.shipping_type !== 'pickup'">
                                    <p class="text-[9px] font-bold text-secondary/40 uppercase">Nº Seguimiento</p>
                                    <p class="text-sm font-black text-primary">{{ order.tracking_number }}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Shipping Status Management (only for delivery) -->
                        <div v-if="order.shipping_type !== 'pickup'" class="space-y-3">
                            <h4 class="text-[10px] font-black uppercase text-secondary/40 tracking-widest">Gestión de Envío</h4>
                            <div class="bg-white p-4 rounded-xl space-y-4">
                                <div v-if="order.status !== 'paid'" class="text-center py-4">
                                    <p class="text-xs font-bold text-secondary/40">El pedido debe estar pagado para gestionar el envío</p>
                                </div>
                                <template v-else>
                                    <div v-if="editingShipping !== order.id">
                                        <div class="flex items-center justify-between mb-4">
                                            <div>
                                                <p class="text-[9px] font-bold text-secondary/40 uppercase">Estado actual</p>
                                                <span :class="[getShippingStatusColor(order.shipping_status || 'processing'), 'text-xs font-black uppercase px-3 py-1 rounded-full border inline-block mt-1']">
                                                    {{ getShippingStatusLabel(order.shipping_status || 'processing') }}
                                                </span>
                                            </div>
                                        </div>
                                        <button @click.stop="startEditShipping(order)" class="w-full btn-primary py-3 rounded-xl text-xs font-black uppercase tracking-widest">
                                            Actualizar Estado
                                        </button>
                                    </div>
                                    <div v-else class="space-y-4" @click.stop>
                                        <div>
                                            <label class="text-[9px] font-bold text-secondary/40 uppercase block mb-2">Estado de Envío</label>
                                            <select v-model="shippingForm.status" class="w-full bg-accent/50 border-none rounded-xl py-3 px-4 font-bold text-sm focus:ring-2 focus:ring-primary outline-none">
                                                <option value="processing">En Proceso</option>
                                                <option value="shipped">Enviado</option>
                                                <option value="delivered">Entregado</option>
                                            </select>
                                        </div>
                                        <div v-if="shippingForm.status === 'shipped' || shippingForm.status === 'delivered'">
                                            <label class="text-[9px] font-bold text-secondary/40 uppercase block mb-2">Nº de Seguimiento</label>
                                            <input v-model="shippingForm.tracking_number" type="text" placeholder="Ej: AR123456789" class="w-full bg-accent/50 border-none rounded-xl py-3 px-4 font-bold text-sm focus:ring-2 focus:ring-primary outline-none" />
                                        </div>
                                        <div class="flex gap-2">
                                            <button @click.stop="cancelEditShipping" class="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest border border-secondary/20 hover:bg-accent transition-all">
                                                Cancelar
                                            </button>
                                            <button @click.stop="saveShippingStatus(order.id)" class="flex-1 btn-primary py-3 rounded-xl text-xs font-black uppercase tracking-widest">
                                                Guardar
                                            </button>
                                        </div>
                                    </div>
                                </template>
                            </div>
                        </div>
                    </div>

                    <!-- Footer Actions -->
                    <div class="flex flex-wrap gap-4 items-center justify-between pt-4 border-t border-secondary/10">
                        <div class="flex flex-wrap gap-4 text-[10px] font-bold text-secondary/40 uppercase tracking-widest">
                            <span v-if="order.payment_id">ID Pago: <span class="text-secondary">{{ order.payment_id }}</span></span>
                            <span v-if="order.external_reference">Ref: <span class="text-secondary">{{ order.external_reference }}</span></span>
                        </div>
                        <div v-if="(order.status === 'pending' || order.status === 'cancelled') && !order.payment_id">
                            <button @click.stop="deleteOrder(order.id)" class="text-[10px] font-black uppercase text-red-500 hover:underline tracking-widest cursor-pointer">Eliminar Pedido</button>
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
