import * as http from 'http'
import { Server } from 'socket.io'
import * as fs from 'fs'
import * as path from 'path'
import mime from 'mime'
import PlayerInfo from './PlayerInfo.js'
import * as THREE from 'three'

var cache = {}

const httpPort = 3000

let appPath
let staticDir
let modulePath

appPath = './Server/'
staticDir = './Client/'
modulePath = './node_modules/'

const httpServer = http.createServer((request, response) => {
    r(request, response)
})

const io = new Server(httpServer)

httpServer.listen(httpPort, () => {
    console.log('Server running on port ' + httpPort)
})

const r = (request, response) => {
    var filePath = false
    if (request.url === '/') {
        filePath = staticDir + 'index.html'
    } else if (request.url.slice(0, 13) == '/node_modules') {
        filePath = modulePath + request.url.slice(13)
    } else {
        filePath = staticDir + request.url
    }
    if (filePath) {
        var absPath = filePath
        serveStatic(response, cache, absPath)
    }
}

const send404 = (response) => {
    response.writeHead(404, { 'Content-Type': 'text/plain' })
    response.write('Error 404: resource not found.')
    response.end()
}

const sendFile = (response, filePath, fileContents) => {
    response.writeHead(
        200,
        { "content-type": mime.getType(path.basename(filePath)) }
    )
    response.end(fileContents)
}

const serveStatic = (response, cache, absPath) => {
    if (cache[absPath]) {
        sendFile(response, absPath, cache[absPath])
    } else {
        fs.readFile(absPath, (err, data) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    send404(response)
                } else {
                    response.writeHead(500, { 'Content-Type': 'text/plain' })
                    response.write('Error 500: Internal server error')
                    response.end()
                }
            } else {
                cache[absPath] = data
                sendFile(response, absPath, data)
            }
        })
    }
}

let players = {}
const scene = new THREE.Scene()

const getLeaderboard = () => {
    const entries = []
    for (const id in players) {
        const p = players[id]
        if (!p.alive) continue 
        const timeAlive = (Date.now() - p.spawnTime) / 1000
        entries.push({
            id,
            username: p.username,
            kills: p.kills,
            damage: p.damageDealt,
            timeAlive
        })
    }
    entries.sort((a, b) => {
        if (a.kills !== b.kills) return b.kills - a.kills
        if (a.damage !== b.damage) return b.damage - a.damage
        return b.timeAlive - a.timeAlive
    })
    return entries.slice(0, 10)
}

const broadcastLeaderboard = () => {
    io.emit('leaderboard', getLeaderboard())
}

const getUpgradeMultiplier = (level, base = 1, increment = 0.1) => {
    return base + level * increment
}

