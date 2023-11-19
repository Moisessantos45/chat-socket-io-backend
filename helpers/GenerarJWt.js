import Jwt from "jsonwebtoken"

const GenerarJWT = (id) => {
  return Jwt.sign({id},process.env.JWT_SECRET)
}

export default GenerarJWT