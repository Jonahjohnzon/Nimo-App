const express=require('express')
const router=express.Router()
const {Usertemplate} =require('../templete/template')
const bcrypt=require('bcryptjs')
const {SignupValidation}=require('../Validation/Validation')
const {LoginValidation}=require('../Validation/Validation')
const jwt=require('jsonwebtoken')
const multer=require('multer')
const verifyJwt = require('../Validation/Verify')
const {generateurl,deleteurl}=require('../S3')


const Signuprouter=router.post('/signup',async(req,res)=>{
  const salt=await bcrypt.genSalt(10);
  const hashpassword=await bcrypt.hash(req.body.password,salt)
  const email=req.body.email.toLowerCase()
  const usernameexist=await Usertemplate.findOne({username:{'$regex':`^${req.body.username}$`,$options:'i'}})
  if(usernameexist){
      return res.json('Username already taken')
  }
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
       email:email,
       password:hashpassword,
       comfirmpassword:hashpassword,
       gender:req.body.gender,
       bio:"",
       quote:"",
       profileimage:"",
       blocked:false,
       wordc:""
     })
      await userdata.save()
     try{
       return res.json('SignUp Sucessful')
     }
     catch(err){
      return  res.json(err)}}}
})
const Loginrouter=router.post("/login",async(req,res)=>{
  const {error}=LoginValidation(req.body)
if(error){return res.json(error.details[0].message)}
  else{
  const email=req.body.email.toLowerCase()
  const emailexist=await Usertemplate.findOne({email:email})
  if(!emailexist){return res.json('Invalid email')}
  else{
    const validpass=await bcrypt.compare(req.body.password,emailexist.password)
    if(!validpass)return res.json('Invalid password ')
    else{
      const token =jwt.sign({_id: emailexist._id},process.env.TOKEN_SECRET)
      const data=emailexist
      res.json({auth:true,token:token,data:data})
    }
    }}
})
router.post("/secret",async(req,res)=>{
 const wordc=req.body.wordc
 const email=req.body.email
 const emailexist=await Usertemplate.findOne({Detail:'Userpass',email:email})
 if(!emailexist){
  return res.json('Invalid Email')
 }
 else{
  const word=emailexist.wordc.toLowerCase()
  if(word==wordc.toLowerCase()){
    return res.json(emailexist._id)
  }
  else{
    return res.json('Invalid Secret Word')
  }

 }
})

router.put('/password/:id',async(req,res)=>{
  const salt=await bcrypt.genSalt(10);
  const hashpassword=await bcrypt.hash(req.body.password,salt)
  const old=req.body.oldpassword
  const newpass=req.body.password
  const compass=req.body.comfirmpassword
     const user=await Usertemplate.findOne({Detail:'Userpass',_id:req.params.id})
     if(user){
      const validpass=await bcrypt.compare(old,user.password)
      if(!validpass){
        return res.json('Wrong Password')
      }
      else{
       if(newpass!=compass){
        return res.json('Passwords Do Not Match')
       }
       else{
        Usertemplate.findOneAndUpdate({Detail:'Userpass',_id:req.params.id},{$set:{password:hashpassword,comfirmpassword:hashpassword}},{
          upsert:false,
          strict:false
      }).then(()=>{
        res.json('Updated')
      }).catch((e)=>{
        console.log(e)
      })
      }
      }
     }
})
router.put('/password/reset/:id',async(req,res)=>{
  const wordc=req?.body?.wordc
  const salt=await bcrypt.genSalt(10);
  const hashpassword=await bcrypt.hash(req.body.password,salt)
  const newpass=req.body.password
  const compass=req.body.comfirmpassword
     const user=await Usertemplate.findOne({Detail:'Userpass',_id:req.params.id})
     if(user.wordc==wordc.toLowerCase()){
       if(newpass!=compass){
        return res.json('Passwords Do Not match')
       }
       else{
        Usertemplate.findOneAndUpdate({Detail:'Userpass',_id:req.params.id},{$set:{password:hashpassword,comfirmpassword:hashpassword}},{
          upsert:false,
          strict:false
      }).then(()=>{
        res.json('Updated')
      }).catch((e)=>{
        console.log(e)
      })
      }}
      else{
        res.json('Wrong Secret Word')
      }
})

const Postrouter=router.post('/post',verifyJwt,async(req,res)=>{
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
   level:req.body.level,
   category:req.body.category,
   type:req.body.type,
   allowcomment:req.body.allowcomment
   },
   userids:req.body.userids
  })
   try{const post=await data.save()
      return res.json(post)}
   catch(err){
    return res.json('post failed')
   }


})
router.get('/images',async(req,res)=>{
 const url=await generateurl()
 return res.send({url})

})
router.get('/images/delete/:id',async(req,res)=>{
  await deleteurl(req.params.id).then((e)=>{
    return res.json('deleted')
  }).catch((e)=>{
    return res.json(e)
  })
  
 
 })


