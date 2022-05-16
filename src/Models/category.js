const mongoose = require('./database')


const categorySchema = new mongoose.Schema({
    parent: {
        type: mongoose.Types.ObjectId
    },
    name:{
        type:String,
        trim:true,
        required:true
    }


})

const Category = mongoose.model('categories', categorySchema);


module.exports = Category