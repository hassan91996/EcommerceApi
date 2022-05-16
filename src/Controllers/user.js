const User = require('../Models/user')
const Order = require('../Models/order')
const Product = require('../Models/product')
const Review = require('../Models/reviews')
const bcrypt = require('bcrypt')



const singup = async (req, res) => {
    const { username, email, password, userType } = req.body
    const user = new User({
        email,
        username,
        password,
        userType
    })

    try {
        const hasUser = await User.findOne({ email: email });
        if (hasUser) {
            throw new Error('هذا البريد  مستخدم بالفعل .يرجي استخدام بريد اخر');
        }
        await user.save()
        const token = user.generateToken()
        res.status(201).json({ user, token: token.token, expirIn: token.expiresIn })
    } catch (error) {
        res.status(400).json(error.message)

    }
}

const adminlogin = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email, userType: "admin" })
        if (!user) throw new Error(`المستحخدم غير موجود`)
        const match = await bcrypt.compare(req.body.password, user.password)
        if (!match) throw new Error(`كلمة المرور غير صحيحة`)
        const token = user.generateToken()
        res.status(200).json({ user, token: token.token, expirIn: token.expiresIn })
    } catch (error) {
        res.status(400).json(error.message)
    }
}
const login = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email, userType: "user" })
        if (!user) throw new Error(`المستحخدم غير موجود`)
        const match = await bcrypt.compare(req.body.password, user.password)
        if (!match) throw new Error(`كلمة المرور غير صحيحة`)
        const token = user.generateToken()
        res.status(200).json({ user, token: token.token, expirIn: token.expiresIn })
    } catch (error) {
        res.status(400).json(error.message)
    }
}

const updateUser = async (req, res) => {
    try {
        const hasUser = await User.findOne({ email: req.body.email, _id: { $ne: req.user._id } });
        if (hasUser) {
            throw new Error('هذا البريد  مستخدم بالفعل .يرجي استخدام بريد اخر')
        }
        const newuser = await User.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true })
        res.status(200).json({ newuser })

    } catch (error) {
        res.status(400).json(error.message)
    }
}

const deleteuser = async (req, res) => {
    try {
        const deleteduser = await User.findByIdAndDelete(req.params.id)
        res.status(200).send(deleteduser)

    } catch (error) {
        res.status(400).json(error)
    }
}


const fetchUsers = async (req, res) => {
    try {
        const users = await User.find().limit(1)
        res.status(200).send(users)

    } catch (error) {
        res.status(400).json(error)
    }
}
const fetchUser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
        res.status(200).json({ user })

    } catch (error) {
        res.status(400).json({ error })
    }
}


const likedItems = async (id) => {
    return await User.findById(id)
        .populate('likedproducts', 'name sizes quantity images')
        .select('likedproducts')

}



const likedproduct = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
        const item = user.likedproducts.includes(req.params.id);
        if (item) {
            user.likedproducts = user.likedproducts.filter(p => p != req.params.id)
        } else {
            user.likedproducts.push(req.params.id)
        }
        await user.save()
        const { likedproducts } = await likedItems(req.user._id)
        res.status(200).json({ likedproducts })

    } catch (error) {
        res.status(400).json({ error })
    }
}


const getlikedProducts = async (req, res) => {
    try {

        const { likedproducts } = await likedItems(req.user._id)
        res.status(200).json({ likedproducts })

    } catch (error) {
        res.status(400).json({ error })
    }
}

const userstats = async (req, res) => {
    const date = new Date();
    const lastyear = new Date(date.setFullYear(date.getFullYear() - 1))

    try {
        const data = await User.aggregate([
            { $match: { createdAt: { $gte: lastyear } } },
            {
                $project: {
                    month: {
                        $month: {
                            $convert: {
                                input: "$createdAt",
                                to: "date"
                            }
                        }
                    },

                }
            },
            {
                $group: {
                    _id: "$month",
                    total: { $sum: 1 },
                },
            },
        ])

        res.status(200).send(data)

    } catch (error) {
        res.status(400).json(error)

    }
}

const updatePassword = async (req, res) => {
    try {
        const match = await bcrypt.compare(req.body.oldpassword, req.user.password)
        if (!match) throw new Error(`كلمة المرور غير صحيحة`)
        req.user.password = req.body.newpassword
        await req.user.save()
        res.status(200).send()
    }
    catch (e) {
        res.status(400).json(e.message)
    }
}
const allowToRate = async (req, res) => {
    try {

        const ids = await Order.distinct("orderItems.product", {
            user: req.user._id
        })

        const products = []
        for (let i of ids) {
            let isRated = await Review.findOne({ userId: req.user._id, productId: i })
            if (!isRated) {
                let product = await Product.findById(i).select('images name ')
                products.push(product)
            }

        }

        res.status(200).json({ products })
    } catch (error) {
        res.status(400).json(error)
    }

}


module.exports = {
    singup,
    adminlogin,
    login,
    fetchUser,
    updateUser, deleteuser, fetchUsers,
    userstats,
    likedproduct,
    getlikedProducts,
    allowToRate,
    updatePassword
} 