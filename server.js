const express = require("express");
const http = require("http");
const path = require("path");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const multer = require("multer")
const session = require("express-session")
const mongoDbStore = require("connect-mongodb-session")(session)
const app = express();
const server = http.createServer(app);
const socketIo = require("socket.io");
const { urlencoded } = require("body-parser");
const io = socketIo(server);
app.use(express.static(path.join(__dirname, 'public')));
app.use(urlencoded({extended: true}))
app.use(express.json())

//Database
const url = "mongodb://127.0.0.1:27017/Soly";
mongoose.connect(url)
const store = new mongoDbStore({
    uri:url,
    collection:"Sessions"
})

//cookie and sessions
app.use(session({
    secret:"temporary",
    resave:false,
    cookie:{
        maxAge:60*1000*10,
        sameSite:"lax"
    },
    saveUninitialized:false,
    store: store
}));
//check if user is still valable
function isAuth(req,res,next){
    if(req.session && req.session.user&& req.session.user.userId) {
        next()
    } else {
        res.redirect("/")
    }
}
//open edit profile
app.get("/editProfile",isAuth,(req,res)=>{
    res.sendFile(path.join(__dirname,"public","editProfile.html"))
})
//if the user didn't have a username, redirect to edit profile
app.get('/accueil', isAuth,async(req, res) => {
    try {
        const user = await User.findById(req.session.user.userId).select("username")
        if (user.username) {
            req.session.user.username = user.username
            res.sendFile(path.join(__dirname, 'public', 'accueil.html'));
        } else {
            return res.redirect("editProfile")
        }
    } catch (error) {
        console.error(error)
    }
});
//redirect to a register portal to check e-mail
//to do svp


// Schéma et modèle utilisateur
const userSchema = new mongoose.Schema({
    email: { type: String,required:true,unique:true},
    username:{type:String, default:""},
    password: { type: String,required:true},
    online: { type: Boolean, default: false },
    profilePicture:{data:Buffer,contentType:String}
});
//creating an user to push to database 
const User = mongoose.model("Soly", userSchema,"Users");

//partie formulaire
//partie inscription
app.post("/register",async (req,res)=>{
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

//partie connection
app.post("/login",async (req,res)=>{
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

//profile picture storage
const storage = multer.memoryStorage();
const upload = multer({storage:storage})

//partie personnalisation utilisateur
app.post("/editProfile",isAuth,upload.single("profilePicture"),async (req,res)=>{
    try {
        const updateData = {
            username:req.body.username
        }
        if (req.file){
            updateData.profilePicture = {
                data: req.file.buffer,
                contentType: req.file.mimetype
            }
        }
        console.log(req.session.userId)

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

//requete au serveur pour récupérer les informations utilisateur chez le client
app.get("/api/getCredentials", isAuth,async (req,res)=>{
    try {
        const user = await User.findById(req.session.user.userId).select("profilePicture username email")
        res.json({
            email: user.email,
            username: user.username,
            profilePicture: user.profilePicture
        })
    }catch (error) {
        console.error(error)
    }


    
})






io.on("connection",(socket)=>{
    console.log("someone just joined with token : " + socket.id)
});





server.listen(3001, () => {
    console.log("server started");
});