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
</script>

<template>
  <div class="flex flex-col md:flex-row-reverse gap-4">
    <!-- Main Image Display -->
    <div id="gallery--product" class="grow">
      <div class="aspect-video md:aspect-4/3 rounded-2xl md:rounded-[2.5rem] overflow-hidden bg-accent relative group shadow-sm border border-secondary/5">
        <!-- Render current active image with PhotoSwipe link -->
         <a 
          :href="allImages[activeIndex].urlFull || allImages[activeIndex].url" 
          :data-pswp-width="allImages[activeIndex].width || 1200" 
          :data-pswp-height="allImages[activeIndex].height || 800"
          target="_blank"
          class="block w-full h-full"
        >
          <img 
            :src="allImages[activeIndex].url" 
            class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
          />
          
          <!-- Badge counter style MercadoLibre lower left -->
          <div class="absolute bottom-6 left-6 px-3 py-1 bg-black/70 backdrop-blur-md rounded-lg text-white text-xs font-bold">
            {{ activeIndex + 1 }} / {{ allImages.length }}
          </div>
        </a>

        <!-- Mobile hidden PhotoSwipe links (to allow swiping all images in lightbox) -->
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

    <!-- Thumbnails (Desktop) -->
    <div class="hidden md:flex flex-col gap-3 w-28 shrink-0">
      <button 
        v-for="(img, index) in allImages" 
        :key="index"
        @click="selectImage(index)"
        :class="[
          'aspect-square rounded-xl overflow-hidden border-2 transition-all p-0',
          activeIndex === index ? 'border-primary shadow-lg shadow-primary/20' : 'border-transparent opacity-60 hover:opacity-100'
        ]"
      >
        <img :src="img.url" class="w-full h-full object-cover" />
      </button>
    </div>

    <!-- Thumbnails (Mobile) -->
    <div class="flex md:hidden gap-3 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
       <button 
        v-for="(img, index) in allImages" 
        :key="'mob-' + index"
        @click="selectImage(index)"
        :class="[
          'w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all p-0',
          activeIndex === index ? 'border-primary' : 'border-transparent opacity-60'
        ]"
      >
        <img :src="img.url" class="w-full h-full object-cover" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
