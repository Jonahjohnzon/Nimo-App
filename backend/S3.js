const S3 = require('aws-sdk/clients/s3');
const crypto = require('crypto');
const {promisify}=require('util')
const randombytes=promisify(crypto.randomBytes)

require('dotenv').config()
const name=process.env.AWS_BUCKET_NAME
const region=process.env.AWS_REGION
const accessKeyId=process.env.AWS_ACCESS
const secretAccessKey=process.env.AWS_SECRET
const s3=new S3({
region,
accessKeyId,
secretAccessKey,
signatureVersion:'v4'
})

 async function generateurl(){
    const rawBytes=await randombytes(16)
    const imagename=rawBytes.toString('hex')
    const uploadParams={
        Bucket:name,
        Key:imagename,
        Expires:60
    }

     const uploadURL=await s3.getSignedUrlPromise('putObject',uploadParams)
     return uploadURL

}
async function deleteurl(imagename){
    const uploadParam={
        Bucket:name,
        Key:imagename,
    }

     await s3.deleteObject(uploadParam,(err,data)=>{
        if(err){
            return err
        }
        if(data){
            return data
        }
     })

}
module.exports.generateurl=generateurl
module.exports.deleteurl=deleteurl


