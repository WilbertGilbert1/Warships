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
        // this.socket = io('http://192.168.0.65:3000')
       
        // Fields
        this.shipGroup = new THREE.Group()
        this.canvas = canvas
        this.sizes = new Sizes()
        this.time = new Time()
        this.scene = new THREE.Scene()
        this.camera = new Camera(this)
        this.world = new World()
       
        this.renderer = new Renderer()

        this.axesHelper = new THREE.AxesHelper(5)
        this.scene.add(this.axesHelper)
        this.axesHelper.position.y += 0.01
        this.axesHelper.position.z += 0.01
        this.axesHelper.position.x += 0.01

        this.gridHelper = new THREE.GridHelper(200, 200)
        this.scene.add(this.gridHelper)
        this.gridHelper.position.y += 0.0099

        this.scene.add(this.shipGroup)
        

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