io.on('connection', (socket) => {
    let username = 'Anonymous'
    socket.on('setUsername', (name) => {
        username = name || 'Anonymous'
        if (players[socket.id]) {
            players[socket.id].username = username
        }
        broadcastLeaderboard()
    })

    players[socket.id] = new PlayerInfo(socket.id, username)
    players[socket.id].position.x = Math.random() * 20
    players[socket.id].position.z = Math.random() * 20
    players[socket.id].spawnTime = Date.now()

    io.emit(
        'initialData', 
        players
    )
    broadcastLeaderboard() /

    socket.on('disconnect', () => {
        const playerId = socket.id
        delete players[playerId]
        io.emit('player disconnect', playerId)
        broadcastLeaderboard() 
    })

    socket.on('keydown', (obj) =>
    {
        if (!players[socket.id]) return
        switch (obj)
        {
        case 'w': 
            players[socket.id].keys.w = true
            break
        case 'a': 
            players[socket.id].keys.a = true
            break
        case 's': 
            players[socket.id].keys.s = true
            break
        case 'd':
            players[socket.id].keys.d = true
        }
    })
    socket.on('keyup', (obj) =>
    {
        if (!players[socket.id]) return
        switch (obj)
        {
        case 'w': 
            players[socket.id].keys.w = false
            break
        case 'a': 
            players[socket.id].keys.a = false
            break
        case 's': 
            players[socket.id].keys.s = false
            break
        case 'd':
            players[socket.id].keys.d = false
        }
    }) 

    socket.on('click', (event, absoluteRotationY, rayIntersectOcean) =>
    {
        if (!players[socket.id]) return
        if(!players[socket.id].shell.ifShell)
        {
            players[socket.id].shell.ifShell = true
            setTimeout(() =>
                {
                    if(players[socket.id] != undefined && players[socket.id].shell != undefined)
                    {
                        players[socket.id].shell.ifShell = false
                        players[socket.id].shell.position.x = players[socket.id].position.x
                        players[socket.id].shell.position.z = players[socket.id].position.z
                        players[socket.id].shell.position.y = 1.5
                        players[socket.id].shell.angleY = 0
                        players[socket.id].shell.angleXZ = 0
                        players[socket.id].shell.hitPlayer = false
                    }
                },
                4000)
            players[socket.id].shell.hitPlayer = false
            players[socket.id].shell.position.x = players[socket.id].position.x
            players[socket.id].shell.position.z = players[socket.id].position.z
            players[socket.id].shell.position.y = 1.5
            players[socket.id].shell.angleY = countShellYAngle(absoluteRotationY, rayIntersectOcean, players[socket.id].shell)
            players[socket.id].shell.angleXZ = absoluteRotationY
            players[socket.id].shell.speedY =  players[socket.id].shell.speed * Math.sin(players[socket.id].shell.angleY)
            players[socket.id].shell.speedZ = players[socket.id].shell.speed * Math.cos(players[socket.id].shell.angleY) * Math.cos( players[socket.id].shell.angleXZ)
            players[socket.id].shell.speedX = players[socket.id].shell.speed * Math.cos(players[socket.id].shell.angleY) * Math.sin( players[socket.id].shell.angleXZ)

            io.emit('shellFired', players[socket.id].shell , socket.id)
        }
    })

    socket.on('respawn', (id) =>
    {
        if (!players[id]) return
        players[id].hp = 100 + players[id].upgrades.health * 10 
        players[id].maxHp = players[id].hp
        players[id].alive = true
        players[id].rudderAngle = 0
        players[id].speed = 0
        players[id].angle = 0
        players[id].position.x = Math.random() * 20
        players[id].position.z = Math.random() * 20
        players[id].damageDealt = 0 
        players[id].kills = 0        
        players[id].spawnTime = Date.now() 
        io.emit('respawnFromServer', id)
        broadcastLeaderboard() 
    })

    socket.on('toHe', (id) =>
    {
        if (!players[id]) return
        players[id].he = true
        players[id].shell.ifShell = true
        setTimeout(() =>
        {
            if (players[id]) players[id].shell.ifShell = false
        }, 4000)
    })
    socket.on('toAp', (id) =>
    {
        if (!players[id]) return
        players[id].he = false
        players[id].shell.ifShell = true
        setTimeout(() =>
        {
            if (players[id]) players[id].shell.ifShell = false
        }, 4000)
    })

    socket.on('chatMessage', (message) => {
        if (!players[socket.id]) return
        const sender = players[socket.id].username
        const lb = getLeaderboard()
        const isTop = lb.length > 0 && lb[0].id === socket.id
        io.emit('chatMessage', { sender, message, isTop })
    })

    socket.on('upgrade', (stat) => {
        const player = players[socket.id]
        if (!player) return
        const validStats = ['speed', 'turnSpeed', 'acceleration', 'apDamage', 'heDamage', 'health']
        if (!validStats.includes(stat)) return
        if (player.upgrades[stat] >= 8) return
        if (player.coins < 50) return

        player.coins -= 50
        player.upgrades[stat]++

        if (stat === 'health') {
            const newMax = 100 + player.upgrades.health * 10
            const diff = newMax - player.maxHp
            player.maxHp = newMax
            player.hp = Math.min(player.hp + diff, newMax)
        }

        socket.emit('upgradeResult', { 
            success: true, 
            stat, 
            level: player.upgrades[stat],
            coins: player.coins,
            hp: player.hp,
            maxHp: player.maxHp
        })
    })

    socket.on('turretRotation', (rotationY) =>
    {
        socket.emit('turretRotate', rotationY, socket.id)
    }
    )
})

const countShellYAngle = (absoluteRotationY, rayIntersectOcean, shell) =>
{
    if(rayIntersectOcean != null && rayIntersectOcean[0] != undefined)
    {
    let rayIntersectOceanHorizontal = rayIntersectOcean[0].distance
    let k = rayIntersectOceanHorizontal**2 - 1.5**2
    let x =  shell.speed**2 / (9.8 * Math.sqrt(k)) - shell.speed**2 / 9.8 * Math.sqrt((1+2*9.8*1.5/shell.speed**2)/k - 9.8**2/shell.speed**4)
    if(!Number.isNaN(Math.atan(x))) return Math.atan(x)
    else if( k == 0) return -Math.PI / 2
    else return Math.PI / 4
    }
    else
    {
        return Math.PI / 4
    }
}

const raycaster = new THREE.Raycaster()

const ocean = new THREE.Mesh(
    new THREE.PlaneGeometry(2000, 2000),
    new THREE.MeshBasicMaterial()
)
ocean.rotation.x -= (Math.PI)
scene.add(ocean)

