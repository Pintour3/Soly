const mongoose = require("mongoose")

const conversationSchema = new mongoose.Schema({
    convId:{type:String,required:true,unique:true},
    messages:{type:Array,default:[]}

})

const Conversation = mongoose.model("Conversation",conversationSchema,"Conversations")

module.exports = Conversation