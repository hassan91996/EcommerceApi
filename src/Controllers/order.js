const Order = require('../Models/order')
const Cart = require('../Models/cart')
const Product = require('../Models/product')
const User = require('../Models/user')
const generateUniqueId = require('generate-unique-id');

const getDashbordData = async (req, res) => {

    const today = new Date()
    const currentYear = new Date(today.getFullYear(), 00, 01, 02, 00)
    const nextYear = new Date(today.getFullYear() + 1, 00, 01, 02, 00)
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 02, 00)
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 02, 00)
    const lastWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6, 02, 00)

    try {
        const productsSelles = await Order.aggregate([
            {
                $match: {
                    isDelivered: true,
                    isPaid: true
                }
            },
            {
                $unwind: "$orderItems"
            },
            {
                $group:
                {
                    _id: "$orderItems.product",
                    sellerCount: { $sum: '$orderItems.quantity' },
                }
            }
        ]
        ).sort({ sellerCount: -1 })
            .limit(5)


        const topSellproducts = []
        for (let prod of productsSelles) {
            const product = await Product.findById(prod._id)
                .populate({ path: "category", select: " name" })

            topSellproducts.push({
                product: product,
                sellerCount: prod.sellerCount
            })
        }

        const totalIncom = await Order.aggregate([
            {
                $match: {
                    isPaid: true,
                    paidAt: { $gte: currentYear, $lt: nextYear }
                }
            },
            {
                $group: {
                    _id: { $month: "$paidAt" },
                    totalIncom: { $sum: '$itemsPrice' }
                }
            }
        ]).sort({ _id: 1 })

        const dailyIncom = await Order.aggregate([
            {
                $match: {
                    isPaid: true,
                    paidAt: { $gte: todayStart, $lt: todayEnd }
                }
            },
            {
                $group: {
                    _id: '',
                    totalIncom: { $sum: '$itemsPrice' }
                }
            }
        ])

        const weekIncom = await Order.aggregate([
            {
                $match: {
                    isPaid: true,
                    paidAt: { $gte: lastWeek, $lt: todayEnd }
                }
            },
            {
                $group: {
                    _id: '',
                    totalIncom: { $sum: '$itemsPrice' }
                }
            }
        ])


        const emptyProducts = await Product.find({
            $or: [{ quantity: 0 }, { "sizes.quantity": { $eq: 0 } }]
        }).populate({ path: "category", select: " name" })

        res.status(200).json({ topSellproducts, totalIncom, emptyProducts, weekIncom, dailyIncom });

    } catch (error) {
        res.status(400).json({ error });
    }

}


const getAllorder = async (req, res) => {
    try {
        const stateFilter = req.query.closed ? {
            isDelivered: true,
            isPaid: true
        } : {
            $or: [{ isDelivered: false }, { isPaid: false }]
        }
        const codeFilter = { code: { $regex: req.query.code } }
        const orders = await Order.find({
            ...stateFilter,
            ...codeFilter,
        }).populate("orderItems.product", "name")

        res.status(200).json({ orders });

    } catch (error) {
        res.status(400).json({ error });
    }

}
const getUserOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .populate("orderItems.product", "name")
        res.status(200).json({ orders });

    } catch (error) {
        res.status(400).json({ error });
    }
}

const CreateOrder = async (req, res) => {
    try {
        const code = generateUniqueId({
            length: 8,
            useNumbers: true
        })
        const order = new Order({
            orderItems: req.body.orderItems,
            CustomerInfo: req.body.CustomerInfo,
            paymentMethod: req.body.paymentMethod,
            itemsPrice: req.body.itemsPrice,
            deliveryPrice: req.body.deliveryPrice,
            totalPrice: req.body.totalPrice,
            user: req.user._id,
            code
        });
        await order.save()
        req.body.orderItems.map(async (prod) => {
            let product = await Product.findById(prod.product)
            if (product.sizes.length === 0) {
                let newStock = product.quantity - prod.quantity
                if (newStock < 0) {
                    throw new Error('quantity not enough')
                }
                product.quantity = newStock

            } else {
                for (let size of product.sizes) {
                    if (size.size === prod.size) {
                        let newStock = size.quantity - prod.quantity
                        if (newStock < 0) {
                            throw new Error('quantity not enough')
                        }
                        size.quantity = newStock
                    }
                }
            }
            await product.save()

        })
        await Cart.findOneAndDelete({ userId: req.user._id })
        res.status(201).json({ order });

    } catch (error) {
        res.status(400).json({ error });
    }
}



const getOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        res.status(20).json({ order });


    } catch (error) {
        res.status(400).json({ error });

    }
}



const setDeliverd = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        order.deliveredAt = order.isDelivered ? '' : Date.now();
        order.isDelivered = order.isDelivered ? false : true;
        await order.save();
        res.status(200).json({ order });

    } catch (error) {
        res.status(404).json({ message: 'Order Not Found' });

    }
}

const setPaid = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        order.paidAt = order.isPaid ? '' : Date.now();
        order.isPaid = order.isPaid ? false : true;
        await order.save();
        res.status(200).json({ order });

    } catch (error) {
        res.status(404).json({ message: 'Order Not Found' });

    }
}


module.exports = {
    getAllorder,
    setDeliverd,
    setPaid,
    getOrder,
    getUserOrders,
    CreateOrder,
    getDashbordData

}
