const { date } = require('@hapi/joi')
const mongoose=require('mongoose')
const episode=new mongoose.Schema({
    article:{
        type:String
    },
    subtitle:{
        type:String
    }
})
const comment=new mongoose.Schema({
    user:{
        type:String
    },
    date:{
        type:Date,
        default:Date.now
    },
    word:{
        type:String
    },
    userid:{
        type:String
    }
})
const userpost=new mongoose.Schema({
    image:{
       type:String
    },
    title:{
      type:String
    },
    subcategory:{
        type:String
    }
    ,
    post:{
        type:String
    },
    
    category:{
        type:String
    }  ,
    episode:[episode] ,
    type:{
        type:String
    } ,
    author:{
    type:mongoose.SchemaTypes.ObjectId,
    ref:'Usertemplate'
    },
    
    
        
    
})

const Usertemplate=new mongoose.Schema({
username:{
      type:String
},
email:{
    type:String
},
password:{
    type:String
},
comfirmpassword:{
    type:String
},
gender:{
     type:String
},
bio:{
    type:String
},
quote:{
    type:String
},
profileimage:{
    type:String
},
date:{
    type:Date,
    default:()=>Date.now().toString(),
    immutable:true,
},
posts:userpost,
comment:[comment]
,userids:{
    type:mongoose.SchemaTypes.ObjectId,
    ref:'user'
},
subscribers:{
    type:mongoose.SchemaTypes.ObjectId,
    ref:'user'
},
Detail:{
    type:String
}
})

module.exports.Usertemplate=mongoose.model('user',Usertemplate)