import Experience from "../Experience.js"
import * as THREE from 'three'
import OtherPlayer from "./OtherPlayer.js"
import World from "./World.js"

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
        this.shellSpeed = 0.84 * 10

        this.position = 
        {
            x: 0,
            z: 0,
            y: 0.25,
            angle: 0
        }

        
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
                this.scene.add(this.otherPlayers[id].ship)   
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
            this.scene.remove(this.otherPlayers[id].ship)
            this.otherPlayers[id].ship.material.dispose()
            this.otherPlayers[id].ship.geometry.dispose()
            delete this.otherPlayers[id] 
        })

        // Shells
        this.shells = {}

        window.addEventListener('click', (event) =>
        {
            let worldQuaternion = new THREE.Quaternion()
            this.camera.getWorldQuaternion(worldQuaternion)
            let worldEuler = new THREE.Euler().setFromQuaternion(worldQuaternion, 'YXZ')
            let absoluteRotationY = worldEuler.y + Math.PI
            this.socket.emit('click', event, absoluteRotationY, this.shellAngle)

            console.log(this.shellAngle)
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
                5000,
                shell,
                shellId
            )

            this.shells[socketId] = shell
        })

        this.socket.on('shellPositions', (shellPosition, shellId) =>
        {
            this.shells[shellId].position.x = shellPosition.x
            this.shells[shellId].position.z = shellPosition.z
            this.shells[shellId].position.y = shellPosition.y
        })

        this.maxShellDistance = Math.sqrt((this.shellSpeed/10)**2*(this.shellSpeed**2 + 2 * 10 * 0.75) + 0.75**2)
        console.log(this.maxShellDistance)
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
        this.scene.remove(shell)
        shell.material.dispose()
        shell.geometry.dispose()
        delete this.shells[shellId]
    }

    update = () =>
    {
        for(let id in this.otherPlayers)
        {
            this.otherPlayers[id].ship.position.x = this.otherPlayers[id].position.x
            this.otherPlayers[id].ship.position.z = this.otherPlayers[id].position.z
            this.otherPlayers[id].ship.rotation.y = -this.otherPlayers[id].angle
        }
        this.shipGroup.position.x = this.position.x
        this.shipGroup.position.z = this.position.z
        this.shipGroup.rotation.y = -this.angle

        //Raycaster
        this.raycaster.setFromCamera(this.mouse, this.camera)
        let rayIntersectOcean = this.raycaster.intersectObject(this.world.ocean.ocean)

        // Finding initial verticle shell velocity
        if(rayIntersectOcean[0] && rayIntersectOcean[0].distance > 0 && rayIntersectOcean[0].distance < this.maxShellDistance)
        {
            this.horizontalLengthToShellTarget = Math.sqrt((this.ship.position.x - rayIntersectOcean[0].point.x)**2 + (this.ship.position.z - rayIntersectOcean[0].point.z)**2)
            this.verticleLengthToShellTarget = Math.sqrt(rayIntersectOcean[0].distance**2 - this.horizontalLengthToShellTarget**2)
            this.shellAngle = Math.atan((this.shellSpeed**2 - Math.sqrt(this.shellSpeed**4 - 10*(10*this.horizontalLengthToShellTarget**2 - 2*this.verticleLengthToShellTarget*this.shellSpeed**2)))/(10*this.horizontalLengthToShellTarget))
        }
        else if(rayIntersectOcean[0] && rayIntersectOcean[0].distance > this.maxShellDistance)
        {
           this.shellAngle = Math.PI/2
        }
        else if(!rayIntersectOcean[0])this.shellAngle = Math.PI/2
    }
}