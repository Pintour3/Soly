const User = require("./userModel")
const Conversation = require("./messageModel");
const { connect } = require("mongoose");

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
        socket.on("addFriend",async(targetSolyTag)=>{
            const solyTag = targetSolyTag //{solyTag:"soly#1234"}
            const user = await User.findById(userId).populate("friendList") //populate convert friendlist elt (object id) in real profile
            const targetUser = await User.findOne(solyTag)
            
            let userFriendRequest = user.friendRequest
            let userFriendList = user.friendList

            if (targetUser) {
                let targetUserFriendRequest = targetUser.friendRequest
                if (!userFriendRequest.some(item => item.solyTag === solyTag.solyTag)) {
                    if (solyTag.solyTag == user.solyTag) {
                        socket.emit("addFriendResponse","Vous ne pouvez pas vous inviter vous-même")
                    } else if (userFriendList.some(item=>item.solyTag === solyTag.solyTag)){
                        socket.emit("addFriendResponse",`vous êtes dejà ami avec ${targetUser.username}`)
                    } else {
                        const date = new Date()
                        //the sender
                        userFriendRequest.push({username:targetUser.username,solyTag:targetUser.solyTag,requestDate:date,type:"sended"}) //type is if it's sended to sm or received by sm
                        //the target user who received the friend request
                        targetUserFriendRequest.push({username:user.username,solyTag:user.solyTag,requestDate:date,type:"received"})
                        const updateUserData = {friendRequest: userFriendRequest}
                        const updateTargetUserData = {friendRequest:targetUserFriendRequest}
                        await User.findByIdAndUpdate(userId,updateUserData,{new:true});
                        await User.findOneAndUpdate(solyTag,updateTargetUserData,{new:true});
                        socket.emit("addFriendResponse",`Invitation envoyée à ${targetUser.username} ! 👍`)
                        //sending update to the targetUser
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
            if (request.accepted) {
                const convId = [user._id.toString(),targetUser._id.toString()].sort().join("_")
                await User.findByIdAndUpdate(userId, //for user
                    {
                        $addToSet:{friendList:{targetUser:targetUser._id,convId:convId}},//directly pushes the data to the array
                        $pull:{friendRequest:{solyTag:targetSolyTag}} //directly pull the data from the array
                    }, 
                    {new:true})
                await User.findOneAndUpdate({solyTag:targetSolyTag}, //for target User
                    {
                        $addToSet:{friendList:{targetUser:user._id,convId:convId}},
                        $pull:{friendRequest:{solyTag:user.solyTag}}
                    }
                )
                const conv = new Conversation({convId:convId})
                conv.save()
                socket.emit("friendRequestResponse",`vous êtes désormais ami avec ${targetUser.username}`)
            } else {
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
                socket.emit("friendRequestResponse",`Demande d'ami de ${targetUser.username} refusée`)
            }
        })
        socket.on("message",async (message)=>{
            socket.emit("messageResponse",message)
            const receiver = await User.findOne({solyTag:message.to.solyTag}).select("_id")
            const conversationId = [userId.toString(),receiver._id.toString()].sort().join("_")
            const conversation = await Conversation.findOneAndUpdate({convId:conversationId},
                {
                    $push:{messages:message}
                }
            )
            if (connectedUsers[receiver._id]) {
                const targetUserId = connectedUsers[receiver._id]
                io.to(targetUserId).emit("messageResponse",message)
            }
            
        })
        //conversation load
        socket.on("askConversation", async (friend)=>{
            const friendId = await User.findOne({solyTag:friend}).select("_id").lean()
            const convId = [userId.toString(),friendId._id.toString()].sort().join("_")
            const conv = await Conversation.findOne({convId:convId}).select("messages")
            socket.emit("askConversationResponse",{friend,conv})
        })
            
        

        socket.on("disconnect",()=>{
            delete connectedUsers[userId]
            console.log("user disconnected : " + userId)
        })
    });
}

module.exports = socketHandler