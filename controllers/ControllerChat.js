import User from "../middleware/auth_firebase.js"
import Jwt from "jsonwebtoken"
import GenerarJWT from "../helpers/GenerarJWt.js"

const obtenerFecha = () => {
    const ahora = new Date();

    const dia = ahora.getDate();
    const mes = ahora.getMonth() + 1;
    const año = ahora.getFullYear();

    return `${dia}/${mes}/${año}`;
};

const obtenerHora = () => {
    const ahora = new Date();

    const horas = ahora.getHours();
    const minutos = ahora.getMinutes();
    const segundos = ahora.getSeconds();

    return `${horas}:${minutos}:${segundos}`;
};

const registrarse = async (req, res) => {
    const { email, nombre, password, url_imagen } = req.body
    const token = ""
    const activo = false
    const fondo=""
    try {
        const usuarios = await User.collection("Usuarios").get()
        if(usuarios.docs.length>20){
            return res.status(403).json({ msg: "Limite se usuario alcanzado" })
        }
        const usuario = await User.collection("Usuarios").add({
            email, nombre, password, token, url_imagen, activo,fondo
        })
        res.status(200).json({ msg: "Usuario registrado con éxito" })
    } catch (error) {
        console.error("Error al registrar el usuario: ", error)
        res.status(403).json({ msg: "Hubo un error al intentar registrar el usuario" })
    }
}

const login = async (req, res) => {
    const { email, password } = req.body
    const datos = await User.collection("Usuarios").where("email", "==", email).where("password", "==", password).get();
    if(!datos) return res.status(403).json({msg:"Datos incorrectos"})
    if (datos.empty) {
        return res.json({ msg: "usuario no encontrado" }) 
    }
    const id = datos.docs[0].id;
    let token = GenerarJWT(id)
    try {
        await User.collection("Usuarios").doc(id).set({ token: token, activo: true }, { merge: true });
        const user = await User.collection("Usuarios").doc(id).get()
        // console.log(user)
        const usuario = user.data();
        usuario.id = id;
        const { password, ...data } = usuario
        res.json(data)
    } catch (error) {
        res.status(404).json({ msg: "Usuario no valido" })
    }
}


const perfil = async (req, res) => {
    const authHeader = req.get('Authorization');
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(404).json({ msg: "No se encontro token" })
    const { id } = Jwt.verify(token, process.env.JWT_SECRET)
    try {
        const user = await User.collection("Usuarios").doc(id).get()
        const usuario = user.data();
        usuario.id = user.id;
        const { password, ...data } = usuario
        res.json(data)
    } catch (error) {
        res.status(404).json({ msg: "Usuario no valido" })
    }
}

const solicitar_contactos = async (req, res) => {
    const { id } = req.params
    // console.log(id)
    let todos_contactos = []
    const contactos = await User.collection('Usuarios').doc(id).collection('Contactos').get();

    if (!contactos.empty) {
        contactos.forEach(docs => {
            let docData = docs.data();
            docData.id = docs.id;
            todos_contactos.push(docData);
        });
    } else {
        return res.status(403).json({ msg: "No se encontro usuario" })
    }
    res.json(todos_contactos)
}

// const solicitar_mensajes = async (req, res) => {
//     const { usuarioId, contactoId } = req.params
//     const mensajes = await User.collection('Usuarios').doc(usuarioId).collection('Contactos').doc(contactoId).collection('Mensajes').get();
//     const todos_mensajes = []
//     if (!mensajes.empty) {
//         mensajes.forEach(docs => {
//             let docData = docs.data();
//             docData.id = docs.id;
//             todos_mensajes.push(docData);
//         });
//     }
//     res.json(todos_mensajes)
// }

// const solicitar_mensajes = async (req, res) => {
//     const { usuarioId, contactoId } = req.params
//     const ids = [usuarioId, contactoId]
//     const mensajesEnviados = await User.collection('Mensajes').where("IdEmite", "in", ids).get();
//     const mensajesRecibidos = await User.collection('Mensajes').where("IdRecibe", "in", ids).get();

