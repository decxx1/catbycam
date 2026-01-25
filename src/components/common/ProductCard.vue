<script setup lang="ts">
import { formatMoney } from "@/utils/formatters";

const props = defineProps<{
  title: string;
  category: string;
  image: string;
  price?: number;
}>();

</script>

<template>
  <div class="group bg-white rounded-2xl overflow-hidden border border-secondary/5 hover:border-primary/20 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 flex flex-col h-full text-left">
    <div class="relative aspect-square overflow-hidden bg-accent shrink-0">
      <img
        :src="image"
        :alt="title"
        class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div class="absolute top-4 left-4">
        <span class="bg-primary text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full italic">
          {{ category }}
        </span>
      </div>
    </div>

    <div class="p-6 flex flex-col grow gap-2">
      <h3 class="font-black text-lg group-hover:text-primary transition-colors duration-300 leading-tight">
        {{ title }}
      </h3>
      <div class="mt-auto pt-2 flex flex-col gap-1">
        <span v-if="price !== undefined" class="text-secondary font-black text-2xl tracking-tighter">
          {{ formatMoney(price, 0, '$') }}
        </span>
        <div class="text-[10px] font-black uppercase tracking-widest text-secondary/30 flex items-center gap-1 transition-colors group-hover:text-primary">
          Vista Previa
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"></path></svg>
        </div>
      </div>
    </div>
  </div>
</template>

