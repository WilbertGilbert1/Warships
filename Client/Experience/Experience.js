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
        
        this.canvas = canvas
        this.sizes = new Sizes()
        this.time = new Time()
        this.scene = new THREE.Scene()
        this.camera = new Camera(this)
        this.renderer = new Renderer()
        this.socket = io('http://localhost:3000')
        this.world = new World()

        this.socket.on('connect', () => {
        console.log('Socket connected to server!')

        this.socket.emit('test', 'Message. Can be a JS object') 
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

    update()
    {
        this.camera.controls.update()
        this.renderer.update()
    }

    resize()
    {
        console.log("resize");
        
        this.camera.resize()
        this.renderer.resize()
    }
}