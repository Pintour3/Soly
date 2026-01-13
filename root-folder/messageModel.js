const mongoose = require("mongoose")

const messageSchema = new mongoose.Schema(
    {
    message:{type:String},
    sender:{type:String,required:true},
    receiver:{type:String,required:true},
    date:{type:Date,default:Date.now},
    status:{type:String,default:"sent"}
    },
    {_id:true}
)

const conversationSchema = new mongoose.Schema({
    convId:{type:String,required:true,unique:true},
    messages:[messageSchema]

})

const Conversation = mongoose.model("Conversation",conversationSchema,"Conversations")

module.exports = Conversation