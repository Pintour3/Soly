const vapidSubscription = require("./vapidSubscription")
const webpush = require("web-push")

webpush.setVapidDetails(
    "mailto:mail@arthur-maye.ch",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
)
//send notif
async function sendPushNotification(userId,data) {
    try {
        const sub = await vapidSubscription.findOne({userId})
        if (!sub) {
            console.log("pas d'abonnement pour ", userId)
            return
        }
        const payload = JSON.stringify({
            title:data.title,
            body:data.body,
            icon:data.icon,
            data:data.data
        })
        await webpush.sendNotification(sub.subscription,payload)
        console.log("notif envoyée à ", userId)

    } catch (error) {
        if (error.statusCode === 410) {
            await vapidSubscription.findOneAndDelete({userId}) //abo expiré
            console.log("abonnement vapid expiré pour ",userId)
        } else {
            console.error("erreur serveur")
        }
    }
}

module.exports = {sendPushNotification}