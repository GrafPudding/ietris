<script setup>
import { ref } from 'vue'
import Lobby from './components/Lobby.vue'
import GameEngine from './components/GameEngine.vue'
const lobbyRef = ref(null)
</script>

<template>
  <div class="app">
    <header>
      <h1>Typing Autist Test</h1>
      <p>Type the words as quickly and accurately as possible, ninja!</p>
    </header>

    <main>
      <Lobby ref="lobbyRef" />
      <GameEngine :room-id="lobbyRef?.currentRoom ?? ''" />
    </main>
  </div>
</template>

<style scoped>

.app {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  max-width: 1200px;
  margin: 0 auto;
  padding: 80px;
  text-align: center;
}

header {
  text-align: center;
  margin-bottom: 20px;
}

h1 {
  color: #42b983;
  font-size: 2.5em;
  margin-bottom: 10px;
}

p {
  color: #666;
  font-size: 1.2em;
}
</style>
