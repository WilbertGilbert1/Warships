import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

export default class OtherPlayer
{
    constructor(id)
    {
        this.id = id
        this.speed = 0
        this.angle = 0
        this.position =
        {
            x: 0,
            z: 0
        }

        this.ship = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.5, 0.5),
            new THREE.MeshBasicMaterial({ wireframe: true, color: '#00ffff' })
        )
        this.ship.position.y += 0.25
        this.ship.position.x = 0
        this.ship.position.z = 0
        this.shipGroup = new THREE.Group()
        this.shipGroup.add(this.ship)

        this.ship1 = new THREE.Mesh(
            new THREE.BoxGeometry(2.4, 0.5, 0.5),
            new THREE.MeshBasicMaterial({ wireframe: true, color: '#ff00ee' })
        )
        this.ship1.position.y += 0.25
        this.ship1.position.x += 0.5
        this.shipGroup.add(this.ship1)

        //Models
        this.gltfLoader = new GLTFLoader()

        this.shell =
        {
            ifShell: false,
            position:
            {
                x: this.position.x,
                z: this.position.z,
                y: 1.5
            },
            angleXZ: 0,
            angleY: 0,
            speed: 0.14 * 120,
            speedVerticle: 0
        }
        this.hp = 100
    }
}