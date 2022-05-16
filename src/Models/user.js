const mongoose = require('./database')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const validator = require('validator');
const _=require('lodash')

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("inValied Email")
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    likedproducts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Products',
        }
    ],
    userType: {
        type: String,
        enum: ['user', 'admin', 'seller'],
        default: 'user'
    },
}, { timestamps: true })


userSchema.methods.toJSON = function () {
    var user = this;
    var userObject = user.toObject();
  
    return _.pick(userObject, ['_id', 'username','email']);
  };
userSchema.methods.generateToken = function () {
    user = this
    const expiresIn = 86400;
    const token = jwt.sign({ id: user._id, userType: user.userType }, process.env.JWT_SEC, { expiresIn: expiresIn })
    return { token, expiresIn }
}
userSchema.pre('save', async function () {
    const user = this
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 12)
    }
})


module.exports = mongoose.model('Users', userSchema)


