import Experience from "../Experience.js"
import * as THREE from 'three'

export default class Ship
{
    constructor()
    {
        this.experience = new Experience()
        this.world = this.experience.world
        this.socket = this.experience.socket

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
                //Server test
                this.socket.emit('keydown', event.key)
        })
        window.addEventListener('keyup', (event)=>
        {
                //Server test
                this.socket.emit('keyup', event.key)          
        })
    }
}