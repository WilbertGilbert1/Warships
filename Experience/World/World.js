import Experience from '../Experience.js'
import * as THREE from 'three'
import GUI from 'lil-gui'
import Ship from './Ship .js'
import Ocean from './Ocean.js'

const debugObject = {}
debugObject.shipColor = '#00ffff'
debugObject.oceanColor = '#18183a'

export default class World
{
    constructor()
    {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.gui = new GUI()

        this.ship = new Ship()
        this.scene.add(this.ship.ship)

        this.ocean = new Ocean()
        this.scene.add(this.ocean.ocean)

        //GUI
        this.gui.addColor(debugObject, 'shipColor')
        .onChange(() =>
        {
            this.ship.ship.material.color.set(debugObject.shipColor)
        }
        )
        this.gui.addColor(debugObject, 'oceanColor')
        .onChange(() =>
        {
             this.ocean.ocean.material.color.set(debugObject.oceanColor)
        })
    } 
}