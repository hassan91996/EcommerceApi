const mongoose = require('./database')
const reviewSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Users', required: true
        }, 
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Products',
            required:true
        },
        comment: { type: String,trim:true},
        rating: { type: Number, required: true},
    },
    {
        timestamps: true,
    }
);

const Reviews = mongoose.model('reviews', reviewSchema);
module.exports = Reviews