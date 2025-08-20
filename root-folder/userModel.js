const mongoose = require("mongoose")

// Schéma et modèle utilisateur
const userSchema = new mongoose.Schema({
    email: { type: String,required:true,unique:true},
    username:{type:String, default:""},
    password: { type: String,required:true},
    online: { type: Boolean, default: false },
    profilePicture:{type:String,default:""},
    solyTag:{type:String,unique:true}
});

//creating an user to push to database 
module.exports = mongoose.model("Soly", userSchema,"Users");