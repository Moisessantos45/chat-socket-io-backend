import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { Server } from "socket.io"
import router from "./routers/router.js"

const app = express()

app.use(express.json())

dotenv.config()

const dominiosPermitidos = [process.env.FRONTEND_URL, "http://localhost:5173"]
const opciones = {
    origin: function (origin, callback) {
        if (dominiosPermitidos.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error("No permitido"))
        }
    }
}

app.use(cors(opciones))

app.use("/api/chat", router)

const PORT = process.env.PORT || 4000

const servidor = app.listen(PORT, () => {
    console.log(`Servidor conectado ${PORT}`)
})

const io = new Server(servidor, {
    pingTimeout: 60000,
    cors: {
        origin: process.env.FRONTEND_URL
    }
})

io.on("connection", server => {
    server.on("inicio", (url) => {
        server.join(url)
        // console.log("funciona coneccion", url)
    })

    server.on("mensaje enviado", data => {
        // console.log("mensaje enviado", data)
        server.to(data.IdRecibe).emit("recibir mensaje", data)
    })
})