export default class PlayerInfo
{
    constructor(id)
    {
        this.id = id
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
                y: 0.25
            },
            angleXZ: 0,
            angleY: 0,
            speed: 0.84 * 50,
            speedVerticle: 0
        },
        this.rudderAngle = 0

    }
}