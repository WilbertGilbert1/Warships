import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import Experience from './Experience.js'
import World from './World/World.js'
import Controls from './Utils/Controls.js'
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js'

export default class Camera
{
    constructor(experience)
    {
        this.experience = new Experience()
        this.world = this.experience.world
        this.sizes = this.experience.sizes
        this.scene = this.experience.scene
        this.canvas = this.experience.canvas
        this.shipGroup = this.experience.shipGroup
        console.log(this.sizes.width,this.sizes.height);
        
        this.camera = new THREE.PerspectiveCamera(80, this.sizes.width / this.sizes.height, 0.1, 100)
        this.camera.position.set(0, 0.75, 0)
        this.shipGroup.add(this.camera)
        this.cameraRotation = this.camera.rotation.y

        // this.controls = new OrbitControls(this.camera, this.canvas)
        // this.controls.enableDamping = true
        // this.controls.enablePan = false
        // this.controls.minDistance = 4
        // this.controls.maxDistance = 20
        // this.controls.maxPolarAngle = Math.PI/2 - 0.1

        this.pointerLockControls = new PointerLockControls(this.camera, this.canvas)
        document.addEventListener('click', (event) =>
        {
            this.pointerLockControls.lock()
        })

        this.controls = new Controls(this.camera, this.canvas, this.pointerLockControls)
    }

    resize()
    {
        this.camera.aspect = this.sizes.width / this.sizes.height
        this.camera.updateProjectionMatrix()
    }

    update()
    {
        this.cameraRotation = this.camera.rotation.y
        // this.controls.target = this.ship.ship.position
    }
}