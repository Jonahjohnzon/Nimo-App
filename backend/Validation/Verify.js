const jwt=require('jsonwebtoken')
const verifyJwt=(req,res,next)=>{
const token=req.headers["auth-token"]

if (!token){return res.json('Please Login')}
else{
    try{
    const verify=jwt.verify(token,process.env.TOKEN_SECRET)
        req.user=verify;
            next()}
     catch(err){
         res.json('authentication failed')
     }
        }
    }

module.exports=verifyJwt