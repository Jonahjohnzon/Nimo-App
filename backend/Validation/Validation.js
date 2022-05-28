const joi=require('@hapi/joi')

const SignupValidation=(data)=>{
    const validation= joi.object({
        username:joi.string().min(2).max(15).required(),
        email:joi.string().email().required().min(6),
        password:joi.string().required().min(6),
        comfirmpassword:joi.string().required().min(6),
        gender:joi.string().required(),
        bio:joi.string(),
        quote:joi.string(),
        profileimage:joi.string()})
        
        return validation.validate(data)
}
const LoginValidation=(data)=>{
    const validation= joi.object({
        email:joi.string().email().required().min(6),
        password:joi.string().required().min(6)})
        return validation.validate(data)
}
module.exports.SignupValidation=SignupValidation
module.exports.LoginValidation=LoginValidation