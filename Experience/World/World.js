import Experience from '../Experience.js'
import * as THREE from 'three'
import GUI from 'lil-gui'

const gui = new GUI()
const debugObject = {}
debugObject.color = '#ff00ff'

let isBullet = false

export default class World
{
    constructor()
    {
        this.experience = new Experience()
        this.scene = this.experience.scene

        const testMesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.5, 0.5),
            new THREE.MeshBasicMaterial({ wireframe: true, color: '#00ffff' })
        )
        gui.addColor(testMesh.material, 'color')
        this.scene.add(testMesh)
    }
}