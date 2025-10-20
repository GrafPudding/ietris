<script setup>
import { ref, computed, onUnmounted } from 'vue';

const gameState = ref({
  words: [
    { id: 1, text: 'programming', status: 'pending' },
    { id: 2, text: 'javascript', status: 'pending' },
    { id: 3, text: 'vuejs', status: 'pending' },
    { id: 4, text: 'component', status: 'pending' },
    { id: 5, text: 'reactive', status: 'pending' }
  ],
  currentWordIndex: 0,
  inputText: '',
  statistics: [],
  gameStarted: false,
  gameFinished: false,
  totalTime: 0,
  errors: 0
});

const currentWord = computed(() => {
  return gameState.value.words[gameState.value.currentWordIndex];
});

const averageWPM = computed(() => {
  if (gameState.value.gameFinished && gameState.value.totalTime > 0) {
    const minutes = gameState.value.totalTime / 60000; // Convert ms to minutes
    const wordsTyped = gameState.value.words.length;
    return Math.round(wordsTyped / minutes);
  }
  return 0;
});

const accuracy = computed(() => {
  if (gameState.value.gameFinished) {
    const totalCharacters = gameState.value.words.reduce((acc, word) => acc + word.text.length, 0);
    return Math.round(((totalCharacters - gameState.value.errors) / totalCharacters) * 100);
  }
  return 100;
});

let startTime = 0;
let timerInterval = null;

function startTimer() {
  startTime = Date.now();
  timerInterval = setInterval(() => {
    if (!gameState.value.gameFinished) {
      gameState.value.totalTime = Date.now() - startTime;
    }
  }, 100);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
}

onUnmounted(() => {
  stopTimer();
});

function checkTyping() {
  if (!gameState.value.gameStarted && gameState.value.inputText.length === 1) {
    gameState.value.gameStarted = true;
    startTimer();
  }

  const currentTyped = gameState.value.inputText;
  const targetWord = currentWord.value.text;
  
  // Check for errors
  if (currentTyped.length > 0) {
    const lastChar = currentTyped[currentTyped.length - 1];
    const targetChar = targetWord[currentTyped.length - 1];
    if (lastChar !== targetChar) {
      gameState.value.errors++;
    }
  }

  // Check if word is completed
  if (currentTyped === targetWord) {
    currentWord.value.status = 'completed';
    gameState.value.currentWordIndex++;
    gameState.value.inputText = '';

    if (gameState.value.currentWordIndex >= gameState.value.words.length) {
      gameState.value.gameFinished = true;
      stopTimer();
    }
  }
}
</script>

<template>
  <div class="game-engine">
    <div class="timer" :class="{ 'finished': gameState.gameFinished }">
      {{ Math.floor(gameState.totalTime / 1000) }}s
    </div>
    
    <div class="words-container">
      <div 
        v-for="(word, index) in gameState.words" 
        :key="word.id"
        class="word"
        :class="{
          'word-active': index === gameState.currentWordIndex,
          'word-completed': word.status === 'completed'
        }"
      >
        {{ word.text }}
      </div>
    </div>

    <input 
      type="text" 
      class="text-input"
      v-model="gameState.inputText"
      @input="checkTyping"
      :disabled="gameState.gameFinished"
      :placeholder="gameState.gameFinished ? 'Game finished!' : 'Start typing...'"
    />

    <div v-if="gameState.gameFinished" class="results">
      <h3>Results:</h3>
      <p>Time: {{ Math.floor(gameState.totalTime / 1000) }} seconds</p>
      <p>Speed: {{ averageWPM }} WPM</p>
      <p>Accuracy: {{ accuracy }}/100</p>
      <p>Errors: {{ gameState.errors }}</p>
    </div>
  </div>
</template>

<style scoped>
.game-engine {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.timer {
  font-size: 2em;
  text-align: center;
  margin-bottom: 20px;
  color: #42b983;
}

.timer.finished {
  color: #666;
}

.words-container {
  margin: 20px 0;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
  line-height: 1.6;
}

.word {
  display: inline-block;
  margin: 0 8px;
  color: #666;
}

.word-active {
  color: #42b983;
  font-weight: bold;
}

.word-completed {
  color: #999;
  text-decoration: line-through;
}

.text-input {
  width: 100%;
  padding: 12px;
  font-size: 1.2em;
  border: 2px solid #42b983;
  border-radius: 4px;
  margin: 20px 0;
}

.text-input:disabled {
  background: #f5f5f5;
  border-color: #ccc;
}

.results {
  text-align: center;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 8px;
  margin-top: 20px;
  color: #222;
}

.results h3 {
  color: #42b983;
  margin-bottom: 15px;
}
</style>