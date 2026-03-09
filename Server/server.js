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
        console.log('sent file ' + absPath)
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
        // Directly read the file and handle errors
        fs.readFile(absPath, (err, data) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    send404(response)
                } else {
                    // Handle other errors (permissions, etc.)
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

io.on('connection', (socket) => {
    players[socket.id] = new PlayerInfo(socket.id)
    players[socket.id].position.x = Math.random() * 20
    players[socket.id].position.z = Math.random() * 20

    players[socket.id].ship.position.x = players[socket.id].position.x
    players[socket.id].ship.position.z = players[socket.id].position.z
    scene.add(players[socket.id].ship)

    io.emit(
        'initialData', 
        players
    )

    // Movement
    socket.on('keydown', (obj) =>
    {
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

    // Shells
    socket.on('click', (event, absoluteRotationY, rayIntersectOcean) =>
    {
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
            // console.log(players[socket.id].shell.angleY)
            players[socket.id].shell.speedY =  players[socket.id].shell.speed * Math.sin(players[socket.id].shell.angleY)
            players[socket.id].shell.speedZ = players[socket.id].shell.speed * Math.cos(players[socket.id].shell.angleY) * Math.cos( players[socket.id].shell.angleXZ)
            players[socket.id].shell.speedX = players[socket.id].shell.speed * Math.cos(players[socket.id].shell.angleY) * Math.sin( players[socket.id].shell.angleXZ)
            // console.log(players[socket.id].shell.speedY)

            io.emit('shellFired', players[socket.id].shell , socket.id)
        }
    })

    //Handleing respawn
    socket.on('respawn', (id) =>
    {
        players[id].hp = 100
        players[id].alive = true
        players[id].position.x = Math.random() * 20
        players[id].position.z = Math.random() * 20
        io.emit('respawnFromServer', id)
    })


    // Disconnect
    socket.on('disconnect', () => {
        delete players[socket.id]
        io.emit('player disconnect', (socket.id))
    })
})

const countShellYAngle = (absoluteRotationY, rayIntersectOcean, shell) =>
{
    if(rayIntersectOcean[0] != undefined)
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
    // Players

    for(const id in players)
    {
        if(players[id].keys.w) 
        {
            players[id].speed += (0.14 * 5  - players[id].speed)*(1-2.72**(-0.015*8.14)) * 0.02
            
        }
        if(players[id].keys.s)
        {
            players[id].speed -= 0.4*(0.14 * 5  - players[id].speed)*(1-2.72**(-0.015*8.14)) * 0.02
        } 
        if(players[id].keys.a && players[id].rudderAngle > -0.005)
        {
            players[id].rudderAngle -= 0.00002
        }
        if(players[id].keys.d && players[id].rudderAngle < 0.005)
        {
            players[id].rudderAngle += 0.00002
        }
        if(!players[id].keys.d && !players[id].keys.a)
        {
            if(players[id].rudderAngle > 0) players[id].rudderAngle -= 0.00001
            else if(players[id].rudderAngle < 0) players[id].rudderAngle += 0.00001
        }
       
        if(players[id].speed > 0 && players[id].speed< 1)
        {
            players[id].angle += players[id].rudderAngle * players[id].speed
        }
        else if(players[id].speed > 1)
        {
            players[id].angle += players[id].rudderAngle / players[id].speed
        }
        else if(players[id].speed < 0)
        {
            players[id].angle -= players[id].rudderAngle *players[id].speed
        }
        players[id].position.x += players[id].speed * Math.cos(players[id].angle) * 0.015
        players[id].position.z += players[id].speed * Math.sin(players[id].angle) * 0.015
        players[id].ship.position.x = players[id].position.x
        players[id].ship.position.z = players[id].position.z
        players[id].ship.rotation.y = -players[id].angle

        //Boarder
        if(players[id].position.x > 100)
        {
            players[id].position.x = 100
            
        }
        if(players[id].position.z > 100)
        {
            players[id].position.z = 100
            
        }
        if(players[id].position.x < - 100)
        {
            players[id].position.x = -100
            
        }
        if(players[id].position.z < - 100)
        {
            players[id].position.z = -100
            
        }

        // console.log(players[id].speed)

        //Shells
        if(players[id].shell.ifShell) 
        {
            players[id].shell.position.x +=  players[id].shell.speedX * 0.015
            players[id].shell.position.z += players[id].shell.speedZ  * 0.015
            players[id].shell.position.y += players[id].shell.speedY * 0.015
            players[id].shell.speedY -= 9.8 * 0.015
            // console.log(players[id].shell.position.y)

            io.emit('shellPositions', players[id].shell.position, id)

            players[id].shell.vectorPosition.set(players[id].shell.position.x, players[id].shell.position.y, players[id].shell.position.z)
            players[id].shell.velocity.set(players[id].shell.speedX, players[id].shell.speedY, players[id].shell.speedZ)
            let direction = players[id].shell.velocity.clone().normalize()

            // Shell hits
            for(const ID in players)
            {
                raycaster.set(players[id].shell.vectorPosition, direction)
                let hullIntersect = raycaster.intersectObject(players[ID].ship)
                let intersectOcean = raycaster.intersectObject(ocean)
                console.log(intersectOcean[0])
                if( hullIntersect[0] != undefined && hullIntersect[0].distance <=  2 * 0.015 * players[id].shell.velocity.length()
                    && id != ID
                    && !players[id].shell.hitPlayer
                    && players[ID].alive)
                {
                    console.log('yes')
                    players[id].shell.hitPlayer = true
                    players[ID].hp -= 50
                    io.emit('playerHit', id, ID)
                }

                if( players[ID].hp == 0)
                {
                     players[ID].speed = 0
                     players[ID].rudderAngle = 0
                     players[ID].angle = 0
                     players[ID].alive = false
                     
                     players[id].kills ++ 
                }
            }
        }

        // console.log(players)
        io.emit('positions', (players))  
        // console.log('positions sent')
    
    }
}
setInterval(serverTick, 15)



