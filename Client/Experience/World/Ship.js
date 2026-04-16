import Experience from "../Experience.js"
import * as THREE from 'three'
import OtherPlayer from "./OtherPlayer.js"
import World from "./World.js"
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { gsap } from 'https://unpkg.com/gsap@3.12.5/index.js?module';

const crosshair = document.querySelector('#crosshair')
const deathScreen = document.querySelector('#deathscreen')
const deathScreenPlay = document.querySelector('#deathscreenplay')
const actualHealth = document.querySelector('#actualhp')
const whiteHealth = document.querySelector('#whitehp')
const mapPointer = document.getElementById('mappointer')
const ap  = document.getElementById('ap')
const he = document.getElementById('he')
const heal = document.getElementById('heal')
const repair = document.getElementById('repair')
const nicknameInput = document.getElementById('nicknameInput')

// CHANGED: UI elements references
const playerNameDisplay = document.getElementById('playerNameDisplay')
const killCountSpan = document.getElementById('killCount')
const damageCountSpan = document.getElementById('damageCount')
const coinCountSpan = document.getElementById('coinCount')

export default class Ship
{
    constructor(world)
    {
        console.log(nicknameInput.value)
        this.experience = new Experience()
        this.world = world
        this.scene = this.experience.scene
        this.socket = this.experience.socket
        this.camera = this.experience.camera.camera
        this.shipGroup = this.world.shipGroup
        this.gltfLoader = new GLTFLoader()
        this.pointerLock = this.experience.camera.pointerLockControls
        this.controls =  this.experience.camera.controls
        this.healthTimeline = gsap.timeline()
        this.he = false
        this.ifShell = false
        this.fire = false

        this.controls.on = true
        window.gameControlsActive = true

        // CHANGED: Pass pointerLock reference to Experience for chat
        this.experience.pointerLock = this.pointerLock

        this.position = 
        {
            x: 0,
            z: 0,
            y: 0.25,
            angle: 0
        }
        this.hp = 100
        this.maxHp = 100
        this.kills = 0
        this.damage = 0
        this.coins = 0

        this.upgrades = {
            speed: 0,
            turnSpeed: 0,
            acceleration: 0,
            apDamage: 0,
            heDamage: 0,
            health: 0
        }

        let username = nicknameInput.value.trim()
        if (username === '') username = 'Player'
        playerNameDisplay.textContent = username
        this.socket.emit('setUsername', username)

        this.gltfLoader.load(
        '/Experience/Models/ship.glb',
        (gltf) =>
        {
            while(gltf.scene.children.length)
            {
                gltf.scene.children[0].position.x += 0.45
                this.shipGroup.add(gltf.scene.children[0])
            }
        }
        )

        this.ambientLight = new THREE.AmbientLight(0xffffff, 10)
        this.scene.add(this.ambientLight)
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.9)
        this.scene.add(this.directionalLight)

        this.raycaster = new THREE.Raycaster()
        this.mouse = new THREE.Vector2(0, 0)

        this.horizontalLengthToShellTarget = 0
        this.shellAngle = 0

        // Key handlers ignore chat input
        window.addEventListener('keydown', (event)=>
        {
            const chatInput = document.getElementById('chatInput')
            if (document.activeElement === chatInput) return
            this.socket.emit('keydown', (event.key))
        })
        window.addEventListener('keyup', (event)=>
        {
            const chatInput = document.getElementById('chatInput')
            if (document.activeElement === chatInput) return
            this.socket.emit('keyup', (event.key))
        })

        // Upgrade keys
        window.addEventListener('keydown', (e) => {
            const chatInput = document.getElementById('chatInput')
            if (document.activeElement === chatInput) return
            const key = e.key
            const statMap = {
                '5': 'speed',
                '6': 'turnSpeed',
                '7': 'acceleration',
                '8': 'apDamage',
                '9': 'heDamage',
                '0': 'health'
            }
            if (statMap[key]) {
                this.socket.emit('upgrade', statMap[key])
            }
        })

        this.otherPlayers = {}

        this.socket.on(
            'initialData',
            (players) =>
            {
                for(const id in players)
                {
                    if(id != this.socket.id)
                    {
                        this.otherPlayers[id] = new OtherPlayer(id)
                    } else {
                        this.kills = players[id].kills || 0
                        this.damage = players[id].damageDealt || 0
                        this.coins = players[id].coins || 0
                        this.hp = players[id].hp
                        this.maxHp = players[id].maxHp || 100
                        if (players[id].upgrades) {
                            this.upgrades = {...players[id].upgrades}
                        }
                        this.updatePersonalStats()
                        this.updateUpgradeBars()
                        this.updateHealthBar()
                    }
                }
                addPlayers()
            }
        )

