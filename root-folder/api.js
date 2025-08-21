const express = require("express")
const router = express.Router()
const User = require("./userModel")
const isAuth = require("./auth")

//requete au serveur pour récupérer les informations utilisateur chez le client
router.get("/api/getCredentials", isAuth,async (req,res)=>{
    try {
        const user = await User.findById(req.session.user.userId).select("username email profilePicture solyTag")
        res.json({
            email: user.email,
            username: user.username,
            solyTag: user.solyTag,
            profilePicture: user.profilePicture
            
        })
    }catch (error) {
        console.error(error)
    }    
})

module.exports = router