const serverTick = () =>
{
    for(const id in players)
    {
        if (!players[id]) continue
        const p = players[id]
        const speedMultiplier = getUpgradeMultiplier(p.upgrades.speed, 1, 0.1)
        const turnMultiplier = getUpgradeMultiplier(p.upgrades.turnSpeed, 1, 0.1)
        const accelMultiplier = getUpgradeMultiplier(p.upgrades.acceleration, 1, 0.1)

        if(p.keys.w) 
        {
            p.speed += (0.14 * 5  - p.speed)*(1-2.72**(-0.015*8.14)) * 0.02 * accelMultiplier
        }
        if(p.keys.s)
        {
            p.speed -= 0.4*(0.14 * 5  - p.speed)*(1-2.72**(-0.015*8.14)) * 0.02 * accelMultiplier
        } 
        if(p.keys.a && p.rudderAngle > -0.005)
        {
            p.rudderAngle -= 0.00002 * turnMultiplier
        }
        if(p.keys.d && p.rudderAngle < 0.005)
        {
            p.rudderAngle += 0.00002 * turnMultiplier
        }
        if(!p.keys.d && !p.keys.a)
        {
            if(p.rudderAngle > 0) p.rudderAngle -= 0.00001 * turnMultiplier
            else if(p.rudderAngle < 0) p.rudderAngle += 0.00001 * turnMultiplier
        }
       
        if(p.speed > 0 && p.speed < 1)
        {
            p.angle += p.rudderAngle * p.speed * turnMultiplier
        }
        else if(p.speed > 1)
        {
            p.angle += (p.rudderAngle / p.speed) * turnMultiplier
        }
        else if(p.speed < 0)
        {
            p.angle -= p.rudderAngle * p.speed * turnMultiplier
        }
        p.position.x += p.speed * Math.cos(p.angle) * 0.015 * speedMultiplier
        p.position.z += p.speed * Math.sin(p.angle) * 0.015 * speedMultiplier

        if(p.position.x > 50) p.position.x = 50
        if(p.position.z > 50) p.position.z = 50
        if(p.position.x < -50) p.position.x = -50
        if(p.position.z < -50) p.position.z = -50

        if(p.shell.ifShell) 
        {
            p.shell.position.x += p.shell.speedX * 0.015
            p.shell.position.z += p.shell.speedZ * 0.015
            p.shell.position.y += p.shell.speedY * 0.015
            p.shell.speedY -= 9.8 * 0.015

            io.emit('shellPositions', p.shell.position, id)

            for(const ID in players)
            {
                if (!players[ID]) continue
                const target = players[ID]
                let x = -(p.shell.position.z - target.position.z)*Math.cos(target.angle) + Math.sin(target.angle)*((p.shell.position.x - target.position.x))
                let z = (p.shell.position.z - target.position.z)*Math.sin(target.angle) + Math.cos(target.angle)*((p.shell.position.x - target.position.x))
                let option = 0
                let rawDamage = 0
                if( Math.abs(z) <= 0.15
                    && Math.abs(x) <= 0.15
                    && Math.abs(p.shell.position.y -0.35) <= 0.15
                    && id != ID
                    && !p.shell.hitPlayer
                    && target.alive)
                    {
                        option = 1
                        p.shell.hitPlayer = true
                        if(p.he) {
                            rawDamage = 0
                        } else {
                            const apMult = getUpgradeMultiplier(p.upgrades.apDamage, 1, 0.1)
                            rawDamage = Math.floor(10 * apMult)
                        }
                    }
                else if( Math.abs(z- 0.9) <= 0.3
                    && Math.abs(x) <= 0.25
                    && Math.abs(p.shell.position.y -0.35) <= 0.25
                    && id != ID
                    && !p.shell.hitPlayer
                    && target.alive)
                    {
                        option = 2
                        p.shell.hitPlayer = true
                        if(p.he) {
                            const heMult = getUpgradeMultiplier(p.upgrades.heDamage, 1, 0.1)
                            rawDamage = Math.floor(30 * heMult)
                        } else {
                            const apMult = getUpgradeMultiplier(p.upgrades.apDamage, 1, 0.1)
                            rawDamage = Math.floor(10 * apMult)
                        }
                    }
                else if( 
                    Math.abs(z-0.35) <= 1.2
                    && Math.abs(x) <= 0.25
                    && Math.abs(p.shell.position.y -0.125) <= 0.25
                    && id != ID
                    && !p.shell.hitPlayer
                    && target.alive)
                    {
                        option = 3
                        p.shell.hitPlayer = true
                        if(p.he) {
                            const heMult = getUpgradeMultiplier(p.upgrades.heDamage, 1, 0.1)
                            rawDamage = Math.floor(10 * heMult)
                        } else {
                            const apMult = getUpgradeMultiplier(p.upgrades.apDamage, 1, 0.1)
                            rawDamage = Math.floor(20 * apMult)
                        }
                    }

                if (rawDamage > 0 && p && target.alive) {
                    
                    const actualDamage = Math.min(rawDamage, target.hp)
                    target.hp -= actualDamage
                    p.damageDealt += actualDamage
                    const ifDead = target.hp > 0
                    io.emit('playerHit', id, ID, ifDead, Math.min(rawDamage, target.hp))
                }

                
                if(target.alive && target.hp <= 0)
                {
                     target.speed = 0
                     target.rudderAngle = 0
                     target.angle = 0
                     target.alive = false
                     target.fire = false
                     
                     if (p) {
                        p.kills ++
                        p.coins += 100 
                        const killerName = p.username
                        const victimName = target.username
                        io.emit('killFeed', { killer: killerName, victim: victimName })
                        broadcastLeaderboard()
                     }
                }

                if(target.fire) target.hp -= 0.083
            }
        }

        io.emit('positions', players)  
    }
    broadcastLeaderboard()
}
setInterval(serverTick, 15)
