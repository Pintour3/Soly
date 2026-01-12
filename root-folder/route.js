const express = require("express")
const path = require("path")
const router = express.Router()
const isAuth = require("./auth")
const User = require("./userModel")
const upload = require("./multer")
const fs = require("fs")
const isUnverifAuth = require("./unverifAuth")
const {updateSession} = require("./updateSession")


//get session user and send him if he's unverif or doesn't have a session
function homeRedirect(req,res){
    const user = req.session.user
    if (!user){
        return res.sendFile(path.join(__dirname,"..","public","index.html"))
    }
    if (!user.verified) {
        return res.sendFile(path.join(__dirname,"..","public","index.html"))
    }
    if (!user.username) {
        return res.redirect("/editProfile")
    }
    return res.redirect("/accueil")
}

//landing

router.get(["/","/index.html"],homeRedirect);


//editProfile

router.get(["/editProfile","/editProfile.html"],isAuth,(req,res)=>{
    res.sendFile(path.join(__dirname,"..","public","editProfile.html"))
})
router.get(["/emailVerif","/emailVerif.html"],isUnverifAuth,(req,res)=>{
    res.sendFile(path.join(__dirname,"..","public","emailVerif.html"))
})

//if the user didn't have a username, redirect to edit profile

router.get(['/accueil','/accueil.html'], isAuth,async(req, res) => {
    try {
        const user = await User.findById(req.session.user.userId).select("username")
        if (user && user.username) {
            req.session.user.username = user.username
            res.sendFile(path.join(__dirname,"..", 'public', 'accueil.html'));
        } else {
            return res.redirect("/editProfile")
        }
    } catch (error) {
        console.error(error)
    }
});
//route to picture folder
router.use("/upload",express.static(path.join(__dirname,"../upload")))




//email verif
const nodemailer = require("nodemailer")
const crypto = require("crypto");
router.post("/emailVerif",isUnverifAuth, async (req,res)=>{
    try {
        //get user and recreate token if needed
        //we send a mail to the client
        //if the token MAIL is the same as the user one, then verified = true
        console.log("mail must be sent")
        const user = await User.findById(req.session.user.userId);
        if (!user) {return res.status(404).json({ message: "Utilisateur non trouvé" });}
        if (user.verified) {return res.status(400).json({message:"Compte déjà vérifié"})}
        if (!user.verificationToken ){
            user.verificationToken = crypto.randomBytes(32).toString("hex");
            await user.save();
        }
        const transporter = nodemailer.createTransport({
            host: "mail.infomaniak.com",
            port: 587,
            secure: false, 
            auth: {
                user: process.env.MAIL_USERNAME,
                pass: process.env.MAIL_PASSWORD,
            },
            tls: {
                rejectUnauthorized: false
            },
            debug: true, // Active les logs détaillés
            logger: true // Active le logger
        });
        console.log('Username:', process.env.MAIL_USERNAME);
        console.log('Password:', process.env.MAIL_PASSWORD);
        console.log('Password length:', process.env.MAIL_PASSWORD?.length);
        const verifURL = `https://soly.arthur-maye.ch/checkToken?token=${user.verificationToken}` 
        const mailOptions = {
            from:process.env.MAIL_USERNAME,
            to:user.email,
            subject:"Verification de votre adresse e-mail",
            html:`<p>merci de vous inscrire ! cliquez sur le lien ci dessous pour confirmer que cette adresse vous appartient :</p>
            <a href="${verifURL}">Verifiez maintenant !</a>`
        }
        await transporter.sendMail(mailOptions)
        res.json({message:"mail envoyé"})
    } catch(err) {
        console.error(err)
    }
})

//when we clic on the mail link
router.get("/checkToken",async (req,res)=> {
    console.log("token CHECK")
    const {token} = req.query
    if (!token) {res.status(400).send("TOKEN INTROUVABLE")}
    try {
        const user = await User.findOne({verificationToken:token})
        if (!user ) {res.send(400).send("TOKEN INVALIDE")}
        user.verified = true
        user.verificationToken = undefined
        await user.save()
        if (req.session && req.session.user && req.session.user.userId.toString() === user._id.toString()) {
            req.session.user.verified = true
            return req.session.save((err)=>{
                if (err) {
                    console.error('Erreur save session:', err)
                    return res.status(500).send('erreur du serveur ... ')
                }
                return res.redirect("/editProfile")
            })
        } else {
            await updateSession(user._id,{"session.user.verified":true})
            return res.redirect("/editProfile")
        }
    }catch(err) {
        console.error(err)
        res.status(500).send("erreur du serveur ... ")
    }
})

//partie personnalisation utilisateur
router.post("/editProfile",isAuth,upload.single("profilePicture"),async (req,res)=>{
    try {
        const userId = req.session.user.userId
        //if username is not valid
        if (!req.body.username || req.body.username.length < 3 || req.body.username.length > 15) {
            return res.status(403).json({message:"nom d'utilisateur invalide"})
        }
        const user = await User.findById(userId)
        let solyTag;
        if (!user.solyTag) { // si l'user n'a pas de solytag
            let isUnique = false;
            while(!isUnique) { //on en fabrique un
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
            solyTag:solyTag,
        }
        //if file is imported
        const previousPicture = user.profilePicture
        if (req.file) {
            // user
            // previous picture
            //if there is one before this 
            if (previousPicture) {
                if (previousPicture !== "/upload/default.webp") { //not delete default picture
                    const oldPath = path.join(__dirname,"..",previousPicture)
                    fs.unlink(oldPath,(err)=>{
                        if (err) {
                            console.error("erreur lors de la suppression ", err)
                        } else {
                            console.log("ancienne image supprimée")
                        }
                    })
                }
            }
            //new picture
            const imageUrl = `/upload/${req.file.filename}`;
            updateData.profilePicture = imageUrl

        } else {
            
            //établir une photo par default si rien avant 
            if (!previousPicture) {
                const imageUrl = "/upload/default.webp";
                updateData.profilePicture = imageUrl
            }
        }
        //update User
        const updateUser = await User.findByIdAndUpdate(req.session.user.userId,updateData,{new:true});

        //update Session
        req.session.user = {
            userId:updateUser._id,
            username:updateUser.username,
            verified:updateUser.verified
        }
        // s'assurer que la session est persistée
        return req.session.save((err)=>{
            if (err) {
                console.error('Erreur save session:', err)
                return res.status(500).send()
            }
            return res.status(201).send()
        })
    } catch (error) {
        console.error(error)
    }
})

module.exports = router