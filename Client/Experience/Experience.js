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
        
        this.canvas = canvas
        this.sizes = new Sizes()
        this.time = new Time()
        this.scene = new THREE.Scene()
        this.world = new World()
        this.camera = new Camera(this)
        this.renderer = new Renderer()

        this.axesHelper = new THREE.AxesHelper(5)
        this.scene.add(this.axesHelper)

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