        const addPlayers = () =>
        {
            for(const id in this.otherPlayers)
            {
                if(!this.otherPlayers[id].loaded)
                {
                    this.gltfLoader.load(
                    '/Experience/Models/ship.glb',
                    (gltf) =>
                    {
                        while(gltf.scene.children.length)
                        {
                            gltf.scene.children[0].position.x += 0.45
                            this.otherPlayers[id].shipGroup.add(gltf.scene.children[0])
                        }
                    }
                    )
                    this.scene.add(this.otherPlayers[id].shipGroup)   
                }
                this.otherPlayers[id].loaded = true
            }
        }

        this.socket.on('positions', (players) =>
        {
            for(const id in players)
            {
                if(this.socket.id == id) 
                {
                    this.position.x = players[id].position.x
                    this.position.z = players[id].position.z
                    this.angle = players[id].angle
                    if (players[id].kills !== undefined) this.kills = players[id].kills
                    if (players[id].damageDealt !== undefined) this.damage = players[id].damageDealt
                    if (players[id].coins !== undefined) this.coins = players[id].coins
                    if (players[id].hp !== undefined) {
                        this.hp = players[id].hp
                        this.maxHp = players[id].maxHp || 100
                        this.updateHealthBar()
                    }
                    if (players[id].upgrades) {
                        this.upgrades = {...players[id].upgrades}
                        this.updateUpgradeBars()
                    }
                    this.updatePersonalStats()
                }
                else
                {
                    this.otherPlayers[id].position.x = players[id].position.x
                    this.otherPlayers[id].position.z = players[id].position.z
                    this.otherPlayers[id].angle = players[id].angle
                }
            }
        })

        this.socket.on('upgradeResult', (data) => {
            if (data.success) {
                this.upgrades[data.stat] = data.level
                this.coins = data.coins
                if (data.hp !== undefined) {
                    this.hp = data.hp
                    this.maxHp = data.maxHp
                    this.updateHealthBar()
                }
                this.updatePersonalStats()
                this.updateUpgradeBars()
            }
        })

