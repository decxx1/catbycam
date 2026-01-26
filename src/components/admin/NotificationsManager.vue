<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { toast } from '@/utils/toast';
import ConfirmModal from '@/components/common/ConfirmModal.vue';

interface Notification {
    id: number;
    type: 'payment_approved' | 'new_order' | 'low_stock' | 'system';
    title: string;
    message: string;
    data: string | null;
    is_read: boolean;
    created_at: string;
}

const notifications = ref<Notification[]>([]);
const pagination = ref({
    page: 1,
    totalPages: 1,
    total: 0
});
const isLoading = ref(true);
const filter = ref<'all' | 'unread'>('all');

const showDeleteModal = ref(false);
const notificationToDelete = ref<number | null>(null);

const fetchNotifications = async (page = 1) => {
    isLoading.value = true;
    try {
        const endpoint = filter.value === 'unread' 
            ? '/api/admin/notifications?action=unread'
            : `/api/admin/notifications?page=${page}`;
        
        const res = await fetch(endpoint);
        if (res.ok) {
            const response = await res.json();
            if (filter.value === 'unread') {
                notifications.value = response.notifications;
                pagination.value = { page: 1, totalPages: 1, total: response.count };
            } else {
                notifications.value = response.data;
                pagination.value = {
                    page: response.page,
                    totalPages: response.totalPages,
                    total: response.total
                };
            }
        }
    } catch (e) {
        console.error(e);
        toast.error('Error al cargar notificaciones');
    } finally {
        isLoading.value = false;
    }
};

onMounted(() => fetchNotifications(1));

const markAsRead = async (id: number) => {
    try {
        const res = await fetch('/api/admin/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'mark_read', id })
        });
        if (res.ok) {
            const notification = notifications.value.find(n => n.id === id);
            if (notification) notification.is_read = true;
            toast.success('Notificación marcada como leída');
        }
    } catch (e) {
        toast.error('Error al marcar como leída');
    }
};

const markAllAsRead = async () => {
    try {
        const res = await fetch('/api/admin/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'mark_all_read' })
        });
        if (res.ok) {
            notifications.value.forEach(n => n.is_read = true);
            toast.success('Todas las notificaciones marcadas como leídas');
        }
    } catch (e) {
        toast.error('Error al marcar todas como leídas');
    }
};

const deleteNotification = (id: number) => {
    notificationToDelete.value = id;
    showDeleteModal.value = true;
};

const confirmDelete = async () => {
    if (notificationToDelete.value === null) return;
    showDeleteModal.value = false;
    const id = notificationToDelete.value;
    try {
        const res = await fetch('/api/admin/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', id })
        });
        if (res.ok) {
            notifications.value = notifications.value.filter(n => n.id !== id);
            toast.success('Notificación eliminada');
        } else {
            toast.error('Error al eliminar');
        }
    } catch (e) {
        toast.error('Error de red');
    } finally {
        notificationToDelete.value = null;
    }
};

const changeFilter = (newFilter: 'all' | 'unread') => {
    filter.value = newFilter;
    fetchNotifications(1);
};

