import express from "express"
import { actulizar_contacto, actulizar_foto, actulizar_informacion, agregar_mensaje, eliminar_contacto, login, logout, perfil, registrar_contacto, registrarse, solicitar_contactos, solicitar_mensajes } from "../controllers/ControllerChat.js"
import checkAuth from "../middleware/authUser.js"

const router = express.Router()

router.post("/registrarse", registrarse)
router.post("/login", login)
router.get("/perfil",checkAuth, perfil)
router.get("/perfil/contactos/:id", solicitar_contactos)
router.get("/perfil/mensajes/:usuarioId/:contactoId", solicitar_mensajes)
router.post("/registrar-contacto", registrar_contacto)
router.post("/envio-mensaje", agregar_mensaje)
router.delete("/eliminar-contacto/:usuarioId/:contactoId", eliminar_contacto)
router.put("/actulizar-contacto", actulizar_contacto)
router.put("/actulizar-usuario", actulizar_informacion)
// router.put("/actulizar-foto",actulizar_foto)
router.post("/logout", logout)
export default router