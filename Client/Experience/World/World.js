import Experience from '../Experience.js'
import * as THREE from 'three'
import GUI from 'lil-gui'
import Ship from './Ship.js'
import Ocean from './Ocean.js'
import { Sky } from 'three/addons/objects/Sky.js';

const debugObject = {}
debugObject.shipColor = '#00ffff'
debugObject.oceanColor = '#18183a'

export default class World
{
    constructor()
    {
        this.experience = new Experience()
        this.scene = this.experience.scene
        // this.gui = new GUI()
        this.shipGroup = this.experience.shipGroup

        this.ship = new Ship(this)
        this.shipGroup.add(this.ship.ship)

        this.ocean = new Ocean()
        this.ocean.ocean.visible = false
        this.scene.add(this.ocean.ocean)

        this.scene.fog = new THREE.Fog('#b9b9b9', 20, 30)

        this.sky = new Sky()
        this.sky.scale.setScalar( 10000 )
        this.scene.add( this.sky )

        this.sky.material.uniforms['turbidity'].value = 10
        this.sky.material.uniforms['rayleigh'].value = 3
        this.sky.material.uniforms['mieCoefficient'].value = 0.1
        this.sky.material.uniforms['mieDirectionalG'].value = 0.95
        this.sky.material.uniforms['sunPosition'].value.set(0.30, -0.038, -0.96)

    //     //GUI
    //     this.gui.addColor(debugObject, 'shipColor')
    //     .onChange(() =>
    //     {
    //         this.ship.ship.material.color.set(debugObject.shipColor)
    //     }
    //     )
    //     this.gui.addColor(debugObject, 'oceanColor')
    //     .onChange(() =>
    //     {
    //          this.ocean.ocean.material.color.set(debugObject.oceanColor)
    //     })
    } 

    update = () =>
    {
        this.ship.update()
        this.ocean.update()
    }
}