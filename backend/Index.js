const express = require('express')
const app = express()
const {Signuprouter}=require('./routes/routes')
const {Loginrouter}=require('./routes/routes')
const {Postrouter}=require('./routes/routes')
const mongoose=require('mongoose')
const cors=require('cors')
require('dotenv').config()



mongoose.connect(process.env.MONGO_DB, {useNewUrlParser: true, useUnifiedTopology: true},()=>{
    console.log('mongo connected')
})
app.use('/uploads',express.static('uploads'))
app.use(cors())
app.use(express.json())
app.use("/users",Signuprouter)
app.use("/auth",Loginrouter)
app.use("/user",Postrouter)

app.listen(4000,()=>{
    console.log('port connected')
})
