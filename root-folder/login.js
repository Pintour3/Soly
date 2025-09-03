const express = require("express")
const router = express.Router()
const User = require("./userModel")
const bcrypt = require("bcryptjs")
const path = require("path")

//LOGIN
router.post("/login",async (req,res)=>{
    console.log("fetch login")
    const {email,password} = req.body
    try {
        const userCheck = await User.findOne({email:email})
        console.log(req.sessionID)
        if (userCheck) {
            const comparePassword = await bcrypt.compare(password,userCheck.password)
            console.log(comparePassword)
            if (comparePassword) {
                req.session.authentificated = true;
                req.session.user = {
                    email: userCheck.email,
                    username:"", 
                    userId:userCheck._id
                }
                console.log("redirection")
                return res.status(200).json({message:"connexion réussie"})
            } else {
                return res.status(409).json({message: "nom d'utilisateur ou mot de passe incorrect"})
            }
        } else {
            return res.status(409).json({ message: "Utilisateur introuvable" }); // 409 Conflict
        }
    } catch (error) {
        console.error("erreur durant la création de l'utilisateur" + error)
        return res.status(500).send();
    }
});

//REGISTER
router.post("/register",async (req,res)=>{
    //check si user existe deja
    const email = req.body.email.trim()
    const password = req.body.password.trim()
    try {
        const emailCheck = await User.findOne({email:email})
        if (!emailCheck) {
            const cryptedPassword = await bcrypt.hash(password,10)
            const newUser = new User({email,password:cryptedPassword})
            await newUser.save()
            req.session.user = {
                email: newUser.email,  
                userId: newUser._id
            }
            
            return res.status(201).json({message:"connexion réussie"})
            
        } else {
            console.log("compte existe deja")
            return res.status(409).json({ message: "Adresse déja utilisée."}); // 409 Conflict
            
        }
    } catch (error) {
        console.error("erreur durant la création de l'utilisateur" + error)
        return res.status(500).send();
    }
    
})
module.exports = router