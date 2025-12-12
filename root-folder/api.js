const express = require("express")
const router = express.Router()
const User = require("./userModel")
const isAuth = require("./auth")
const isUnverifAuth = require("./unverifAuth")
//requete au serveur pour récupérer les informations utilisateur chez le client
router.get("/api/getCredentials", isAuth,async (req,res)=>{
    try {
        const user = await User.findById(req.session.user.userId).select("email username solyTag profilePicture friendRequest friendList")
        const targetIds = user.friendList.map(friend=>friend.targetUser)
        const friends = await User.find({_id:{$in:targetIds}}).select("username solyTag profilePicture -_id")
        res.json({
            email:user.email,
            username: user.username,
            solyTag: user.solyTag,
            profilePicture: user.profilePicture,
            friendRequest: user.friendRequest,
            friendList: friends
        })
    }catch (error) {
        console.error(error)
    }    
})
//requete de l'e-mail
router.get("/api/getEmail", isUnverifAuth,async (req,res)=>{
    try {
        const user = await User.findById(req.session.user.userId).select("email")
        res.json({email:user.email})
    }catch (error) {
        console.error(error)
    }    
})


router.post("/api/logout", isAuth,(req,res)=>{
    req.session.destroy(async (err)=>{
        if (err) {
            console.error("error destroying the session : " + err)
            return res.status(500).json({ok:false,message:"server error"})
        }
        res.clearCookie("connect.sid",{path:"/"})
        return res.json({ok:true,message:"disconnected successfully"})
    })
    
})
module.exports = router
