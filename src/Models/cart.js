const mongoose = require('./database')
const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true,
        unique: true
    },
    cartItems: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Products',
                required: true
            },
            quantity: {
                type: Number,
                default: 1
            },
            size: {
                type: String
            }
        }
    ]


}, { timestamps: true })

const Cart = mongoose.model('Carts', cartSchema);

module.exports = Cart