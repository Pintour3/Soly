const express = require("express")
const path = require("path")
const router = express.Router()
const isAuth = require("./auth")
const User = require("./userModel")
const upload = require("./multer")
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

router.post("/addFriend",isAuth,async (req,res)=>{

    const solyTag = req.body //{solyTag:"soly#1234"}
    const userId = req.session.user.userId
    const user = await User.findById(userId)
    let userFriendRequest = user.friendRequest
    const targetUser = await User.findOne(solyTag)

    if (targetUser) {
        if (!userFriendRequest.some(item => item.solyTag === solyTag.solyTag)) {
            const date = new Date()
            userFriendRequest.push({username:targetUser.username,solyTag:targetUser.solyTag,requestDate:date})
            const updateData = {friendRequest: userFriendRequest}
            await User.findByIdAndUpdate(req.session.user.userId,updateData,{new:true});
            res.send({message:`Invitation envoyée à ${targetUser.username} ! 👍`})
        } else {
            res.send({message:`Vous avez déjà demandé ${targetUser.username} en ami !`})
        }
    } else {
        res.send({message:"Utilisateur introuvable 😢"})
    }
})


//route to picture folder
router.use("/upload",express.static("upload"))

//partie personnalisation utilisateur
router.post("/editProfile",isAuth,upload.single("profilePicture"),async (req,res)=>{
    try {
        const userId = req.session.user.userId
        const user = await User.findById(userId)
        let solyTag;
        if (!user.solyTag) {
            let isUnique = false;
            while(!isUnique) {
                solyTag = req.body.username + `#${Math.floor(Math.random()*9000) + 1000}`
                const existingUser = await User.findOne({solyTag})
                if (!existingUser || existingUser._id.toString() === userId.toString()) {
                    isUnique = true
                }
            }
        } else {
            solyTag = user.solyTag
        }
        const updateData = {
            username:req.body.username,
            solyTag:solyTag
        }
        //if file is imported
        if (req.file) {
            // user
            const user = await User.findById(userId)
            // previous picture
            const previousPicture = user.profilePicture
            //if there is one 
            if (previousPicture) {
                const oldPath = path.join(__dirname,previousPicture)
                fs.unlink(oldPath,(err)=>{
                    if (err) {
                        console.error("erreur lors de la suppression ", err)
                    } else {
                        console.log("ancienne image supprimée")
                    }
                })
            }
            //new picture
            const imageUrl = `/upload/${req.file.filename}`;
            updateData.profilePicture = imageUrl

        }
        //update User
        const updateUser = await User.findByIdAndUpdate(req.session.user.userId,updateData,{new:true});

        //update Session
        req.session.user = {
            userId:updateUser._id,
            username:updateUser.username
        }
        return res.status(201).send()
    } catch (error) {
        console.error(error)
    }
})

module.exports = router