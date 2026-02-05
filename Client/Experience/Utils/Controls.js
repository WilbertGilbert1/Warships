import * as THREE from 'three'
import World from '../World/World.js'

export default class Controls {
    constructor(camera, canvas,controls) 
    {
        document.body.style.cursor = 'none'

        this.camera = camera
        this.canvas = canvas
        this.controls = controls
        this.zoom = false

        document.addEventListener('keyup', (event) =>
        {
            if(!this.zoom && event.key == 'Shift')
            {
                this.camera.fov = 40
                this.controls.pointerSpeed = 0.5
                this.camera.updateProjectionMatrix()
                this.zoom = true
            }
            else if(this.zoom && event.key == 'Shift')
            {
                this.camera.fov = 75
                this.controls.pointerSpeed = 1
                this.camera.updateProjectionMatrix()
                this.zoom = false
            }
        })
    }

    update()
    {

    }
}