//     const convertirDocsAArray = (docs) => docs.docs.map(doc => ({ id: doc.id, ...doc.data() }));

//     const mensajesEnviadosArray = convertirDocsAArray(mensajesEnviados);
//     const mensajesRecibidosArray = convertirDocsAArray(mensajesRecibidos);

//     const mensajesCombinados = [];

//     const totalMensajes = Math.max(mensajesEnviadosArray.length, mensajesRecibidosArray.length);

//     for (let i = 0; i < totalMensajes; i++) {
//         if (i < mensajesEnviadosArray.length) {
//             mensajesCombinados.push(mensajesEnviadosArray[i]);
//         }

//         if (i < mensajesRecibidosArray.length) {
//             mensajesCombinados.push(mensajesRecibidosArray[i]);
//         }
//     }
//     mensajesCombinados.sort((a, b) => a.timestamp - b.timestamp);
//     console.log(mensajesCombinados);
//     res.json(mensajesCombinados)
// }

const solicitar_mensajes = async (req, res) => {
    const { usuarioId, contactoId } = req.params
    const ids = [usuarioId, contactoId]
    let mensajesEnviados = await User.collection('Mensajes').where("IdEmite", "in", ids).get();
    let mensajesRecibidos = await User.collection('Mensajes').where("IdRecibe", "in", ids).get();

    mensajesEnviados = mensajesEnviados.docs.map(doc => ({...doc.data(), tipo: 'enviado'}));
    mensajesRecibidos = mensajesRecibidos.docs.map(doc => ({...doc.data(), tipo: 'recibido'}));

    let mensajes = [...mensajesEnviados, ...mensajesRecibidos];

    mensajes.sort((a, b) => {
        const fechaHoraA = new Date(`${a.fecha} ${a.hora}`);
        const fechaHoraB = new Date(`${b.fecha} ${b.hora}`);
        return fechaHoraA - fechaHoraB;
    });

    res.json(mensajes);
}


const registrar_contacto = async (req, res) => {
    const { id, nombre, idContacto } = req.body
    // console.log(req.body)
    const activo = false
    try {
        await User.collection("Usuarios").doc(id).collection('Contactos').doc(idContacto).set({
            nombre, activo
        })
        const contacto_actual = await User.collection("Usuarios").doc(id).collection('Contactos').
            doc(idContacto).get()
        const contacto_registrado = await User.collection("Usuarios").doc(idContacto).get()
        let dataContact = contacto_actual.data();
        dataContact.id = contacto_actual.id;
        dataContact.activo = contacto_registrado.data().activo
        dataContact.foto = contacto_registrado.data().url_imagen
        res.json(dataContact)
    } catch (error) {
        console.error("Error al registrar el contacto: ", error)
        res.status(403).json({ msg: "Hubo un error al intentar registrar el contacto" })
    }
}

// const agregar_mensaje = async (req, res) => {
//     const { id, contactoId, mensaje, IdEmite, IdRecibe,imagen } = req.body
//     try {
//         const message = await User.collection("Usuarios").doc(id).collection('Contactos').doc(contactoId).collection('Mensajes').add({
//             mensaje, IdEmite, IdRecibe,imagen
//         })
//         const mensaje_actual = await User.collection("Usuarios").doc(id).collection('Contactos').doc(contactoId).collection('Mensajes').doc(message.id).get()
//         let dataMessage = mensaje_actual.data();
//         dataMessage.id = mensaje_actual.id;
//         res.json(dataMessage)
//     } catch (error) {
//         console.error("Error al enviar el mensaje: ", error)
//         res.status(500).json({ msg: "Hubo un error al intentar enviar el mensaje" })
//     }
// }

