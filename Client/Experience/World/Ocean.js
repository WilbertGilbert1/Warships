import Experience from "../Experience.js"
import * as THREE from 'three'

export default class Ocean
{
    constructor()
    {
        this.experience = new Experience()
        this.world = this.experience.world

        this.ocean = new THREE.Mesh(
            new THREE.PlaneGeometry(200, 200),
            new THREE.MeshBasicMaterial({ color: '#18183a' })
        )
        this.ocean.rotateX(-Math.PI/2)
        
    }
}