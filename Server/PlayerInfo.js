import * as THREE from 'three'

export default class PlayerInfo
{
    constructor(id, username = 'Anonymous') // CHANGED: accept username
    {
        this.id = id
        this.username = username // CHANGED: store username
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
        }
        this.rudderAngle = 0
        this.hp = 100
        this.maxHp = 100 // CHANGED: base max HP, will be modified by upgrades
        this.alive = true
        this.kills = 0
        this.damageDealt = 0 // CHANGED: track damage dealt since respawn
        this.spawnTime = Date.now() // CHANGED: for tie‑breaker (time alive)
        this.ship = new THREE.Mesh(
            new THREE.BoxGeometry(2.4, 0.5, 0.5),
            new THREE.MeshBasicMaterial()
        )
        this.ship.position.y = 0.25
        this.ap =  true
        this.he = false
        this.fire = false

        // CHANGED: Coins and upgrades
        this.coins = 0
        this.upgrades = {
            speed: 0,           // max 8
            turnSpeed: 0,       // max 8
            acceleration: 0,    // max 8
            apDamage: 0,        // max 8
            heDamage: 0,        // max 8
            health: 0           // max 8
        }
    }
}
