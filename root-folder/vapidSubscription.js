const mongoose = require("mongoose")

const pushSubscriptionSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    subscription:{
        endpoint:String,
        keys: {
            p256dh: String,
            auth: String
        }
    },
    createdAt: {
        type:Date,
        default:Date.now
    }
})
const vapidSubscription = mongoose.model("VapidSub",pushSubscriptionSchema,"VapidSub")
module.exports = vapidSubscription