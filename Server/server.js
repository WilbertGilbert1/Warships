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

    io.emit(
        'initialData', 
        players
    )

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

    socket.on('test', (message) => {
        console.log(message)
    })

    socket.on('disconnect', () => {
        delete players[socket.id]
        io.emit('player disconnect', (socket.id))
    })
})

const serverTick = () =>
{
    for(const id in players)
    {
        if(players[id].keys.w) 
        {
            players[id].speed += 0.001
            // console.log('w')
        }
        if(players[id].keys.s)
        {
            players[id].speed -= 0.004
        } 
        if(players[id].keys.a)
        {
            players[id].angle -= 0.001 * players[id].speed
            } 
        if(players[id].keys.d)
        {
            players[id].angle += 0.001 * players[id].speed
        }
        players[id].position.x += players[id].speed * Math.cos(players[id].angle) * 0.015
        players[id].position.z += players[id].speed * Math.sin(players[id].angle) * 0.015
        // console.log(players[id].position.x + ", " + players[id].position.z)


        // console.log(players)
        io.emit('positions', (players))  
        // console.log('positions sent')
    
    }
}
setInterval(serverTick, 15)