router.put('/post/image/:id',verifyJwt,async(req,res)=>{
  const id=req.params.id
   const files=req.body.image
   console.log(files)
  Usertemplate.updateOne({"posts._id":id},{$set:{image:files}},{
    upsert:false,
    strict:false
},(err,doc)=>{
    if(err){
    return  res.send(err)
    }
    else{
     return res.send(doc)
    }
  })
})
router.put('/post/edit/:id',verifyJwt,async(req,res)=>{
  const id=req.params.id
  const file=req.body.image
  if(file){
  Usertemplate.findOneAndUpdate({Detail:'Post',"posts._id":id},{$set:{
       image:file,
      'posts.title':req.body?.title,
      'posts.post':req.body?.post,
      'posts.category':req.body?.category,
      'posts.type':req.body?.type,
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
    return  res.json(doc)
    } ).catch(err=>{return res.json('err')})}
})
router.put('/update/:id',verifyJwt,async(req,res)=>{
  const bios=req.body?.bio
  const quote=req.body?.quote
  const username=req.body?.username
  const file=req.body?.profileimage
  const wordc=req.body?.wordc

  if(file){
  const profileimage=file

    Usertemplate.findOneAndUpdate({Detail:'Userpass',_id:req.params.id},{
      $set:{profileimage}
    },{ 
       strict:false}).then((doc)=>{
     return res.json(doc)
    }).catch(err=>{return res.json('err')})
 }
   else{
    const user= await Usertemplate.findOne({Detail:'Userpass',_id:req.params.id})
    if(user.username.toLowerCase()==username.toLowerCase()){
    Usertemplate.findOneAndUpdate({Detail:'Userpass',_id:req.params.id},{
      $set:{bio:bios,quote,username,wordc}
    },{ 
       strict:false}).then((doc)=>{
     return res.json(doc)
    }).catch(err=>{return res.json('err')})
   }
   else{
    const usernameexist=await Usertemplate.findOne({username:{'$regex':`^${username}$`,$options:'i'}})
      if(usernameexist){
        return res.json('Username already taken')
      }
    
      Usertemplate.findOneAndUpdate({Detail:'Userpass',_id:req.params.id},{
        $set:{bio:bios,quote,username,wordc}
      },{ 
         strict:false}).then((doc)=>{
       return res.json(doc)
      }).catch(err=>{ return res.json('err')})
   }}
  
})
router.put('/post/comment/:id',verifyJwt,(req,res)=>{
  const commentsection=req.body.word
  const user=req.body.user
  const userid=req.body.userid
  const drag=req.body?.drag
  const replyname=req.body?.replyname
  const replyid=req.body?.replyid
  const image=req.body?.image


  Usertemplate.findOneAndUpdate({Detail:"Post","posts._id":req.params.id},{
  $push:{comment:{word:commentsection,
                  user,
                  userid,
                  drag,
                  replyid,
                  replyname,
                  image
                 }}
},{ upsert:false,
   strict:false}).then((doc)=>{
   return res.json(doc)
  }).catch(err=>{return res.json('err')})
 
})
router.put('/post/like/:id',verifyJwt,async(req,res)=>{

    const likess=await Usertemplate.findOne({'posts._id':req.params.id,'posts.likes.id':req.body.id})
    if(likess){
     await Usertemplate.findOneAndUpdate({'posts._id':req.params.id,'posts.likes.id':req.body.id},{
        $pull:{'posts.likes':{id:req.body.id}} 
      }).then((r)=>{
       return res.json('clear')
      }).catch(err=>{return res.json('err')})
    }
    if(!likess){
    const loves=await Usertemplate.findOne({'posts._id':req.params.id,'posts.love.id':req.body.id})
    if(loves){
      await Usertemplate.findOneAndUpdate({'posts._id':req.params.id,'posts.love.id':req.body.id},{
        $pull:{'posts.love':{id:req.body.id}}
        
      }).then((r)=>{
      return res.json('clear')
      }).catch(err=>{return res.json('err')})
    }
    if(!loves){
    const laughs=await Usertemplate.findOne({'posts._id':req.params.id,'posts.laugh.id':req.body.id})
    if(laughs){
      await Usertemplate.findOneAndUpdate({'posts._id':req.params.id,'posts.laugh.id':req.body.id},{
        $pull:{'posts.laugh':{id:req.body.id}}
        
      }).then((r)=>{
        return res.json('clear')
      }).catch(err=>{return res.json('err')})
    }
    if(!laughs){
    const dislike=await Usertemplate.findOne({'posts._id':req.params.id,'posts.dislikes.id':req.body.id})
    if(dislike){
     await Usertemplate.findOneAndUpdate({'posts._id':req.params.id,'posts.dislikes.id':req.body.id},{
        $pull:{'posts.dislikes':{id:req.body.id}}
        
      }).then((r)=>{
       return res.json('clear')
      }).catch(err=>{return res.json('err')})
    }
    if(!dislike){
    const crys=await Usertemplate.findOne({'posts._id':req.params.id,'posts.cry.id':req.body.id})
    if(crys){
     await Usertemplate.findOneAndUpdate({'posts._id':req.params.id,'posts.cry.id':req.body.id},{
        $pull:{'posts.cry':{id:req.body.id}}
        
      }).then((r)=>{
       return res.json('clear')
      }).catch(err=>{return res.json('err')})
    }
  if(!crys){
    if(req.body.values=='likes')
    {
      await Usertemplate.findOneAndUpdate({Detail:"Post","posts._id":req.params.id},{
        $push:{'posts.likes':{id:req.body.id}}
      },{ upsert:false,
         strict:false}).then((doc)=>{
         return res.json('likes')
        }).catch(err=>{return res.json('err')})
    }
    if(req.body.values=='love')
    {
     await Usertemplate.findOneAndUpdate({Detail:"Post","posts._id":req.params.id},{
        $push:{'posts.love':{id:req.body.id}}
      },{ upsert:false,
         strict:false}).then((doc)=>{
         return res.json('love')}).catch(err=>{return res.json('err')})
    }
    if(req.body.values=='laugh')
    {
      await Usertemplate.findOneAndUpdate({Detail:"Post","posts._id":req.params.id},{
        $push:{'posts.laugh':{id:req.body.id}}
      },{ upsert:false,
         strict:false}).then((doc)=>{
         return  res.json('laugh')}).catch(err=>{return res.json('err')})
    }
   if(req.body.values=='cry')
    {
     await Usertemplate.findOneAndUpdate({Detail:"Post","posts._id":req.params.id},{
        $push:{'posts.cry':{id:req.body.id}}
      },{ upsert:false,
         strict:false}).then((doc)=>{
         return res.json('cry')}).catch(err=>{return res.json('err')})
    }
   if(req.body.values=='dislikes')
    {
     await Usertemplate.findOneAndUpdate({Detail:"Post","posts._id":req.params.id},{
        $push:{'posts.dislikes':{id:req.body.id}}
      },{ upsert:false,
         strict:false}).then((doc)=>{
         return res.json('dislikes')}).catch(err=>{return res.json('err')})
    }
    }}}} }
 
})
router.put('/post/view/:id',verifyJwt,async(req,res)=>{
  const view=await Usertemplate.findOne({Detail:'Post',"posts._id":req.params.id,'posts.view.id':req.body.id})
    if(view){
     return res.json('viewed')
    }
    else{
      Usertemplate.findOneAndUpdate({Detail:"Post","posts._id":req.params.id},{
        $push:{'posts.view':{id:req.body.id}}
      },{ upsert:false,
         strict:false}).then(()=>{
          return  res.json('done')
         }).catch(()=>{
          return   res.json('err')
         })
    }
  
})
router.get('/post/getcomment/:id',verifyJwt,async(req,res)=>{
  const page=parseInt(req.query.page)
  const limit=parseInt(req.query.limit)
  const data=await Usertemplate.findOne({Detail:"Post","posts._id":req.params.id})
  try{
    const startIndex=(page - 1)*limit
    const endIndex=page*limit
    const mydata=data.comment.length
    const results={

    }
    if(endIndex<data.comment.length)
     results.next={
      page:page+1,
      limit:limit
    }
    if(startIndex>0){
    results.prev={
      page:page-1,
      limit:limit 
    }}
    results.current={
      page:page,
      limit:limit 
    }
    if(Math.floor(mydata/limit)>1){
      results.start={
        page:1,
        limit:limit 
      }}
    if(Math.floor(mydata/limit)>1){
      results.last={
        page:Math.floor(mydata/limit),
        limit:limit
      }}
    results.result=data.comment.slice(startIndex,endIndex)
    return  res.json(results)
  }
  catch{
    return   res.json('notfound')
  }
})
router.get('/post/deletecomment/:id',verifyJwt,async(req,res)=>{
  console.log(req.params.id)
  const data=await Usertemplate.findOneAndUpdate({"comment._id":req.params.id},{$pull:{comment:{_id:req.params.id}}})
  try{
    return   res.json(data)
  }
  catch{
    return  res.json('notfound')
  }
})

router.get('/data',verifyJwt,async(req,res)=>{
  const data=await Usertemplate.find({"Detail":"Post"}).populate('userids')
   try{
    return  res.json(data)
   }
   catch{
    return  res.json('notfound')
   }
})
router.get('/get/like/:post/:id',verifyJwt,async(req,res)=>{
  const iduser=await Usertemplate.findOne({Detail:'Post',"posts._id":req.params.post,'posts.likes.id':req.params.id})
 try{ if(iduser){
  return  res.json('likes')
  }
  else{
    const iduse=await Usertemplate.findOne({Detail:'Post',"posts._id":req.params.post,'posts.love.id':req.params.id})
    if(iduse){
      return  res.json('love')
    }
    else{
      const idus=await Usertemplate.findOne({Detail:'Post',"posts._id":req.params.post,'posts.cry.id':req.params.id})
      if(idus){
        return   res.json('cry')
      }
      else{
        const idu=await Usertemplate.findOne({Detail:'Post',"posts._id":req.params.post,'posts.laugh.id':req.params.id})
        if(idu){
          return  res.json('laugh')
        }
        else{
          const idn=await Usertemplate.findOne({Detail:'Post',"posts._id":req.params.post,'posts.dislikes.id':req.params.id})
          if(idn){
            return   res.json('dislikes')
          }
          else{
            return   res.json('clear')
          }
        }
      }
    }
  }}catch{
    return  res.send('error')
  }
})
router.get('/post/id/:id',verifyJwt,async(req,res)=>{
  const data=await Usertemplate.findOne({"Detail":"Post","posts._id":req.params.id}).populate('userids')
   try{
    if(!data){
      return   res.json('notfound')
    }
    else{
    return   res.json(data)}
   }
   catch{
    return   res.json('notfound')
   }
})
router.get('/post/delete/:id',verifyJwt,async(req,res)=>{
  const data=await Usertemplate.findOneAndRemove({"Detail":"Post","posts._id":req.params.id})
   try{
     res.json('delete')
     return  console.log('delete')
   }
   catch{
    return  res.json('notfound')
   }
})
router.get('/datanew/:id',verifyJwt,async(req,res)=>{
  const data=await Usertemplate.find({"Detail":"Post","posts.category":req.params.id}).populate('userids')
   try{
    return  res.json(data)
   }
   catch{
    return   res.json('notfound')
   }
})
router.get('/datamain/:id',verifyJwt,async(req,res)=>{
  const data=await Usertemplate.find({"Detail":"Post","posts.level":req.params.id}).populate('userids')
   try{
    return  res.json(data)
   }
   catch{
    return  res.json('notfound')
   }
})
router.get('/data/:id',verifyJwt,async(req,res)=>{
  const id=req.params.id
  const data=await Usertemplate.find({"Detail":"Post","userids":id}).populate('userids')
   try{
    return  res.json(data)
   }
   catch{
    return  res.json('notfound')
   }
})
router.get('/profile/:id',verifyJwt,async(req,res)=>{
  const data=await Usertemplate.find({"DetaiL":"Userpass","_id":req.params.id})
   try{
    return  res.json(data)
   }
   catch{
    return  res.json('notfound')
   }
})
router.get('/profile/auto/:id',verifyJwt,async(req,res)=>{
  const data=await Usertemplate.findOne({"Detail":"Userpass","_id":req.params.id})
   try{
    return  res.json({auth:true,data:data})
   }
   catch{
    return  res.json('notfound')
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
    return  res.json(doc)
  }).catch(()=>{
    return  res.json('error')
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
    return  res.json(doc)
  } ).catch(()=>{
    return  res.json('error')
  })

})

router.put('/post/notice/:id',verifyJwt,(req,res)=>{
  console.log(req.body)
  Usertemplate.findOneAndUpdate({"Detail":"Userpass","_id":req.params.id},{
    $push:{
      'notification.messages':{new:req.body.new,
                                from:req.body.from,
                                to:req.body.to,
                              userpostid:req.body.userpostid}
    }
  },{ upsert:false,
    strict:false}).then((doc)=>{
      return  res.json(doc)
  } ).catch((e)=>{
    return   res.json(e)
  })

})
router.put('/post/noticealert/:id',verifyJwt,(req,res)=>{
  console.log(req.body.new)
  Usertemplate.findOneAndUpdate({"Detail":"Userpass","_id":req.params.id},{
    $set:{
      'notification.alert':req.body.set
    }
  },{ upsert:false,
    strict:false}).then((doc)=>{
      return  res.json(doc)
  } ).catch((e)=>{
    return  res.json(e)
  })

})


module.exports.Signuprouter=Signuprouter
module.exports.Loginrouter=Loginrouter
module.exports.Postrouter=Postrouter

