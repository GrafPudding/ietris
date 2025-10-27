<template>
  <div class="lobby">
    <input v-model="roomId" placeholder="Room ID (e.g., room1)" @keyup.enter="join"/>
    <button @click="join">Join</button>

    <div v-if="currentRoom" class="room">
      <p><strong>Room:</strong> {{ currentRoom }}</p>
      <p><strong>Players:</strong> {{ players.map(p=>p.username).join(', ') || '—' }}</p>
      <div class="chat">
        <div v-for="m in chat" :key="m.ts">{{ m.from }}: {{ m.text }}</div>
      </div>
      <input v-model="draft" placeholder="Say hi…" @keyup.enter="send"/>
      <button @click="send">Send</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, defineExpose } from 'vue'
import comm from '@/comm/comm'

const roomId = ref('')
const currentRoom = ref('')
const players = ref([])
const started = ref(false)
const chat = ref([])
const draft = ref('')

defineExpose({ currentRoom, started })

function join() {
  if (!roomId.value) return
  comm.joinRoom(roomId.value)
}

function send() {
  if (!currentRoom.value || !draft.value) return
  comm.sendChat(currentRoom.value, draft.value)
  draft.value = ''
}

let off = []
onMounted(() => {
  off.push(
    comm.on('room:state', ({ roomId:r, players:p, started:s }) => {
      currentRoom.value = r; players.value = p; started.value = s;
    }),
    comm.on('room:user:joined', (p) => {
      players.value = [...players.value.filter(x => x.id !== p.id), p]
    }),
    comm.on('room:user:left', (p) => {
      players.value = players.value.filter(x => x.id !== p.id)
    }),
    comm.on('chat:new', (m) => chat.value.push(m)),
    comm.on('game:start', () => { started.value = true })
  )
})
onBeforeUnmount(() => { off.forEach(fn => fn()); })
</script>

<style scoped>
.lobby { display:grid; gap:.5rem; margin-bottom:1rem; max-width:520px }
.chat { border:1px solid #ddd; padding:.5rem; height:120px; overflow:auto; margin:.5rem 0; }
</style>