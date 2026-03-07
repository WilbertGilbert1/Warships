import Experience from "../Experience.js"
import * as THREE from 'three'
// import testVertexShader from './shaders/vertex.glsl'
// import testFragmentShader from './shaders/fragment.glsl'

export default class Ocean
{
    constructor()
    {
        this.experience = new Experience()
        this.world = this.experience.world

        this.ocean = new THREE.Mesh(
            new THREE.PlaneGeometry(2000, 2000),
            new THREE.MeshBasicMaterial({ color: '#18183a' })
        )
        this.ocean.rotateX(-Math.PI/2)
        

        // /**
        //  * Water
        //  */
        // // Geometry
        // const waterGeometry = new THREE.PlaneGeometry(2, 2, 512, 512)

        // // Colors
        // debugObject.depthColor = '#186691'
        // debugObject.surfaceColor = '#9bd8ff'

        // gui.addColor(debugObject, 'depthColor').onChange(() => { waterMaterial.uniforms.uDepthColor.value.set(debugObject.depthColor) })
        // gui.addColor(debugObject, 'surfaceColor').onChange(() => { waterMaterial.uniforms.uSurfaceColor.value.set(debugObject.surfaceColor) })

        // // Material
        // const waterMaterial = new THREE.ShaderMaterial({
        //     vertexShader: testVertexShader,
        //     fragmentShader: testFragmentShader,
        //     uniforms:
        //     {
        //         uTime: { value: 0 },
                
        //         uBigWavesElevation: { value: 0.2 },
        //         uBigWavesFrequency: { value: new THREE.Vector2(4, 1.5) },
        //         uBigWavesSpeed: { value: 0.75 },

        //         uSmallWavesElevation: { value: 0.15 },
        //         uSmallWavesFrequency: { value: 3 },
        //         uSmallWavesSpeed: { value: 0.2 },
        //         uSmallIterations: { value: 4 },

        //         uDepthColor: { value: new THREE.Color(debugObject.depthColor) },
        //         uSurfaceColor: { value: new THREE.Color(debugObject.surfaceColor) },
        //         uColorOffset: { value: 0.08 },
        //         uColorMultiplier: { value: 5 }
        //     }
        // })

        // gui.add(waterMaterial.uniforms.uBigWavesElevation, 'value').min(0).max(1).step(0.001).name('uBigWavesElevation')
        // gui.add(waterMaterial.uniforms.uBigWavesFrequency.value, 'x').min(0).max(10).step(0.001).name('uBigWavesFrequencyX')
        // gui.add(waterMaterial.uniforms.uBigWavesFrequency.value, 'y').min(0).max(10).step(0.001).name('uBigWavesFrequencyY')
        // gui.add(waterMaterial.uniforms.uBigWavesSpeed, 'value').min(0).max(4).step(0.001).name('uBigWavesSpeed')


        // gui.add(waterMaterial.uniforms.uSmallWavesElevation, 'value').min(0).max(1).step(0.001).name('uSmallWavesElevation')
        // gui.add(waterMaterial.uniforms.uSmallWavesFrequency, 'value').min(0).max(30).step(0.001).name('uSmallWavesFrequency')
        // gui.add(waterMaterial.uniforms.uSmallWavesSpeed, 'value').min(0).max(4).step(0.001).name('uSmallWavesSpeed')
        // gui.add(waterMaterial.uniforms.uSmallIterations, 'value').min(0).max(5).step(1).name('uSmallIterations')

        // gui.add(waterMaterial.uniforms.uColorOffset, 'value').min(0).max(1).step(0.001).name('uColorOffset')
        // gui.add(waterMaterial.uniforms.uColorMultiplier, 'value').min(0).max(10).step(0.001).name('uColorMultiplier')
    }

    update()
    {
        // // Water
        // waterMaterial.uniforms.uTime.value = elapsedTime
    }
}