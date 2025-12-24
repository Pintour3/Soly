const mongoose = require("mongoose")

// Schéma et modèle utilisateur
const userSchema = new mongoose.Schema({
    email: { type: String,required:true,unique:true},
    username:{type:String, default:""},
    password: { type: String,required:true},
    online: { type: Boolean, default: false},
    verified: {type:Boolean,default:false},
    verificationToken: String,
    profilePicture:{type:String,default:""},
    solyTag:{type:String,default:null},
    friendRequest:{type:Array,default:[]},
    friendList:{type:Array,default:[]}
});


const User = mongoose.model("Soly", userSchema,"Users"); //modèle utilisateur

module.exports = User