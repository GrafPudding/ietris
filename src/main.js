import './assets/main.css'
import { createApp } from 'vue'
import App from './App.vue'
import comm from './comm/comm'

const username = localStorage.getItem("username") || `guest_${Math.random().toString(36).slice(2,6)}`
localStorage.setItem("username", username)
comm.connect({ username })

createApp(App).mount('#app')