import Experience from "../Experience.js"
import * as THREE from 'three'

export default class Ship
{
    constructor()
    {
        this.experience = new Experience()
        this.world = this.experience.world

        this.hp = ''
        this.speed = new THREE.Vector2()
        this.angle = ''
        this.reload = ''

        this.ship = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.5, 0.5),
            new THREE.MeshBasicMaterial({ wireframe: true, color: '#00ffff' })
        )
        this.ship.position.y += 0.25

        //Camera Test
        window.addEventListener('keydown', (event)=>
        {
            if(event.key == 'w')
            {
                this.ship.position.x += 0.25
                this.experience.camera.camera.position.x += 0.25
                this.experience.camera.controls.target = this.ship.position
            }
        })
        window.addEventListener('keydown', (event)=>
        {
            if(event.key == 's')
            {
                this.ship.position.x -= 0.25
                this.experience.camera.camera.position.x -= 0.25
                this.experience.camera.controls.target = this.ship.position
            }
        })
        window.addEventListener('keydown', (event)=>
        {
            if(event.key == 'a')
            {
                this.ship.position.z += 0.25
                this.experience.camera.camera.position.z += 0.25
                this.experience.camera.controls.target = this.ship.position
            }
        })
        window.addEventListener('keydown', (event)=>
        {
            if(event.key == 'd')
            {
                this.ship.position.z -= 0.25
                this.experience.camera.controls.target = this.ship.position
                this.experience.camera.camera.position.z -= 0.25
            }
        })
    }
}