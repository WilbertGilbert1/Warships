import Camera from "./Camera.js"
import Renderer from "./Renderer.js"
import Sizes from "./Utils/Sizes.js"
import Time from "./Utils/Time.js"
import * as THREE from 'three'
import World from "./World/World.js"
import { io } from 'socket.io-client'

let instance = null

export default class Experience
{
    constructor(canvas)
    {
        if(instance)
        {
            return instance
        }
        instance = this

        //Server
        this.socket = io('http://localhost:3000')
        // this.socket = io('http://192.168.0.65:3000/')
       
        // Fields
        this.shipGroup = new THREE.Group()
        this.canvas = canvas
        this.sizes = new Sizes()
        this.time = new Time()
        this.scene = new THREE.Scene()
        this.camera = new Camera(this)
        this.world = new World()
       
        this.renderer = new Renderer()

        this.scene.add(this.shipGroup)
        
        // CHANGED: Set up chat and UI listeners
        this.setupChat()

        this.socket.on('connect', () => {
            console.log('Socket connected to server!')
        })

        this.sizes.on('resize', () =>
        {
            this.resize()
        })

        this.time.on('tick', () =>
        {
            this.update()
        })
    }

    // CHANGED: Chat with proper pointer lock handling
    setupChat() {
        const chatInput = document.getElementById('chatInput')
        const chatMessages = document.getElementById('chatMessages')
        
        // Reference to pointer lock (set by Ship)
        this.pointerLock = null
        
        let isChatActive = false

        // Exit chat mode: disable input, blur, and re‑lock pointer
        const exitChatMode = () => {
            if (!isChatActive) return
            isChatActive = false
            chatInput.disabled = true
            chatInput.blur()
            
            // Re‑lock pointer if game is active and we're not dead
            if (this.pointerLock && window.gameControlsActive) {
                // Small delay to allow UI to settle
                setTimeout(() => {
                    if (window.gameControlsActive && this.pointerLock) {
                        this.pointerLock.lock()
                    }
                }, 20)
            }
        }

        // Activate chat: exit pointer lock, enable input, focus
        const activateChat = () => {
            if (isChatActive) return
            
            // CHANGED: Exit pointer lock to allow input focus
            if (document.pointerLockElement) {
                document.exitPointerLock()
            }
            
            isChatActive = true
            chatInput.disabled = false
            // Small delay to ensure pointer lock is fully released
            setTimeout(() => {
                chatInput.focus()
            }, 10)
        }

        // Global Enter key – activate chat
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !isChatActive) {
                // Only if game controls are active (not dead)
                if (!window.gameControlsActive) return
                e.preventDefault()
                activateChat()
            }
        })

        // Chat input key handling
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault()
                const message = chatInput.value.trim()
                if (message !== '') {
                    this.socket.emit('chatMessage', message)
                }
                chatInput.value = ''
                exitChatMode()
            }
            if (e.key === 'Escape') {
                e.preventDefault()
                chatInput.value = ''
                exitChatMode()
            }
        })

        // If input loses focus (e.g., clicking elsewhere), exit chat
        chatInput.addEventListener('blur', () => {
            if (isChatActive) {
                exitChatMode()
            }
        })

        // Incoming chat messages
        this.socket.on('chatMessage', ({ sender, message, isTop }) => {
            const msgDiv = document.createElement('div')
            msgDiv.className = 'chatMessage'
            const senderSpan = document.createElement('span')
            senderSpan.className = 'chatSender' + (isTop ? ' gold' : '')
            senderSpan.textContent = sender + ':'
            msgDiv.appendChild(senderSpan)
            msgDiv.appendChild(document.createTextNode(' ' + message))
            chatMessages.appendChild(msgDiv)
            chatMessages.scrollTop = chatMessages.scrollHeight
            while (chatMessages.children.length > 50) {
                chatMessages.removeChild(chatMessages.firstChild)
            }
        })

        // Kill feed
        const killFeed = document.getElementById('killFeed')
        this.socket.on('killFeed', ({ killer, victim }) => {
            const item = document.createElement('div')
            item.className = 'killFeedItem'
            item.textContent = `${killer} killed ${victim}`
            killFeed.appendChild(item)
            setTimeout(() => {
                if (item.parentNode) item.remove()
            }, 5000)
            while (killFeed.children.length > 5) {
                killFeed.removeChild(killFeed.firstChild)
            }
        })

        // Leaderboard update
        const leaderboardList = document.getElementById('leaderboardList')
        this.socket.on('leaderboard', (entries) => {
            leaderboardList.innerHTML = ''
            entries.forEach(entry => {
                const row = document.createElement('div')
                row.className = 'leaderboardEntry'
                row.innerHTML = `
                    <span class="name">${entry.username}</span>
                    <span class="stats">${entry.kills}⚔️ ${entry.damage}</span>
                `
                leaderboardList.appendChild(row)
            })
        })
    }

    update()
    {
        this.renderer.update()
        this.camera.update()
        this.world.update()
    }

    resize()
    {
        console.log("resize");
        
        this.renderer.resize()
        this.camera.resize()
    }
}
