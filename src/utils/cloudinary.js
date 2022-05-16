const cloudinary=require('cloudinary').v2

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_Cloud_Name,
    api_key: process.env.CLOUDINARY_API_Key,
    api_secret: process.env.CLOUDINARY_API_Secret
  });

  module.exports=cloudinary