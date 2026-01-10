import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import Experience from './Experience'
import World from './World/World.js'

export default class Camera
{
    constructor(experience)
    {
        this.experience = new Experience()
        this.world = this.experience.world
        this.sizes = this.experience.sizes
        this.scene = this.experience.scene
        this.canvas = this.experience.canvas
        console.log(this.sizes.width,this.sizes.height);
        
        this.camera = new THREE.PerspectiveCamera(40, this.sizes.width / this.sizes.height, 0.1, 100)
        this.camera.position.set(6, 4, 8)
        this.scene.add(this.camera)

        this.controls = new OrbitControls(this.camera, this.canvas)
        this.controls.enableDamping = true
        this.controls.enablePan = false
        this.controls.minDistance = 4
        this.controls.maxDistance = 20
        this.controls.maxPolarAngle = Math.PI/2 - 0.1
    }

    resize()
    {
        this.camera.aspect = this.sizes.width / this.sizes.height
        this.camera.updateProjectionMatrix()
    }

    update()
    {
        this.controls.update()
        this.controls.target = this.world.ship.position
    }
}