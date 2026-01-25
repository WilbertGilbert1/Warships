import Experience from "../Experience.js"
import * as THREE from 'three'
import OtherPlayer from "./OtherPlayer.js"

export default class Ship
{
    constructor()
    {
        this.experience = new Experience()
        this.world = this.experience.world
        this.scene = this.experience.scene
        this.socket = this.experience.socket

        this.position = 
        {
            x: 0,
            z: 0
        }

        this.ship = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.5, 0.5),
            new THREE.MeshBasicMaterial({ wireframe: true, color: '#7b0808' })
        )
        this.ship.position.y += 0.25


        //Camera Test
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
                }
                else
                {
                    this.otherPlayers[id].position.x = players[id].position.x
                    this.otherPlayers[id].position.z = players[id].position.z
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

    }

    update = () =>
    {
        for(let id in this.otherPlayers)
        {
            this.otherPlayers[id].ship.position.x = this.otherPlayers[id].position.x
            this.otherPlayers[id].ship.position.z = this.otherPlayers[id].position.z
        }
        this.ship.position.x = this.position.x
        this.ship.position.z = this.position.z
    }
}