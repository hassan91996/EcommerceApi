const jwt = require('jsonwebtoken')
const User = require('../Models/user')


const auth = async (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        if (!token) {
            throw new Error()
        }
        const userData = jwt.verify(token, process.env.JWT_SEC);
        const user = await User.findOne({ _id: userData.id,userType:userData.userType})
        if (!user) {
            throw new Error()
        }
        req.user = user
        next();
    } 
    catch (error) { 
        res.status(401).send('not Authenticated')
    }
}
const authSeller=(req,res,next)=>{
    auth(req,res,()=>{
      if(req.user.userType==="seller"){
          next();
      }else{
        res.status(403).send('not allowed')
      }
    })
}
const authadmin=(req,res,next)=>{
    auth(req,res,()=>{
      if(req.user.userType==="admin"){
          next();
      }else{
        res.status(403).send('not allowed')
      }
    })
}

module.exports = {
    auth,
    authadmin,
    authSeller
}
