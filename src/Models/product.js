const mongoose = require('./database')



const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    price: {
        type: Number,
        required: true
    },
    images: [
        {
            url: {
                type: String, required: true
            },
            id: {
                type: String, required: true
            }
        }
    ],
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'categories', required: true
    },
    color: {
        type: String,
        trim: true
    },
    quantity: {
        type: Number,

    },
    sizes: [{
        size: {
            type: String,
            trim: true
        },
        quantity: {
            type: Number,
        }
    }],
    offer: {
        type: Number
    },
    rating: { type: Number },
    numReviews: { type: Number, },
    brand: {
        type: String,
        trim: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users', required: true
    },
}, { timestamps: true })

const Product = mongoose.model('Products', productSchema);
module.exports = Product