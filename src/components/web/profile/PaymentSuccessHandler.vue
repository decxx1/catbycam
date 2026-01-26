<script setup lang="ts">
import { onMounted } from 'vue';
import { clearCart } from '@/stores/cartStore';
import { toast } from '@/utils/toast';

onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const paymentStatus = urlParams.get('payment');
  
  if (paymentStatus === 'success') {
    clearCart();
    toast.success('¡Pago realizado con éxito! Tu pedido está siendo procesado.');
    
    // Clean URL without reloading
    const url = new URL(window.location.href);
    url.searchParams.delete('payment');
    url.searchParams.delete('collection_id');
    url.searchParams.delete('collection_status');
    url.searchParams.delete('payment_id');
    url.searchParams.delete('status');
    url.searchParams.delete('external_reference');
    url.searchParams.delete('payment_type');
    url.searchParams.delete('merchant_order_id');
    url.searchParams.delete('preference_id');
    url.searchParams.delete('site_id');
    url.searchParams.delete('processing_mode');
    url.searchParams.delete('merchant_account_id');
    window.history.replaceState({}, '', url.pathname);
  } else if (paymentStatus === 'failure') {
    toast.error('El pago no pudo completarse. Por favor, intenta nuevamente.');
  } else if (paymentStatus === 'pending') {
    toast.success('Tu pago está pendiente de confirmación.');
  }
});
</script>

<template>
  <div></div>
</template>
