const User = require("./userModel")
const Conversation = require("./messageModel");
const {sendPushNotification} = require("./sendNotif")
//mapping des utilisateur connectés
const connectedUsers = {}

function socketHandler(io) {
    io.on("connection",async (socket)=>{
        const session = socket.request.session
        if (!session || !session.user) {
            return;
        }
        const userId = session.user.userId
        connectedUsers[userId] = socket.id //link the socket id with the userId
        console.log("someone just joined with token : " + socket.id)
        //when client add friends
        socket.on("addFriend",async(targetSolyTag)=>{
            const solyTag = targetSolyTag //{solyTag:"soly#1234"}
            const user = await User.findById(userId)
            .populate("friendList") //populate convert friendlist elt (object id) in real profile
            .select("username solyTag _id friendRequest friendList profilePicture")
            const targetUser = await User.findOne(solyTag)
            .select("username solyTag _id friendRequest friendList profilePicture")
            let userFriendRequest = user.friendRequest
            let userFriendList = user.friendList
            //if user is found
            if (targetUser) {
                let targetUserFriendRequest = targetUser.friendRequest
                //if this request isn't the same as another one
                if (!userFriendRequest.some(item => item.solyTag === solyTag.solyTag)) {
                    //if the request is yourself
                    if (solyTag.solyTag == user.solyTag) {
                        socket.emit("addFriendResponse","Vous ne pouvez pas vous inviter vous-même")
                    //if you're already friend with the request
                    } else if (userFriendList.some(item=>item.solyTag === solyTag.solyTag)){
                        socket.emit("addFriendResponse",`vous êtes dejà ami avec ${targetUser.username}`)
                    } else {
                        const date = new Date()
                        //the sender
                        userFriendRequest.push({username:targetUser.username,solyTag:targetUser.solyTag,profilePicture:targetUser.profilePicture,requestDate:date,type:"sended"}) //type is if it's sended to sm or received by sm
                        //the target user who received the friend request
                        targetUserFriendRequest.push({username:user.username,solyTag:user.solyTag,profilePicture:user.profilePicture,requestDate:date,type:"received"})
                        const updateUserData = {friendRequest: userFriendRequest}
                        const updateTargetUserData = {friendRequest:targetUserFriendRequest}
                        await User.findByIdAndUpdate(userId,updateUserData,{new:true});
                        await User.findOneAndUpdate(solyTag,updateTargetUserData,{new:true});
                        socket.emit("addFriendResponse",`Invitation envoyée à ${targetUser.username} ! 👍`)
                        //sending update to the targetUser if is connected
                        if (connectedUsers[targetUser._id]) {
                            const targetUserId = connectedUsers[targetUser._id]
                            const friend = {username:user.username,solyTag:user.solyTag,profilePicture:user.profilePicture}
                            io.to(targetUserId).emit("friendRequest",friend)
                        }
                    }
                } else {
                    socket.emit("addFriendResponse",`Vous avez déjà demandé ${targetUser.username} en ami !`)
                }
            } else {
                socket.emit("addFriendResponse","Utilisateur introuvable 😢")
            }
        })
        //partie acceptation demande d'ami
        socket.on("friendRequest",async (req)=>{
            const request = req
            const targetSolyTag = request.solyTag
            const user = await User.findById(userId)
            const targetUser = await User.findOne({solyTag:targetSolyTag})
            if (request.accepted) { // if friend accept the request
                await User.findByIdAndUpdate(userId, //for user
                    {
                        $addToSet:{friendList:{targetUser:targetUser._id,solyTag:targetSolyTag}},//directly pushes the data to the array
                        $pull:{friendRequest:{solyTag:targetSolyTag}} //directly pull the data from the array
                    }, 
                    {new:true})
                await User.findOneAndUpdate({solyTag:targetSolyTag}, //for target User
                    {
                        $addToSet:{friendList:{targetUser:user._id,solyTag:user.solyTag}},
                        $pull:{friendRequest:{solyTag:user.solyTag}}
                    }
                )
                const convId = [user._id.toString(),targetUser._id.toString()].sort().join("_")
                const conv = new Conversation({convId:convId})
                conv.save()
                socket.emit("friendRequestResponse",`vous êtes désormais ami avec ${targetUser.username}`,true,targetUser)
                if (connectedUsers[targetUser._id]) {
                    io.to(connectedUsers[targetUser._id]).emit("friendRequestResponse",`${user.username} a accepté votre demande d'ami`,true,user)
                } else {
                    console.log("unable to find user who's connected")
                }
            } else { //if he denies
                await User.findByIdAndUpdate(userId, //for user
                    {
                        $pull:{friendRequest:{solyTag:targetSolyTag}} //directly pull the data from the array
                    }, 
                    {new:true})
                await User.findOneAndUpdate({solyTag:targetSolyTag},
                    {
                        $pull:{friendRequest:{solyTag:user.solyTag}}
                    }
                )
                socket.emit("friendRequestResponse",`Demande d'ami de ${targetUser.username} refusée`,false,null) //to the client
                if (connectedUsers[targetUser._id]) {
                    io.to(connectedUsers[targetUser._id]).emit("friendRequestResponse",`${user.username} a refusé votre demande d'ami`,false,null)
                } else {
                    console.log("unable to find user who's connected, user : " + targetUser._id)
                }
            }
        })
        socket.on("message",async (message)=>{
            socket.emit("messageResponse",message)
            const friendSolyTag = message.receiver
            const receiver = await User.findOne({solyTag:friendSolyTag}).select("_id")
            const conversationId = [userId.toString(),receiver._id.toString()].sort().join("_")            
            const conversation = await Conversation.updateOne(
                {convId:conversationId},{$push:{messages:message}}
            )
            if (connectedUsers[receiver._id]) { //if online
                const targetUserId = connectedUsers[receiver._id]
                io.to(targetUserId).emit("messageResponse",message)
            } else { //if offline
                const sender = await User.findOne({solyTag:message.sender}).select("username")
                await sendPushNotification(receiver._id.toString(),{
                    title:`Message de ${sender.username}`,
                    body:message.message,
                    icon:"/public/assets/png/soly_light_ISO_border.png",
                    data:{conversationId}
                })
            }
        })
        //conversation load
        socket.on("askConversation", async (friendSolyTag)=>{
            const friendId = await User.findOne({solyTag:friendSolyTag}).select("_id").lean()
            const convId = [userId.toString(),friendId._id.toString()].sort().join("_")
            let conv = await Conversation.findOne({convId:convId}).select("messages")
            if (!conv) {
                conv = new Conversation({convId:convId})
                conv.save()
            }
            socket.emit("askConversationResponse",{friendSolyTag,conv})
        })
        
        socket.on("disconnect",()=>{
            delete connectedUsers[userId]
            console.log("user disconnected : " + userId)
        })
    });
}

module.exports = socketHandler