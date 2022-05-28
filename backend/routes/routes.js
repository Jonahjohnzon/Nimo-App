const express=require('express')
const router=express.Router()
const {Usertemplate} =require('../templete/template')
const bcrypt=require('bcryptjs')
const {SignupValidation}=require('../Validation/Validation')
const {LoginValidation}=require('../Validation/Validation')
const jwt=require('jsonwebtoken')
const Verifyjwt=require('../Validation/Verify')
const multer=require('multer')
const verifyJwt = require('../Validation/Verify')


const storage=multer.diskStorage({
  destination:(req,file,cb)=>{
    cb(null,'./uploads/')
  },
  filename:(req,file,cb)=>{
     cb(null,Date.now() + file.originalname)
  }
})
const fileFliter=(req,file,cb)=>{
if(file.mimetype === 'image.jpeg'||'image.png'||'image.jpg' ){
cb(null,true)
}
else{
  cb(new Error('Wrong Image Type'),false)
}

}
const upload=multer({storage:storage,limits:{
  fileSize:1024 * 20000
},
fileFilter:fileFliter})
const Signuprouter=router.post('/signup',async(req,res)=>{
  const salt=await bcrypt.genSalt(10);
  const hashpassword=await bcrypt.hash(req.body.password,salt)
  const email=req.body.email
  email.toLowerCase()
 const emailexist=await Usertemplate.findOne({email:email})
    const {error}=SignupValidation(req.body)
    
    if(error){return res.json(error.details[0].message)}
    else{
    if(req.body.comfirmpassword!=req.body.password){return res.json('Password not the same')}
    if(emailexist){
      return(res.json('email already exist'))
    }
    else{
     const userdata= new Usertemplate({
       Detail:'Userpass',
       username:req.body.username,
       email:req.body.email,
       password:hashpassword,
       comfirmpassword:hashpassword,
       gender:req.body.gender,
       bio:"",
       quote:"",
       profileimage:"",
     })
      await userdata.save()
     try{
        res.json('SignUp Sucessful')
     }
     catch(err){
        res.json(err)}}}
})
const Loginrouter=router.post("/login",async(req,res)=>{
  const {error}=LoginValidation(req.body)
  if(error){return res.json(error.details[0].message)}
  else{
  const email=req.body.email
  email.toLowerCase()
  const emailexist=await Usertemplate.findOne({email:email})
  if(!emailexist){return res.json('Invalid email')}
  else{
    const validpass=await bcrypt.compare(req.body.password,emailexist.password)
    if(!validpass)return res.json('Invalid password ')
    else{
      const token = jwt.sign({_id: emailexist._id},process.env.TOKEN_SECRET)
      const data=emailexist
      res.json({auth:true,token:token,data:data})
    }
    }}
  
})

const Postrouter=router.post('/post',verifyJwt,async(req,res)=>{
  console.log(req.body)
  const data=await new Usertemplate({
   Detail:'Post',
   posts:{
   title:req.body.title,
   post:req.body.post,
   subcategory:req.body.subcategory,
   episode:{
    subtitle:req.body.subtitle,
    article:req.body.article
   },
   category:req.body.category,
   type:req.body.type,
   },
   userids:req.body.userids
  })
   try{const post=await data.save()
       res.json(post)}
   catch(err){
     res.json('post failed')
   }


})
router.put('/post/image/:id',upload.single("file"),async(req,res)=>{
  const id=req.params.id
  const file=req.file.path
  const files=file.replace("\\","/")
  Usertemplate.updateOne({"posts._id":id},{$set:{image:files}},{
    upsert:false,
    strict:false
},(err,doc)=>{
    if(err){
      res.send(err)
    }
    else{
      res.send(doc)
    }
  })
})
router.put('/update/:id',upload.single("file"),async(req,res)=>{
  const bios=req.body?.bio
  const quote=req.body?.quote
  const username=req.body?.username
  const file=req.file?.path
  if(file){
  const files=file.replace("\\","/")
  const profileimage=files
 
   Usertemplate.findOneAndUpdate({Detail:'Userpass',_id:req.params.id},{
     $set:{bio:bios,quote,username,profileimage}
   },{ 
      strict:false}).then((doc)=>{
     res.json(doc)
   })}
   else{
    Usertemplate.findOneAndUpdate({Detail:'Userpass',_id:req.params.id},{
      $set:{bio:bios,quote,username}
    },{ 
       strict:false}).then((doc)=>{
      res.json(doc)
    })
   }
  
})
router.put('/post/comment/:id',(req,res)=>{
  const commentsection=req.body.word
  const user=req.body.user
  const userid=req.body.userid
  Usertemplate.findOneAndUpdate({Detail:"Post","posts._id":req.params.id},{
  $push:{comment:{word:commentsection,
                  user:user,
                  userid:userid,
                 }}
},{ upsert:false,
   strict:false}).then((doc)=>{
    res.json(doc)
  })
 
})
router.get('/post/getcomment/:id',async(req,res)=>{
  const data=await Usertemplate.findOne({Detail:"Post","posts._id":req.params.id})
  try{
    res.json(data)
  }
  catch{
    res.json('notfound')
  }
})

router.get('/data',async(req,res)=>{
  const data=await Usertemplate.find({"Detail":"Post"}).populate('userids')
   try{
     res.json(data)
   }
   catch{
     res.json('notfound')
   }
})
router.get('/data/:id',async(req,res)=>{
  const id=req.params.id
  const data=await Usertemplate.find({"Detail":"Post","userids":id}).populate('userids')
   try{
     res.json(data)
   }
   catch{
     res.json('notfound')
   }
})
router.get('/profile/:id',async(req,res)=>{
  const data=await Usertemplate.find({"DetaiL":"userpass","_id":req.params.id}).populate('userids')
   try{
     res.json(data)
   }
   catch{
     res.json('notfound')
   }
})

module.exports.Signuprouter=Signuprouter
module.exports.Loginrouter=Loginrouter
module.exports.Postrouter=Postrouter

