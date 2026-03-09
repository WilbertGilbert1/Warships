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

export default class Ship
{
    constructor(world)
    {
        this.experience = new Experience()
        this.world = world
        this.scene = this.experience.scene
        this.socket = this.experience.socket
        this.camera = this.experience.camera.camera
        this.shipGroup = this.world.shipGroup
        this.gltfLoader = new GLTFLoader()
        this.pointerLock = this.experience.camera.pointerLockControls
        this.controls =  this.experience.camera.controls

        this.controls.on = true

        this.position = 
        {
            x: 0,
            z: 0,
            y: 0.25,
            angle: 0
        }
        this.hp = 100

        //Models
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

        this.ship1 = new THREE.Mesh(
            new THREE.BoxGeometry(2.4, 0.5, 0.5),
            new THREE.MeshBasicMaterial({ wireframe: true, color: '#ff00ee' })
        )
        this.ship1.position.y += 0.25
         this.ship1.position.x += 0.35
        this.shipGroup.add(this.ship1)

        this.ambientLight = new THREE.AmbientLight(0xffffff, 10)
        this.scene.add(this.ambientLight)
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.9)
        this.scene.add(this.directionalLight)

        
        // Raycaster
        this.raycaster = new THREE.Raycaster()
        this.mouse = new THREE.Vector2(0, 0)

