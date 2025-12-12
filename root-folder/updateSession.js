const mongoose = require("mongoose")

async function updateSession(userId,updates){
    const sessionCollection = mongoose.connection.collection("Sessions")
    await sessionCollection.updateOne(
        {"session.user.userId":userId},
        {$set:updates}
    )
}
module.exports = {updateSession}