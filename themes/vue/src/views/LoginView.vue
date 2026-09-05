<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loginRef = ref<HTMLElement>()

onMounted(() => {
  const remembered = localStorage.getItem('auth:remembered-username')
  if (remembered && loginRef.value) {
    loginRef.value.setAttribute('remembered-username', remembered)
  }
})

function onLoginSubmit() {
  setTimeout(() => { router.push('/') }, 600)
}
</script>

<template>
  <div class="flex flex-1 items-center justify-center">
    <login-panel ref="loginRef" @login-submit="onLoginSubmit"></login-panel>
  </div>
</template>