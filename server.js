const express = require("express");
const http = require("http");
const path = require("path");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const fs = require("fs")
const app = express();
const session = require("express-session")
const server = http.createServer(app);
const socketIo = require("socket.io");
const { urlencoded } = require("body-parser");
const io = socketIo(server);
app.use(express.static(path.join(__dirname, 'public')));
app.use(urlencoded({extended: true}))
app.use(express.json())

//files imports
const route = require("./root-folder/route")
const User = require("./root-folder/userModel")
const {store} = require("./root-folder/database")

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

//WARN : initialise session and cookie before route, 
//if not, isAuth middleware will return false even if session is enabled after

//routes importation
app.use(route)



//data storage
const storage = multer.diskStorage({
    destination:function (req,file,cb) {
        cb(null, "upload/") //dossier de stockage
    },
    filename: function(req,file,cb) {
        cb(null,Date.now() + path.extname(file.originalname))
    }
})


//check if user is still valable
function isAuth(req,res,next){
    if(req.session && req.session.user&& req.session.user.userId) {
        next()
    } else {
        res.redirect("/")
    }
}


//redirect to a register portal to check e-mail
//to do svp


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

//picture storage
const upload = multer({storage:storage})

//allowing access to the upload folder
app.use("/upload",express.static("upload"))

//partie personnalisation utilisateur
app.post("/editProfile",isAuth,upload.single("profilePicture"),async (req,res)=>{
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

//requete au serveur pour récupérer les informations utilisateur chez le client
app.get("/api/getCredentials", isAuth,async (req,res)=>{
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



//socket.io for message handling
io.on("connection",(socket)=>{
    console.log("someone just joined with token : " + socket.id)
});

server.listen(3001, () => {
    console.log("server started");
});