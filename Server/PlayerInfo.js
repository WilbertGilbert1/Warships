import * as THREE from 'three'

export default class PlayerInfo
{
    constructor(id)
    {
        this.id = id
        this.keys = 
        {
            w: false,
            a: false,
            s: false,
            d: false,
        }
        this.speed = 0
        this.angle = 0
        this.position =
        {
            x: 0,
            z: 0
        }
        this.shell =
        {
            ifShell: false,
            position:
            {
                x: this.position.x,
                z: this.position.z,
                y: 1.5
            },
            vectorPosition: new THREE.Vector3(0, 0, 0),
            angleXZ: 0,
            angleY: 0,
            speed: 0.14 * 100,
            speedY: 0,
            speedX: 0,
            speedZ: 0,
            hitPlayer: false,
            velocity: new THREE.Vector3(0, 0, 0),
        },
        this.rudderAngle = 0
        this.hp = 100
        this.alive = true
        this.kills = 0
        this.ship = new THREE.Mesh(
            new THREE.BoxGeometry(2.4, 0.5, 0.5),
            new THREE.MeshBasicMaterial()
        )
        this.ship.position.y = 0.25
        this.ap =  true
        this.he = false
        this.fire = false
    }
}