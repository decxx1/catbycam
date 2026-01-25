<script setup lang="ts">
import { useStore } from '@nanostores/vue';
import { cartList, cartTotal, removeItem, updateQuantity } from '@/stores/cartStore';
import { formatMoney } from '@/utils/formatters';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits(['close']);

const items = useStore(cartList);
const total = useStore(cartTotal);

const handleClose = () => emit('close');
</script>

<template>
  <div 
    v-if="isOpen"
    class="fixed inset-0 z-100 overflow-hidden"
    aria-labelledby="slide-over-title" 
    role="dialog" 
    aria-modal="true"
  >
    <div class="absolute inset-0 overflow-hidden">
      <!-- Background backdrop -->
      <div 
        class="absolute inset-0 bg-secondary/40 backdrop-blur-sm transition-opacity duration-500" 
        @click="handleClose"
        aria-hidden="true"
      ></div>

      <div class="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div class="pointer-events-auto w-screen max-w-md transform transition duration-500 ease-in-out">
          <div class="flex h-full flex-col bg-white shadow-2xl">
            <div class="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
              <div class="flex items-start justify-between border-b border-secondary/5 pb-6">
                <h2 class="text-2xl font-black text-secondary tracking-tighter" id="slide-over-title">Tu Carrito</h2>
                <div class="ml-3 flex h-7 items-center">
                  <button 
                    type="button" 
                    @click="handleClose"
                    class="relative -m-2 p-2 text-secondary/40 hover:text-primary transition-colors duration-300 outline-none"
                  >
                    <span class="absolute -inset-0.5"></span>
                    <span class="sr-only">Cerrar carrito</span>
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div class="mt-8">
                <div class="flow-root">
                  <ul v-if="items.length > 0" role="list" class="-my-6 divide-y divide-secondary/5">
                    <li v-for="item in items" :key="item.id" class="flex py-6 transition-all duration-300 hover:bg-accent/5 rounded-2xl px-2">
                      <div class="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-secondary/5 bg-accent">
                        <img :src="item.image" :alt="item.title" class="h-full w-full object-cover object-center" />
                      </div>

                      <div class="ml-4 flex flex-1 flex-col">
                        <div>
                          <div class="flex justify-between text-base font-black text-secondary leading-tight">
                            <h3>
                              <a :href="'/catalog/' + item.id" class="hover:text-primary transition-colors">{{ item.title }}</a>
                            </h3>
                            <p class="ml-4 tabular-nums">{{ formatMoney(item.price * item.quantity, 0, '$') }}</p>
                          </div>
                          <p class="mt-1 text-xs font-bold text-secondary/40 uppercase tracking-widest italic">{{ item.category }}</p>
                        </div>
                        <div class="flex flex-1 items-end justify-between text-sm">
                          <div class="flex items-center gap-2 bg-accent/50 rounded-lg p-1">
                            <button 
                              @click="updateQuantity(item.id, item.quantity - 1)"
                              class="w-6 h-6 flex items-center justify-center text-secondary hover:text-primary transition-colors"
                            >
                              -
                            </button>
                            <span class="w-6 text-center font-black tabular-nums">{{ item.quantity }}</span>
                            <button 
                              @click="updateQuantity(item.id, item.quantity + 1)"
                              class="w-6 h-6 flex items-center justify-center text-secondary hover:text-primary transition-colors"
                            >
                              +
                            </button>
                          </div>

                          <div class="flex">
                            <button 
                              @click="removeItem(item.id)"
                              type="button" 
                              class="font-black text-primary hover:text-secondary transition-colors text-xs uppercase tracking-widest"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  </ul>
                  
                  <div v-else class="flex flex-col items-center justify-center py-20 text-center">
                    <div class="w-16 h-16 bg-accent rounded-full flex items-center justify-center text-secondary/20 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                    </div>
                    <p class="text-secondary/60 font-bold mb-6">Tu carrito está vacío</p>
                    <a 
                      href="/catalog" 
                      @click="handleClose"
                      class="btn-primary py-3 px-8"
                    >
                      Ver Catálogo
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="items.length > 0" class="border-t border-secondary/5 px-6 py-8 sm:px-8 bg-accent/5">
              <div class="flex justify-between text-base font-black text-secondary mb-2">
                <p>Subtotal</p>
                <p class="text-2xl tracking-tighter tabular-nums">{{ formatMoney(total, 0, '$') }}</p>
              </div>
              <p class="mt-0.5 text-xs font-bold text-secondary/40 uppercase tracking-widest mb-6">Envío e impuestos calculados al pagar.</p>
              <div class="mt-6 flex flex-col gap-3">
                <a 
                  href="/cart" 
                  @click="handleClose"
                  class="flex items-center justify-center rounded-xl border-2 border-primary py-3 px-6 text-sm font-black text-primary hover:bg-primary/5 transition-all duration-300 uppercase tracking-widest"
                >
                  Ver Carrito Completo
                </a>
                <a 
                  href="/checkout" 
                  @click="handleClose"
                  class="flex items-center justify-center rounded-xl bg-primary py-4 px-6 text-sm font-black text-white shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 uppercase tracking-widest"
                >
                  Ir al Pago
                </a>
              </div>
              <div class="mt-6 flex justify-center text-center text-sm text-secondary/40">
                <p>
                  o
                  <button type="button" class="font-bold text-primary hover:text-secondary transition-colors" @click="handleClose">
                    Continuar comprando
                    <span aria-hidden="true"> &rarr;</span>
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-in {
  animation: slide-in 0.5s ease-out;
}

@keyframes slide-in {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}
</style>
