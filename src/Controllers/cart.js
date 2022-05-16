const Cart = require('../Models/cart')
const Product = require('../Models/product')


const items = async (userId) => {
    try {
        const cart = await Cart.findOne({ userId: userId })
            .populate("cartItems.product", "_id name price images sizes quantity offer")
        let cartItems = [];
        if (cart) {
            cart.cartItems.map(prod => {
                let inStock
                let quantity
                if (prod.product.sizes.length === 0) {
                    inStock = prod.product.quantity
                }
                else {
                    inStock = prod.product.sizes.find(s => s.size === prod.size).quantity
                }
                if (prod.quantity > inStock) {
                    quantity = inStock
                } else {
                    quantity = prod.quantity
                }
                cartItems.push({
                    _id: prod.product._id,
                    name: prod.product.name,
                    image: prod.product.images[0],
                    price: prod.product.price,
                    inStock: inStock,
                    quantity: quantity,
                    size: prod.size,
                    offer: prod.product.offer,
                    currentPrice: prod.product.offer && Math.round(prod.product.price - ((prod.product.offer * prod.product.price)/100))

                })
            });
        }
        return cartItems
    } catch (error) {
        return []

    }
}
const getCartItems = async (req, res) => {
    try {
        const cartItems = await items(req.user._id)
        res.status(200).json({ cartItems });
    } catch (error) {
        res.status(400).json({ error });
    }
}


const addItemToCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user._id })
        const product = await Product.findById(req.params.id)
        const { size } = req.query
        const sizeProperty = size === 'undefined' ? {} : { size: size }
        let inStock = product.sizes.length === 0 ? product.quantity : product.sizes.find(x => x.size && x.size === size).quantity

        if (inStock > 0) {
            if (cart) {
                const item = product.sizes.length === 0 ? cart.cartItems.find((c) => (c.product == req.params.id)) :
                    cart.cartItems.find((c) => (c.product == req.params.id && c.size === size))
                if (item) {
                    item.quantity < inStock && await Cart.findOneAndUpdate({ userId: req.user._id, "cartItems._id": item._id },
                        {
                            $inc: { "cartItems.$.quantity": 1 }
                        });
                }
                else {
                    await Cart.findOneAndUpdate({ userId: req.user._id },
                        {
                            $push: {
                                cartItems: {
                                    product: req.params.id,
                                    quantity: 1,
                                    ...sizeProperty
                                }
                            }
                        });
                }
            }
            else {
                let cart = new Cart({
                    userId: req.user._id,
                    cartItems: [{
                        product: req.params.id,
                        quantity: 1,
                        ...sizeProperty
                    }]
                });
                await cart.save()
            }
        }

        const cartItems = await items(req.user._id)
        res.status(201).json({ cartItems })
    } catch (error) {
        res.status(400).send(error)
    }
}
const reduceQuantity = async (req, res) => {
    const size = req.query.size
    try {
        let cart = await Cart.findOne({ userId: req.user._id, "cartItems.product": req.params.id })
        const item = size === 'undefined' ? cart && cart.cartItems.find((c) => c.product == req.params.id)
            : cart && cart.cartItems.find((c) => c.size === size)

        if (item) {
            if (item.quantity > 1) {
                await Cart.findOneAndUpdate({ userId: req.user._id, "cartItems._id": item._id },
                    { $inc: { "cartItems.$.quantity": -1 } })
            } else {
                
                await Cart.findOneAndUpdate({ userId: req.user._id, "cartItems._id": item._id },
                    { $pull: { cartItems: { _id: item._id } } }, { runValidators: true, new: true });

            }

        }

        const cartItems = await items(req.user._id)
        res.status(201).json({ cartItems })

    } catch (error) {
        res.status(400).json({ error });
        
    }
}


const removeCartItem = async (req, res) => {
    const size = req.query.size
    try {
        let cart = await Cart.findOne({ userId: req.user._id, "cartItems.product": req.params.id })
        const item = size === 'undefined' ? cart && cart.cartItems.find((c) => c.product == req.params.id)
            : cart && cart.cartItems.find((c) => c.size === size)
        await Cart.findOneAndUpdate({ userId: req.user._id, "cartItems._id": item._id },
            { $pull: { cartItems: { _id: item._id } } }, { runValidators: true, new: true });
        const cartItems = await items(req.user._id)
        res.status(201).json({ cartItems })
    } catch (error) {

        res.status(400).json({ error });
    }
}

module.exports = {
    addItemToCart,
    getCartItems,
    removeCartItem,
    reduceQuantity
}