const getTypeIcon = (type: string) => {
    switch (type) {
        case 'payment_approved':
            return `<svg class="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
        case 'new_order':
            return `<svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>`;
        case 'low_stock':
            return `<svg class="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`;
        default:
            return `<svg class="w-6 h-6 text-secondary/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
    }
};

const getTypeLabel = (type: string) => {
    switch (type) {
        case 'payment_approved': return 'Pago Aprobado';
        case 'new_order': return 'Nuevo Pedido';
        case 'low_stock': return 'Stock Bajo';
        case 'system': return 'Sistema';
        default: return type;
    }
};

const getTypeColor = (type: string) => {
    switch (type) {
        case 'payment_approved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        case 'new_order': return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'low_stock': return 'bg-amber-100 text-amber-700 border-amber-200';
        default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
};

const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return date.toLocaleDateString('es-AR');
};

const unreadCount = computed(() => notifications.value.filter(n => !n.is_read).length);
</script>

<template>
    <div class="space-y-8">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div class="flex items-center gap-4">
                <div class="flex bg-white border border-secondary/10 rounded-xl overflow-hidden">
                    <button 
                        @click="changeFilter('all')"
                        :class="[
                            'px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer',
                            filter === 'all' ? 'bg-primary text-white' : 'text-secondary/60 hover:bg-accent'
                        ]"
                    >
                        Todas
                    </button>
                    <button 
                        @click="changeFilter('unread')"
                        :class="[
                            'px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer',
                            filter === 'unread' ? 'bg-primary text-white' : 'text-secondary/60 hover:bg-accent'
                        ]"
                    >
                        No leídas
                    </button>
                </div>
                <span v-if="unreadCount > 0" class="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full">
                    {{ unreadCount }} sin leer
                </span>
            </div>
            <div class="flex items-center gap-3">
                <button 
                    @click="markAllAsRead" 
                    :disabled="unreadCount === 0"
                    class="px-4 py-2 bg-white border border-secondary/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-secondary/60 hover:bg-accent disabled:opacity-30 transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                    Marcar todas como leídas
                </button>
                <button @click="fetchNotifications(pagination.page)" class="p-3 bg-white border border-secondary/10 rounded-xl hover:bg-accent transition-all cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" :class="{'animate-spin': isLoading}"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
                </button>
            </div>
        </div>

        <div v-if="isLoading" class="grid grid-cols-1 gap-4 opacity-50">
            <div v-for="i in 5" :key="i" class="h-24 bg-white rounded-2xl border border-secondary/5 animate-pulse"></div>
        </div>

        <div v-else-if="notifications.length === 0" class="py-20 text-center bg-white rounded-[3rem] border border-secondary/5 shadow-xl shadow-secondary/5">
            <div class="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-6 text-secondary/10">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </div>
            <p class="font-bold text-secondary/40 uppercase tracking-widest text-xs">
                {{ filter === 'unread' ? 'No hay notificaciones sin leer' : 'No hay notificaciones' }}
            </p>
        </div>

        <div v-else class="space-y-4">
            <div 
                v-for="notification in notifications" 
                :key="notification.id" 
                :class="[
                    'bg-white rounded-2xl border shadow-lg overflow-hidden transition-all hover:shadow-xl group',
                    notification.is_read ? 'border-secondary/5 shadow-secondary/5' : 'border-primary/20 shadow-primary/10'
                ]"
            >
                <div class="p-6 flex items-start gap-5">
                    <div 
                        :class="[
                            'w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0',
                            notification.is_read ? 'bg-secondary/5' : 'bg-primary/5'
                        ]"
                        v-html="getTypeIcon(notification.type)"
                    ></div>
                    
                    <div class="flex-1 min-w-0">
                        <div class="flex items-start justify-between gap-4">
                            <div class="flex-1">
                                <div class="flex items-center gap-3 mb-2">
                                    <h3 :class="['font-black text-lg', notification.is_read ? 'text-secondary/60' : 'text-secondary']">
                                        {{ notification.title }}
                                    </h3>
                                    <span v-if="!notification.is_read" class="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                                </div>
                                <p :class="['text-sm', notification.is_read ? 'text-secondary/40' : 'text-secondary/60']">
                                    {{ notification.message }}
                                </p>
                            </div>
                            <div class="flex flex-col items-end gap-2 flex-shrink-0">
                                <span :class="[getTypeColor(notification.type), 'text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border']">
                                    {{ getTypeLabel(notification.type) }}
                                </span>
                                <span class="text-[10px] font-bold text-secondary/30 uppercase tracking-widest">
                                    {{ formatTimeAgo(notification.created_at) }}
                                </span>
                            </div>
                        </div>
                        
                        <div class="flex items-center gap-4 mt-4 pt-4 border-t border-secondary/5">
                            <button 
                                v-if="!notification.is_read"
                                @click="markAsRead(notification.id)"
                                class="text-[10px] font-black uppercase tracking-widest text-primary hover:underline cursor-pointer"
                            >
                                Marcar como leída
                            </button>
                            <button 
                                @click="deleteNotification(notification.id)"
                                class="text-[10px] font-black uppercase tracking-widest text-red-500 hover:underline cursor-pointer"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Pagination -->
        <div v-if="filter === 'all' && pagination.totalPages > 1" class="flex justify-center items-center gap-6 pt-10">
            <button 
                @click="fetchNotifications(pagination.page - 1)" 
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
                @click="fetchNotifications(pagination.page + 1)" 
                :disabled="pagination.page === pagination.totalPages"
                class="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-secondary/10 text-secondary font-bold uppercase text-[10px] tracking-widest hover:bg-accent disabled:opacity-30 disabled:hover:bg-white transition-all cursor-pointer disabled:cursor-not-allowed"
            >
                Siguiente
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
        </div>

        <ConfirmModal 
            :show="showDeleteModal"
            title="¿Eliminar notificación?"
            message="Esta acción es irreversible."
            confirm-label="Eliminar"
            @confirm="confirmDelete"
            @cancel="showDeleteModal = false"
        />
    </div>
</template>
