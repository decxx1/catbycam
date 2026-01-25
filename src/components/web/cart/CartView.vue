<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useStore } from '@nanostores/vue';
import { cartList, cartTotal, cartCount, removeItem, updateQuantity } from '@/stores/cartStore';
import { formatMoney } from '@/utils/formatters';

const items = useStore(cartList);
const total = useStore(cartTotal);
const count = useStore(cartCount);
const isMounted = ref(false);

onMounted(() => {
  isMounted.value = true;
});
</script>

<template>
  <div v-if="isMounted" class="container-custom py-20">
    <div class="flex flex-col gap-12">
      <div class="flex flex-col gap-4">
        <h1 class="text-5xl font-black text-secondary tracking-tighter uppercase italic">Tu Carrito</h1>
        <p v-if="count > 0" class="text-secondary/60 font-bold uppercase tracking-widest text-sm">
          Tienes <span class="text-primary">{{ count }}</span> {{ count === 1 ? 'artículo' : 'artículos' }} en tu carrito
        </p>
      </div>

      <div v-if="items.length > 0" class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <!-- Items List -->
        <div class="lg:col-span-8 flex flex-col gap-6">
          <div 
            v-for="item in items" 
            :key="item.id" 
            class="group bg-white rounded-3xl p-6 border border-secondary/5 hover:border-primary/20 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 flex flex-col sm:flex-row gap-6 items-center"
          >
            <div class="w-32 h-32 shrink-0 overflow-hidden rounded-2xl border border-secondary/5 bg-accent">
              <img :src="item.image" :alt="item.title" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            </div>

            <div class="flex-1 flex flex-col gap-2 text-center sm:text-left">
              <span class="text-[10px] font-black uppercase tracking-widest text-primary italic">{{ item.category }}</span>
              <h3 class="text-xl font-black text-secondary leading-tight">{{ item.title }}</h3>
              <p class="text-secondary/40 font-bold text-sm">Precio unitario: {{ formatMoney(item.price, 0, '$') }}</p>
            </div>

            <div class="flex items-center gap-4 bg-accent/50 rounded-2xl p-2 shrink-0">
              <button 
                @click="updateQuantity(item.id, item.quantity - 1)"
                class="w-10 h-10 flex items-center justify-center text-secondary hover:text-primary transition-colors bg-white rounded-xl shadow-sm text-xl font-black"
              >
                -
              </button>
              <span class="w-8 text-center font-black text-lg tabular-nums">{{ item.quantity }}</span>
              <button 
                @click="updateQuantity(item.id, item.quantity + 1)"
                class="w-10 h-10 flex items-center justify-center text-secondary hover:text-primary transition-colors bg-white rounded-xl shadow-sm text-xl font-black"
              >
                +
              </button>
            </div>

            <div class="flex flex-col items-end gap-2 shrink-0 min-w-[120px]">
              <span class="text-2xl font-black text-secondary tabular-nums tracking-tighter">
                {{ formatMoney(item.price * item.quantity, 0, '$') }}
              </span>
              <button 
                @click="removeItem(item.id)"
                class="text-[10px] font-black uppercase tracking-widest text-secondary/30 hover:text-primary transition-colors"
              >
                Remover producto
              </button>
            </div>
          </div>
        </div>

        <!-- Summary -->
        <div class="lg:col-span-4 sticky top-32">
          <div class="bg-secondary text-white rounded-4xl p-8 shadow-2xl shadow-secondary/20 overflow-hidden relative">
             <div class="relative z-10">
                <h2 class="text-2xl text-white font-black tracking-tighter uppercase italic mb-8 border-b border-white/10 pb-4">Resumen de Compra</h2>
                
                <div class="flex flex-col gap-4 mb-8">
                  <div class="flex justify-between items-center text-white/60 font-bold uppercase tracking-widest text-xs">
                    <span>Subtotal</span>
                    <span class="text-white text-lg tabular-nums">{{ formatMoney(total, 0, '$') }}</span>
                  </div>
                  <div class="flex justify-between items-center text-white/60 font-bold uppercase tracking-widest text-xs">
                    <span>Envío</span>
                    <span class="text-white text-sm">A calcular</span>
                  </div>
                </div>

                <div class="flex justify-between items-center mb-10">
                   <span class="font-black text-xl tracking-tighter uppercase italic">Total</span>
                   <span class="text-4xl font-black tracking-tighter text-primary tabular-nums">{{ formatMoney(total, 0, '$') }}</span>
                </div>

                <div class="flex flex-col gap-4">
                  <a 
                    href="/checkout" 
                    class="btn-primary py-5 rounded-2xl w-full text-center text-sm font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all active:scale-[0.98]"
                  >
                    Confirmar Pedido
                  </a>
                  <a 
                    href="/catalog" 
                    class="text-white/40 hover:text-white text-[10px] font-black uppercase tracking-widest text-center transition-colors"
                  >
                    Seguir comprando
                  </a>
                </div>
             </div>

             <!-- Background Decoration -->
             <div class="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>
             <div class="absolute -top-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="flex flex-col items-center justify-center py-32 text-center gap-8 bg-accent/20 rounded-[60px] border-4 border-dashed border-secondary/5">
        <div class="w-32 h-32 bg-white rounded-full flex items-center justify-center text-secondary/10 shadow-xl">
          <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
        </div>
        <div class="flex flex-col gap-2">
          <h2 class="text-3xl font-black text-secondary tracking-tighter uppercase italic">Tu carrito está vacío</h2>
          <p class="text-secondary/40 font-bold uppercase tracking-widest text-sm">Parece que aún no has añadido nada</p>
        </div>
        <a href="/catalog" class="btn-primary py-4 px-12 rounded-2xl shadow-xl shadow-primary/20">
          Explorar Catálogo
        </a>
      </div>
    </div>
  </div>
</template>