const agregar_mensaje = async (req, res) => {
    const { mensaje, IdEmite, IdRecibe, imagen } = req.body
    // console.log(req.body)
    const fecha = obtenerFecha()
    const hora = obtenerHora()
    try {
        const message = await User.collection('Mensajes').add({
            mensaje, IdEmite, IdRecibe, imagen, fecha, hora
        })
        const mensaje_actual = await User.collection('Mensajes').doc(message.id).get()
        const usuario = await User.collection("Usuarios").doc(IdEmite).get()
        const usuario_recibe = await User.collection("Usuarios").doc(IdRecibe).collection("Contactos").doc(IdEmite).get()
        if (!usuario_recibe.exists) {
            await User.collection("Usuarios").doc(IdRecibe).collection('Contactos').doc(IdEmite).set({
                nombre: IdEmite, activo: usuario.data().activo, foto: usuario.data().url_imagen
            })
        }
        let dataMessage = mensaje_actual.data();
        dataMessage.id = mensaje_actual.id;
        // console.log(dataMessage)
        res.json(dataMessage)
    } catch (error) {
        console.error("Error al enviar el mensaje: ", error)
        res.status(404).json({ msg: "Hubo un error al intentar enviar el mensaje" })
    }
}

const eliminar_contacto = async (req, res) => {
    const { usuarioId, contactoId } = req.params
    try {
        await User.collection('Usuarios').doc(usuarioId).collection('Contactos').doc(contactoId).delete()
        res.status(200).json({ msg: "Contacto eliminado" })
    } catch (error) {
        res.json({ msg: "No se logro eliminar" })
    }
}

const actulizar_contacto = async (req, res) => {
    const { usuarioId, contactoId, nombre } = req.body
    try {
        await User.collection('Usuarios').doc(usuarioId).collection('Contactos').doc(contactoId).update({ nombre: nombre })
        const usuario = await User.collection('Usuarios').doc(usuarioId).collection('Contactos').doc(contactoId).get()
        let dataContact = usuario.data();
        dataContact.id = usuario.id;
        res.json(dataContact)
    } catch (error) {
        res.json({ msg: "No se logro actulizar" })
    }
}

// const actulizar_informacion = async (req, res) => {
//     const { id, email, nombre, password } = req.body
//     try {
//         await User.collection('Usuarios').doc(id).update({ email, nombre, password })
//         res.json({ msg: "Tarea actulizada" })
//     } catch (error) {
//         res.json({ msg: "No se logro actulizar" })
//     }
// }

const actulizar_informacion = async (req, res) => {
    const { id, email, nombre, password, url_imagen,fondo } = req.body;
    let updateData = {};
    console.log(req.body)
    if (email) updateData.email = email;
    if (nombre) updateData.nombre = nombre;
    if (password) updateData.password = password;
    if (url_imagen) updateData.url_imagen = url_imagen
    if(fondo) updateData.fondo=fondo

    try {
        if (Object.keys(updateData).length > 0) {
            await User.collection('Usuarios').doc(id).update(updateData);
            const user = await User.collection("Usuarios").doc(id).get()
            const usuario = user.data();
            usuario.id = user.id;
            const { password, ...data } = usuario
            res.json(data)
        } else {
            res.json({ msg: "No hay datos para actualizar" });
        }
    } catch (error) {
        res.json({ msg: "No se logro actulizar" });
    }
}


const actulizar_foto = async (req, res) => {
    const { id, url_imagen } = req.body
    try {
        await User.collection('Usuarios').doc(id).update({ url_imagen: url_imagen })
        res.status(200).json({ msg: "Tarea actulizada" })
    } catch (error) {
        res.json({ msg: "No se logro actulizar" })
    }
}

const logout = async (req, res) => {
    const { id } = req.body
    const user = await User.collection("Usuarios").doc(id).get()
    if (!user) return res.status(404).json({ msg: "No se puedo realizar la accion" })
    try {
        await User.collection("Usuarios").doc(id).set({ token: "", activo: false }, { merge: true });
        res.status(200).json({ msg: "Accion realizada correctamente" })
    } catch (error) {
        res.json({ msg: "No se encontro usuario" })
    }
}

export {
    registrarse,
    login,
    perfil,
    solicitar_contactos,
    solicitar_mensajes,
    registrar_contacto,
    agregar_mensaje,
    eliminar_contacto,
    actulizar_contacto,
    actulizar_informacion,
    actulizar_foto,
    logout
}