const express = require("express")
const path = require("path")
const router = express.Router()
const isAuth = require("./auth")
const User = require("./userModel")
//editProfile
router.get("/editProfile",isAuth,(req,res)=>{
    res.sendFile(path.join(__dirname,"..","public","editProfile.html"))
})

//if the user didn't have a username, redirect to edit profile
router.get('/accueil', isAuth,async(req, res) => {
    try {
        const user = await User.findById(req.session.user.userId).select("username")
        if (user.username) {
            req.session.user.username = user.username
            res.sendFile(path.join(__dirname,"..", 'public', 'accueil.html'));
        } else {
            return res.redirect("editProfile")
        }
    } catch (error) {
        console.error(error)
    }
});


module.exports = router