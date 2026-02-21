import * as http from 'http'
import { Server } from 'socket.io'
import * as fs from 'fs'
import * as path from 'path'
import mime from 'mime'
import PlayerInfo from './PlayerInfo.js'


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

io.on('connection', (socket) => {
    players[socket.id] = new PlayerInfo(socket.id)
    players[socket.id].position.x = 0
    players[socket.id].position.z = 0

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
    socket.on('click', (event, shellAngleXZ, shellAngleY) =>
    {
        console.log(shellAngleXZ)
        if(!players[socket.id].shell.ifShell)
        {
            console.log('Shell fired!')
            players[socket.id].shell.ifShell = true
            setTimeout(() =>
                {
                    if(players[socket.id] != undefined && players[socket.id].shell != undefined)
                    {
                        players[socket.id].shell.ifShell = false
                        players[socket.id].shell.position.x = players[socket.id].position.x
                        players[socket.id].shell.position.z = players[socket.id].position.z
                        players[socket.id].shell.position.y = 0.75
                        players[socket.id].shell.angleY = 0
                        players[socket.id].shell.angleXZ = 0
                    }
                },
                5000)
            players[socket.id].shell.angleXZ = shellAngleXZ
            players[socket.id].shell.angleY = shellAngleY
            players[socket.id].shell.speedVerticle =  players[socket.id].shell.speed * Math.sin(shellAngleY)
            players[socket.id].shell.position.x = players[socket.id].position.x
            players[socket.id].shell.position.z = players[socket.id].position.z

            io.emit('shellFired', players[socket.id].shell, socket.id)
        }
    })

    // Disconnect
    socket.on('disconnect', () => {
        delete players[socket.id]
        io.emit('player disconnect', (socket.id))
    })
})

const serverTick = () =>
{
    // Players

    for(const id in players)
    {
        if(players[id].keys.w) 
        {
            players[id].speed += (0.14 * 10 - players[id].speed)*(1-2.72**(-0.015*8.14))*0.01
            
        }
        if(players[id].keys.s)
        {
            players[id].speed -= 0.4*(0.14 * 10 - players[id].speed)*(1-2.72**(-0.015*8.14)) * 0.01
        } 
        if(players[id].keys.a && players[id].rudderAngle > -0.018)
        {
            players[id].rudderAngle -= 0.00002
        }
        if(players[id].keys.d && players[id].rudderAngle < 0.018)
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

        //Shells
        if(players[id].shell.ifShell) 
        {
            players[id].shell.position.x -= (-players[id].shell.speed * Math.sin(players[id].shell.angleXZ) * Math.cos(players[id].shell.angleY) * 0.015) *0.2
            players[id].shell.position.z += (players[id].shell.speed * Math.cos(players[id].shell.angleXZ) * Math.cos(players[id].shell.angleY) * 0.015) * 0.2
            players[id].shell.position.y += players[id].shell.speedVerticle * 0.015 - 9.8*(0.015**2)/2
            players[id].shell.speedVerticle -= 9.8 * 0.015
            // console.log(players[id].shell.position.x + " " + players[id].shell.position.y + players[id].shell.position.z)

            io.emit('shellPositions', players[id].shell.position, id)
        }

        // console.log(players)
        io.emit('positions', (players))  
        // console.log('positions sent')
    
    }
}
setInterval(serverTick, 15)