        //Ship
        this.ship = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.5, 0.5),
            new THREE.MeshBasicMaterial({ wireframe: true, color: '#7b0808' })
        )
        this.ship.position.y += 0.25


        // Variables for finding initial verticle shell velocity
        this.horizontalLengthToShellTarget = 0
        this.shellAngle = 0


        //Camera
        window.addEventListener('keydown', (event)=>
        {
            this.socket.emit('keydown', (event.key))
        })
        window.addEventListener('keyup', (event)=>
        {
            this.socket.emit('keyup', (event.key))
        })

        // Other players
        this.otherPlayers = {}

        this.socket.on(
            'initialData',
            (players) =>
            {
                console.log('A new socket connected to server!')
                for(const id in players)
                {
                    if(id != this.socket.id)
                    {
                        this.otherPlayers[id] = new OtherPlayer(id)
                    }
                }
                addPlayers()
            }
        )

        const addPlayers = () =>
        {
            for(const id in this.otherPlayers)
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
        }


        this.socket.on('positions', (players) =>
        {
            // console.log('positions recieved')
            // console.log(this.socket.id)
            // console.log(players)
            for(const id in players)
            {
                // console.log('this loop is working!')
                if(this.socket.id == id) 
                {
                    this.position.x = players[id].position.x
                    this.position.z = players[id].position.z
                    this.angle = players[id].angle
                }
                else
                {
                    this.otherPlayers[id].position.x = players[id].position.x
                    this.otherPlayers[id].position.z = players[id].position.z
                    this.otherPlayers[id].angle = players[id].angle
                }
            }
        })

        this.socket.on('player disconnect', (id) =>
        {
            this.scene.remove(this.otherPlayers[id].shipGroup)
            myGroup.traverse((child) => {
                disposeHierarchy(child)
            })
            delete this.otherPlayers[id] 
        })

        // Shells
        this.shells = {}

        window.addEventListener('click', (event) =>
        {
            if(this.controls.on)
            {
                crosshair.style.backgroundColor = 'red'
                let worldQuaternion = new THREE.Quaternion()
                this.camera.getWorldQuaternion(worldQuaternion)
                let worldEuler = new THREE.Euler().setFromQuaternion(worldQuaternion, 'YXZ')
                let absoluteRotationY = worldEuler.y + Math.PI
                this.socket.emit('click', event, absoluteRotationY, this.rayIntersectOcean)
                // console.log(this.rayIntersectOcean)
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
                socketId
            )

            this.shells[socketId] = shell
        })

        this.socket.on('shellPositions', (shellPosition, shellId) =>
        {
            // console.log(this.shells[shellId].position.y)
            if(this.shells[shellId] != undefined)
            {
                this.shells[shellId].position.x = shellPosition.x
                this.shells[shellId].position.z = shellPosition.z
                this.shells[shellId].position.y = shellPosition.y
            }
        })

        //Getting hit by shells
        deathScreenPlay.addEventListener('click', ()=>
        {
            this.socket.emit('respawn', this.socket.id)
            deathScreenPlay.style.zindex = '0'
            deathScreen.style.visibility = 'hidden'
            crosshair.style.visibility = 'visible'
            this.controls.on = true
            this.pointerLock.lock()
            this.ship.visible = true
            this.hp = 100
            gsap.to(actualHealth, {width: "100%", duration: 2})
            gsap.to(whiteHealth, {width: "100%", duration: 2})
            actualHealth.style.visibility = 'visible'
            whiteHealth.style.visibility = 'visible'

            window.addEventListener('click', (event) =>
            {
                if(this.controls.on)
                {
                    crosshair.style.backgroundColor = 'red'
                    let worldQuaternion = new THREE.Quaternion()
                    this.camera.getWorldQuaternion(worldQuaternion)
                    let worldEuler = new THREE.Euler().setFromQuaternion(worldQuaternion, 'YXZ')
                    let absoluteRotationY = worldEuler.y + Math.PI
                    this.socket.emit('click', event, absoluteRotationY, this.rayIntersectOcean)
                    // console.log(this.rayIntersectOcean)
                }
            })
        })

        this.socket.on('playerHit', (shellId, playerId) =>
        {
            console.log(shellId + " " + playerId + " " + this.socket.id)
            if(this.shells[shellId] != undefined) this.shells[shellId].visible = false
            if(playerId == this.socket.id)
            {
                this.hp -= 50
                gsap.to(actualHealth, {width: "-=50%", duration: 0.4})
                gsap.to(whiteHealth, {width: "-=50%", duration: 1, delay: 0.7})
                if(this.hp == 0)
                {
                    this.controls.on = false
                    this.pointerLock.unlock()

                    this.ship.visible = false
                    deathScreen.style.visibility = 'visible'
                    document.body.style.cursor = 'auto'
                    crosshair.style.visibility = 'hidden'
                    

                    window.removeEventListener('click', (event) =>
                    {
                        if(this.controls.on)
                        {
                            crosshair.style.backgroundColor = 'red'
                            let worldQuaternion = new THREE.Quaternion()
                            this.camera.getWorldQuaternion(worldQuaternion)
                            let worldEuler = new THREE.Euler().setFromQuaternion(worldQuaternion, 'YXZ')
                            let absoluteRotationY = worldEuler.y + Math.PI
                            this.socket.emit('click', event, absoluteRotationY, this.rayIntersectOcean)
                            // console.log(this.rayIntersectOcean)
                        }
                    })
                }
            }
            else
            {
                this.otherPlayers[playerId].hp -= 50
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
        
        //Reload page when server reboot
        this.socket.on('disconnect', () => 
        {
            setTimeout(() => {
                window.location.reload()
            }, 1000)
        })
    }

    disposeHierarchy = (child) =>
    {
        if( child instanceof THREE.Mesh)
        {
            if(child.geometry)
            {
                child.geometry.dispose()
            }

            if(child.material) child.material.dispose

            if (child.parent) {
                child.parent.remove(child);
            }
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
        if(shellId == this.socket.id) crosshair.style.backgroundColor = '#1ed1d1'
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

            if(this.otherPlayers[id].hp == 0)
            {
                this.otherPlayers[id].shipGroup.visible = false
            }
            else 
            {
                this.otherPlayers[id].shipGroup.visible = true
            }
        }
        this.shipGroup.position.x = this.position.x
        this.shipGroup.position.z = this.position.z
        this.shipGroup.rotation.y = -this.angle

        //Raycaster
        this.raycaster.setFromCamera(this.mouse, this.camera)
        this.rayIntersectOcean = this.raycaster.intersectObject(this.world.ocean.ocean)

        console.log(this.hp)

        // Html
        mapPointer.style.top = 50 - (this.shipGroup.position.x)/2  -  parseFloat(window.getComputedStyle(mapPointer).height)/(2*window.innerWidth*0.18)*100+ "%"
        mapPointer.style.left = 50 + (this.shipGroup.position.z)/2  -  parseFloat(window.getComputedStyle(mapPointer).width)/(2*window.innerWidth*0.18)*100+ "%"
        mapPointer.style.transform = `rotate(${-this.shipGroup.rotation.y / (2*Math.PI) * 360 }deg)`
        console.log(parseFloat(window.getComputedStyle(mapPointer).height))
    }
}