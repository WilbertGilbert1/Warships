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
    }
}