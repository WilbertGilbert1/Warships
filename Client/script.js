import Experience from './Experience/Experience.js'
import { io } from 'socket.io-client'

const experience = new Experience(document.querySelector('canvas.webgl'))

//THIS IS AN EXAMPLE, MAKE IT IN A DIFF FILE
//Somehting like this.socket = io('http://localhost:3000') in your singleton


const socket = io('http://localhost:3000')

socket.on('connect', () => {
    console.log('Socket connected to server!')

    socket.emit('test', 'Message. Can be a JS object') //send smthn to server
})