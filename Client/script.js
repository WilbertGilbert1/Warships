import Experience from './Experience/Experience.js'
import { io } from 'socket.io-client'

const experience = new Experience(document.querySelector('canvas.webgl'))

const socket = io('http://localhost:3000')

socket.on('connect', () => {
    console.log('Socket connected to server!')

    socket.emit('test', 'Message. Can be a JS object') //send smthn to server
})