        this.socket.on('player disconnect', (id) =>
        {
            if (!this.otherPlayers[id]) return
            const player = this.otherPlayers[id]
            const group = player.shipGroup
            this.scene.remove(group)
            group.traverse((child) => {
                if (child.isMesh) {
                    if (child.geometry) child.geometry.dispose()
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(m => m.dispose())
                        } else {
                            child.material.dispose()
                        }
                    }
                }
            })
            delete this.otherPlayers[id]
        })

        this.shells = {}

        window.addEventListener('click', (event) =>
        {
            if(this.controls.on)
            {
                this.ifShell = true
                crosshair.style.backgroundColor = 'red'
                let worldQuaternion = new THREE.Quaternion()
                this.camera.getWorldQuaternion(worldQuaternion)
                let worldEuler = new THREE.Euler().setFromQuaternion(worldQuaternion, 'YXZ')
                let absoluteRotationY = worldEuler.y + Math.PI
                this.socket.emit('click', event, absoluteRotationY, this.rayIntersectOcean)
            }
        })

        this.socket.on('shellFired', (shellId, socketId) =>
        {
            let shell = new THREE.Mesh(
                new THREE.SphereGeometry(0.05, 8, 8),
                new THREE.MeshBasicMaterial({ wireframe: false, color: '#ffffff' })
            )

            this.fireShell(shellId, shell)

            setTimeout(
                this.deleteShell,
                4000,
                shell,
                socketId,
            )

            this.shells[socketId] = shell
        })

        this.socket.on('shellPositions', (shellPosition, shellId) =>
        {
            if(this.shells[shellId] != undefined)
            {
                this.shells[shellId].position.x = shellPosition.x
                this.shells[shellId].position.z = shellPosition.z
                this.shells[shellId].position.y = shellPosition.y
            }
        })

        deathScreenPlay.addEventListener('click', ()=>
        {
            this.socket.emit('respawn', this.socket.id)
            deathScreen.style.visibility = 'hidden'
            crosshair.style.visibility = 'visible'
            this.controls.on = true
            window.gameControlsActive = true
            this.pointerLock.lock()
            this.shipGroup.visible = true
            this.hp = this.maxHp
            this.updateHealthBar()
            actualHealth.style.visibility = 'visible'
            whiteHealth.style.visibility = 'visible'

            this.kills = 0
            this.damage = 0
            this.updatePersonalStats()
        })

        this.socket.on('playerHit', (shellId, playerId, shipPart, ifHe) =>
        {
            if(this.shells[shellId] != undefined) this.shells[shellId].visible = false
            if(playerId == this.socket.id)
            {
                this.updateHealthBar()
            }
        })

        this.socket.on('respawnFromServer', (id) =>
        {
            if(id != this.socket.id)
            {
                setTimeout(() =>
                {
                    this.otherPlayers[id].shipGroup.visible = true
                }, 100)
                this.otherPlayers[id].hp = 100
            }
        })
        
        this.socket.on('disconnect', () => 
        {
            setTimeout(() => {
                window.location.reload()
            }, 1000)
        })

        window.addEventListener('keyup', (event) =>
        {
            const chatInput = document.getElementById('chatInput')
            if (document.activeElement === chatInput) return
            if(event.key === '2' && !this.ifShell)
            {
                if(!this.he)
                {
                    this.ifShell = true
                    he.style.outlineColor = 'rgb(255, 210, 210)'
                    he.style.outlineWidth = '2px'
                    ap.style.outlineColor = 'white'
                    ap.style.outlineWidth = '1px'
                    this.he = true
                    crosshair.style.backgroundColor = 'red'
                    setTimeout(() => {
                        crosshair.style.backgroundColor = '#1ed1d1'
                        this.ifShell = false
                    }, 4000)
                    this.socket.emit('toHe', this.socket.id)
                }
            }
            else if(event.key === '1' && !this.ifShell)
            {
                if(this.he)
                {
                    this.ifShell = true
                    ap.style.outlineColor = 'rgb(255, 210, 210)'
                    ap.style.outlineWidth = '2px'
                    he.style.outlineColor = 'white'
                    he.style.outlineWidth = '1px'
                    this.he = false
                    crosshair.style.backgroundColor = 'red'
                    setTimeout(() => {
                        crosshair.style.backgroundColor = '#1ed1d1'
                        this.ifShell = false
                    }, 4000)
                    this.socket.emit('toAp', this.socket.id)
                }
            }
        })
    }

    updatePersonalStats() {
        killCountSpan.textContent = this.kills
        damageCountSpan.textContent = this.damage
        coinCountSpan.textContent = this.coins
    }

    updateUpgradeBars() {
        for (const stat in this.upgrades) {
            const bar = document.getElementById(`upgrade-${stat}`)
            if (bar) {
                bar.style.width = (this.upgrades[stat] / 8 * 100) + '%'
            }
        }
    }

    updateHealthBar() {
        const percent = (this.hp / this.maxHp) * 100
        actualHealth.style.width = percent + '%'
        whiteHealth.style.width = percent + '%'
    }

    disposeHierarchy = (child) =>
    {
        if( child instanceof THREE.Mesh)
        {
            if(child.geometry) child.geometry.dispose()
            if(child.material) child.material.dispose()
            if (child.parent) child.parent.remove(child)
        }
    }

    fireShell = (shellId, shell) =>
    {
        shell.position.y += 0.5
        shell.position.z = shellId.position.z
        shell.position.x = shellId.position.x
        this.scene.add(shell)
    }

    deleteShell = (shell, shellId) =>
    {
        if(shellId == this.socket.id)
        {
            crosshair.style.backgroundColor = '#1ed1d1'
            this.ifShell = false
        }
        this.scene.remove(shell)
        shell.material.dispose()
        shell.geometry.dispose()
        delete this.shells[shellId]
    }

    update = () =>
    {
        for(let id in this.otherPlayers)
        {
            this.otherPlayers[id].shipGroup.position.x = this.otherPlayers[id].position.x
            this.otherPlayers[id].shipGroup.position.z = this.otherPlayers[id].position.z
            this.otherPlayers[id].shipGroup.rotation.y = -this.otherPlayers[id].angle

            this.otherPlayers[id].shipGroup.visible = this.otherPlayers[id].hp > 0

            if(this.otherPlayers[id].fire) this.otherPlayers[id].fire -= 0.083
        }
        this.shipGroup.position.x = this.position.x
        this.shipGroup.position.z = this.position.z
        this.shipGroup.rotation.y = -this.angle

        this.raycaster.setFromCamera(this.mouse, this.camera)
        this.rayIntersectOcean = this.raycaster.intersectObject(this.world.ocean.ocean)

        mapPointer.style.top = 50 - (this.shipGroup.position.x)  -  parseFloat(window.getComputedStyle(mapPointer).height)/(2*window.innerWidth*0.18)*100+ "%"
        mapPointer.style.left = 50 + (this.shipGroup.position.z)  -  parseFloat(window.getComputedStyle(mapPointer).width)/(2*window.innerWidth*0.18)*100+ "%"
        mapPointer.style.transform = `rotate(${-this.shipGroup.rotation.y / (2*Math.PI) * 360 }deg)`

        if(this.hp <= 0)
        {
            this.controls.on = false
            window.gameControlsActive = false
            this.pointerLock.unlock()
            this.shipGroup.visible = false
            deathScreen.style.visibility = 'visible'
            document.body.style.cursor = 'auto'
            crosshair.style.visibility = 'hidden'
        }
    }
}
