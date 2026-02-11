<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import 'photoswipe/style.css';

interface ImageData {
  url: string;
  urlFull?: string;
  width?: number;
  height?: number;
}

const props = defineProps<{
  mainImage: string;
  mainImageFull?: string;
  mainImageWidth?: number;
  mainImageHeight?: number;
  images: ImageData[];
}>();

// Construir array de imágenes con toda la información
const allImages = computed(() => {
  const main: ImageData = {
    url: props.mainImage,
    urlFull: props.mainImageFull || props.mainImage,
    width: props.mainImageWidth || 1200,
    height: props.mainImageHeight || 800
  };
  return [main, ...props.images];
});

const activeIndex = ref(0);

onMounted(() => {
  const lightbox = new PhotoSwipeLightbox({
    gallery: '#gallery--product',
    children: 'a',
    pswpModule: () => import('photoswipe'),
  });
  lightbox.init();
});

const selectImage = (index: number) => {
  activeIndex.value = index;
};

const prevImage = () => {
  activeIndex.value = activeIndex.value > 0 ? activeIndex.value - 1 : allImages.value.length - 1;
};

const nextImage = () => {
  activeIndex.value = activeIndex.value < allImages.value.length - 1 ? activeIndex.value + 1 : 0;
};
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Main Image Display -->
    <div id="gallery--product">
      <div class="aspect-video md:aspect-4/3 rounded-2xl md:rounded-[2.5rem] overflow-hidden bg-accent relative group shadow-sm border border-secondary/5">
        <!-- Render current active image with PhotoSwipe link (using urlFull for main display) -->
        <a 
          :href="allImages[activeIndex].urlFull || allImages[activeIndex].url" 
          :data-pswp-width="allImages[activeIndex].width || 1200" 
          :data-pswp-height="allImages[activeIndex].height || 800"
          target="_blank"
          class="block w-full h-full"
        >
          <img 
            :src="allImages[activeIndex].urlFull || allImages[activeIndex].url" 
            class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
          />
          
          <!-- Badge counter -->
          <div class="absolute bottom-6 left-6 px-3 py-1 bg-black/70 backdrop-blur-md rounded-lg text-white text-xs font-bold">
            {{ activeIndex + 1 }} / {{ allImages.length }}
          </div>
        </a>

        <!-- Prev / Next arrows -->
        <button 
          v-if="allImages.length > 1"
          @click.stop="prevImage"
          class="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <button 
          v-if="allImages.length > 1"
          @click.stop="nextImage"
          class="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>

        <!-- Hidden PhotoSwipe links (to allow swiping all images in lightbox) -->
        <div class="hidden">
          <a 
            v-for="(img, index) in allImages" 
            :key="'pswp-' + index"
            :href="img.urlFull || img.url" 
            :data-pswp-width="img.width || 1200" 
            :data-pswp-height="img.height || 800"
          ></a>
        </div>
      </div>
    </div>

    <!-- Thumbnails (horizontal scrollable) -->
    <div class="flex gap-3 overflow-x-auto pb-2">
      <button 
        v-for="(img, index) in allImages" 
        :key="index"
        @click="selectImage(index)"
        :class="[
          'w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all p-0',
          activeIndex === index ? 'border-primary shadow-lg shadow-primary/20' : 'border-transparent opacity-60 hover:opacity-100'
        ]"
      >
        <img :src="img.url" class="w-full h-full object-cover" />
      </button>
    </div>
  </div>
</template>

