const express=require('express')
const router=express.Router()
const {Usertemplate} =require('../templete/template')
const bcrypt=require('bcryptjs')
const {SignupValidation}=require('../Validation/Validation')
const {LoginValidation}=require('../Validation/Validation')
const jwt=require('jsonwebtoken')
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
  const emails=email.toLowerCase()
  const emailexist=await Usertemplate.findOne({email:emails})
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


router.put('/post/image/:id',verifyJwt,upload.single("file"),async(req,res)=>{
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
router.put('/post/edit/:id',verifyJwt,upload.single("file"),async(req,res)=>{
  const id=req.params.id
  const file=req.file?.path
  console.log(req.file)
  if(file){
  const files=file.replace("\\","/")
  const profileimage=files
  Usertemplate.findOneAndUpdate({Detail:'Post',"posts._id":id},{$set:{
       image:profileimage,
      'posts.title':req.body?.title,
      'posts.post':req.body?.post,
      'posts.category':req.body?.category,
      'posts.type':req.body?.type,
      'posts.subcategory':req.body?.subcategory
  }},{
    upsert:false,
    strict:false
},(err,doc)=>{
    if(err){
      res.send(err)
    }
    else{
      res.send(doc)
    }
  })}
  else{
    
    Usertemplate.findOneAndUpdate({Detail:'Post',"posts._id":id},{
    $set:{
    'posts.title':req.body?.title,
    'posts.post':req.body?.post,
    'posts.category':req.body?.category,
    'posts.type':req.body?.type
    }}).then((doc)=>{
      res.json(doc)
    } ).catch(err=>{res.json('err')})}
})
router.put('/update/:id',verifyJwt,upload.single("file"),async(req,res)=>{
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
   }).catch(err=>{res.json('err')})}
   else{
    Usertemplate.findOneAndUpdate({Detail:'Userpass',_id:req.params.id},{
      $set:{bio:bios,quote,username}
    },{ 
       strict:false}).then((doc)=>{
      res.json(doc)
    }).catch(err=>{res.json('err')})
   }
  
})
router.put('/post/comment/:id',verifyJwt,(req,res)=>{
  const commentsection=req.body.word
  const user=req.body.user
  const userid=req.body.userid
  const edit=req.body?.edit
  if(edit){
    console.log(edit)
    Usertemplate.findOneAndUpdate({Detail:'Post',"posts._id":req.params.id,'comment._id':req.body.id},{
     '$set':{'comment.$.word':commentsection,}        
    }).then((doc)=>{
        res.json(doc)
      }).then((d)=>{
      console.log(d)
    }).catch(err=>{res.json('err')})
  }
  else{
  Usertemplate.findOneAndUpdate({Detail:"Post","posts._id":req.params.id},{
  $push:{comment:{word:commentsection,
                  user:user,
                  userid:userid,
                 }}
},{ upsert:false,
   strict:false}).then((doc)=>{
    res.json(doc)
  }).catch(err=>{res.json('err')})}
 
})
router.put('/post/like/:id',verifyJwt,async(req,res)=>{
  const iduser=await Usertemplate.findOne({$or:[{Detail:'Post','posts.likes.id':req.body.id},{Detail:'Post','posts.love.id':req.body.id},{Detail:'Post','posts.laugh.id':req.body.id},{Detail:'Post','posts.cry.id':req.body.id},{Detail:'Post','posts.dislikes.id':req.body.id}]})
  if(iduser){
    const likess=await Usertemplate.findOne({Detail:'Post','posts.likes.id':req.body.id})
    if(likess){
      Usertemplate.findOneAndUpdate({Detail:'Post','posts.likes.id':req.body.id},{
        $pull:{'posts.likes':{id:req.body.id}}
        
      }).then((r)=>{
        res.json('clear')
      }).catch(err=>{res.json('err')})
    }
    const loves=await Usertemplate.findOne({Detail:'Post','posts.love.id':req.body.id})
    if(loves){
      Usertemplate.findOneAndUpdate({Detail:'Post','posts.love.id':req.body.id},{
        $pull:{'posts.love':{id:req.body.id}}
        
      }).then((r)=>{
        res.json('clear')
      }).catch(err=>{res.json('err')})
    }
    const laughs=await Usertemplate.findOne({Detail:'Post','posts.laugh.id':req.body.id})
    if(laughs){
      Usertemplate.findOneAndUpdate({Detail:'Post','posts.laugh.id':req.body.id},{
        $pull:{'posts.laugh':{id:req.body.id}}
        
      }).then((r)=>{
        res.json('clear')
      }).catch(err=>{res.json('err')})
    }
    const dislike=await Usertemplate.findOne({Detail:'Post','posts.dislikes.id':req.body.id})
    if(dislike){
      Usertemplate.findOneAndUpdate({Detail:'Post','posts.dislikes.id':req.body.id},{
        $pull:{'posts.dislikes':{id:req.body.id}}
        
      }).then((r)=>{
        res.send('clear')
      }).catch(err=>{res.json('err')})
    }
    const crys=await Usertemplate.findOne({Detail:'Post','posts.cry.id':req.body.id})
    if(crys){
      Usertemplate.findOneAndUpdate({Detail:'Post','posts.cry.id':req.body.id},{
        $pull:{'posts.cry':{id:req.body.id}}
        
      }).then((r)=>{
        res.json('clear')
        console.log(r)
      }).catch(err=>{res.json('err')})
    }
    
  }
  else{
    if(req.body.values=='likes')
    {
      Usertemplate.findOneAndUpdate({Detail:"Post","posts._id":req.params.id},{
        $push:{'posts.likes':{id:req.body.id}}
      },{ upsert:false,
         strict:false}).then((doc)=>{
          res.json('likes')
        }).catch(err=>{res.json('err')})
    }
    if(req.body.values=='love')
    {
      Usertemplate.findOneAndUpdate({Detail:"Post","posts._id":req.params.id},{
        $push:{'posts.love':{id:req.body.id}}
      },{ upsert:false,
         strict:false}).then((doc)=>{
          res.json('love')}).catch(err=>{res.json('err')})
    }
    if(req.body.values=='laugh')
    {
      Usertemplate.findOneAndUpdate({Detail:"Post","posts._id":req.params.id},{
        $push:{'posts.laugh':{id:req.body.id}}
      },{ upsert:false,
         strict:false}).then((doc)=>{
          res.json('laugh')}).catch(err=>{res.json('err')})
    }
    if(req.body.values=='cry')
    {
      Usertemplate.findOneAndUpdate({Detail:"Post","posts._id":req.params.id},{
        $push:{'posts.cry':{id:req.body.id}}
      },{ upsert:false,
         strict:false}).then((doc)=>{
          res.json('cry')}).catch(err=>{res.json('err')})
    }
    if(req.body.values=='dislikes')
    {
      Usertemplate.findOneAndUpdate({Detail:"Post","posts._id":req.params.id},{
        $push:{'posts.dislikes':{id:req.body.id}}
      },{ upsert:false,
         strict:false}).then((doc)=>{
          res.send('dislikes')}).catch(err=>{res.json('err')})
    }
  }
 
})
router.put('/post/view/:id',verifyJwt,async(req,res)=>{
  const view=await Usertemplate.findOne({Detail:'Post',"posts._id":req.params.id,'posts.view.id':req.body.id})
    if(view){
      res.json('viewed')
    }
    else{
      Usertemplate.findOneAndUpdate({Detail:"Post","posts._id":req.params.id},{
        $push:{'posts.view':{id:req.body.id}}
      },{ upsert:false,
         strict:false}).then(()=>{
           res.json('done')
         }).catch(()=>{
           res.json('err')
         })
    }
  
})
router.get('/post/getcomment/:id',verifyJwt,async(req,res)=>{
  const data=await Usertemplate.findOne({Detail:"Post","posts._id":req.params.id})
  try{
    res.json(data)
  }
  catch{
    res.json('notfound')
  }
})

