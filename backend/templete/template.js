const { date, string } = require('@hapi/joi')
const mongoose=require('mongoose')
const episode=new mongoose.Schema({
    article:{
        type:String
    },
    subtitle:{
        type:String
    }
})
const Likeid=new mongoose.Schema({
    id:{
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
    },
    likes:[
        Likeid
     ],
     drag:{
         type:String
     },
     image:{
         type:String
     },
     drag:{
         type:String
     },
     replyname:{
         type:String
     },
     replyid:{
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
    level:{
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
    likes:[
       Likeid
    ],
    love:[
        Likeid
     ],
    laugh:[
        Likeid
     ],
    cry:[
        Likeid
     ],
    dislikes:[
        Likeid
     ],
    view:[
        Likeid
    ],
    allowcomment:{
        type:Boolean
    }
        
    
})

const Newnotice=new mongoose.Schema({
    new:{
        type:String
    },
    from:{
        type:String
    },
    to:{
        type:String
    }
    ,
    date:{
        type:Date,
        default:Date.now
    },
    userpostid:{
        type:String
    }
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
blocked:{
type:Boolean
},
wordc:{
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
},
notification:{
    messages:[Newnotice],
    alert:{
        type:Boolean
    }
}

})

module.exports.Usertemplate=mongoose.model('user',Usertemplate)
