import * as http from 'http'
import { Server } from 'socket.io'
import * as fs from 'fs'
import * as path from 'path'
import mime from 'mime'


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

//PUT THIS STUFF IN A DIFFERENT FILE

class PlayerInfo
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
    }
}

let players = {}


io.on('connection', (socket) => {
    players[socket.id] = new PlayerInfo(socket.id)

    socket.on('keydown', (obj) =>
    {
        console.log(obj)
        if(obj == 'w') players[socket.id].keys.w = true
        if(obj == 's') players[socket.id].keys.s = true
        if(obj == 'a') players[socket.id].keys.a = true
        if(obj == 'd') players[socket.id].keys.d = true
    })
    socket.on('keyup', (obj) =>
    {
        console.log(obj)
        if(obj == 'w') players[socket.id].keys.w = false
        if(obj == 's') players[socket.id].keys.s = false
        if(obj == 'a') players[socket.id].keys.a = false
        if(obj == 'd') players[socket.id].keys.d = false
    })


    // socket.emit(
    //     // Emit something
    // )

    socket.on('test', (message) => {
        console.log(message)
    })

    socket.on('disconnect', () => {
        delete players[socket.id]
    })
})

const serverTick = () =>
    {
        for(const id in players)
        {
            if(players[id].keys.w) console.log('w')
            if(players[id].keys.s) console.log('s')
            if(players[id].keys.a) console.log('a')
            if(players[id].keys.d) console.log('d')
        }
    }
setInterval(serverTick, 15)