router.get('/data',verifyJwt,async(req,res)=>{
  const data=await Usertemplate.find({"Detail":"Post"}).populate('userids')
   try{
     res.json(data)
   }
   catch{
     res.json('notfound')
   }
})
router.get('/get/like/:post/:id',verifyJwt,async(req,res)=>{
  const iduser=await Usertemplate.findOne({Detail:'Post',"posts._id":req.params.post,'posts.likes.id':req.params.id})
 try{ if(iduser){
    res.json('likes')
  }
  else{
    const iduse=await Usertemplate.findOne({Detail:'Post',"posts._id":req.params.post,'posts.love.id':req.params.id})
    if(iduse){
      res.json('love')
    }
    else{
      const idus=await Usertemplate.findOne({Detail:'Post',"posts._id":req.params.post,'posts.cry.id':req.params.id})
      if(idus){
        res.json('cry')
      }
      else{
        const idu=await Usertemplate.findOne({Detail:'Post',"posts._id":req.params.post,'posts.laugh.id':req.params.id})
        if(idu){
          res.json('laugh')
        }
        else{
          const idn=await Usertemplate.findOne({Detail:'Post',"posts._id":req.params.post,'posts.dislikes.id':req.params.id})
          if(idn){
            res.json('dislikes')
          }
          else{
            res.json('clear')
          }
        }
      }
    }
  }}catch{
    res.send('error')
  }
})
router.get('/post/id/:id',verifyJwt,async(req,res)=>{
  const data=await Usertemplate.findOne({"Detail":"Post","posts._id":req.params.id}).populate('userids')
   try{
     res.json(data)
   }
   catch{
     res.json('notfound')
   }
})
router.get('/post/delete/:id',verifyJwt,async(req,res)=>{
  const data=await Usertemplate.findOneAndRemove({"Detail":"Post","posts._id":req.params.id})
   try{
     res.json('delete')
     console.log('delete')
   }
   catch{
     res.json('notfound')
   }
})
router.get('/datanew/:id',verifyJwt,async(req,res)=>{
  const data=await Usertemplate.find({"Detail":"Post","posts.category":req.params.id}).populate('userids')
   try{
     res.json(data)
   }
   catch{
     res.json('notfound')
   }
})
router.get('/data/:id',verifyJwt,async(req,res)=>{
  const id=req.params.id
  const data=await Usertemplate.find({"Detail":"Post","userids":id}).populate('userids')
   try{
     res.json(data)
   }
   catch{
     res.json('notfound')
   }
})
router.get('/profile/:id',verifyJwt,async(req,res)=>{
  const data=await Usertemplate.find({"DetaiL":"userpass","_id":req.params.id}).populate('userids')
   try{
     res.json(data)
   }
   catch{
     res.json('notfound')
   }
})
router.get('/profile/auto/:id',verifyJwt,async(req,res)=>{
  const data=await Usertemplate.find({"DetaiL":"userpass","_id":req.params.id}).populate('userids')
   try{
     res.json({auth:true,data:data})
   }
   catch{
     res.json('notfound')
   }
})
router.put('/post/newsub/:id/',verifyJwt,(req,res)=>{
  const section=req.body.article
  const episodes=req.body.subtitle
  console.log(req.body)
  Usertemplate.findOneAndUpdate({Detail:"Post","posts._id":req.params.id},{
  $addToSet:{
   "posts.episode":{
      article:section,
      subtitle:episodes
    }}
},{ upsert:true,
   strict:false}).then((doc)=>{
    res.json(doc)
  }).catch(()=>{
    res.json('error')
  })

})

router.put('/post/newupdate/:id',verifyJwt,(req,res)=>{
  console.log(req.body)
  Usertemplate.findOneAndUpdate({'posts.episode._id':req.params.id},{
    $set:{
      'posts.episode.$.article':req.body.article,
      'posts.episode.$.subtitle':req.body.subtitle
    }
  }).then((doc)=>{
    res.json(doc)
  } ).catch(()=>{
    res.json('error')
  })

})

module.exports.Signuprouter=Signuprouter
module.exports.Loginrouter=Loginrouter
module.exports.Postrouter=Postrouter

