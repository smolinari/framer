<script setup>
import DefaultTheme from 'vitepress/theme'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #home-hero-image>
      <div class="video-responsive-container">
        <iframe 
          src="https://www.youtube.com/embed/ZrrCSAScVF0" 
          frameborder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowfullscreen>
        </iframe>
      </div>
    </template>

    <!-- This single slot now contains ALL buttons -->
    <template #home-hero-after>
      <div class="all-buttons-section"> 
        <!-- Releases Section -->
        <div class="releases-group">
          <h2>Releases Coming Soon!</h2>
          <div class="button-group">
            <a class="VPButton alt">macOS</a>
          </div>
        </div>
      </div>
    </template>
  </Layout>
</template>