import * as THREE from 'three'

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

        this.shell =
        {
            ifShell: false,
            position:
            {
                x: this.position.x,
                z: this.position.z,
                y: 0.25
            },
            angleXZ: 0,
            angleY: 0,
            speed: 0
        }
    }
}