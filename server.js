const express = require("express");
const http = require("http");
const path = require("path");
const app = express();
const session = require("express-session")
const server = http.createServer(app);
const { urlencoded } = require("body-parser");
app.use(express.static(path.join(__dirname, 'public'), {index: false}));
app.use(urlencoded({extended: true}))
app.use(express.json())
require('dotenv').config()



//files imports
const route = require("./root-folder/route")
const login = require("./root-folder/login")
const api = require("./root-folder/api")
const {store} = require("./root-folder/database")
const socketHandler = require("./root-folder/socket")
//cookie and sessions

const sessionMiddleware = session({
    secret:"temporary",
    resave:false,
    cookie:{
        maxAge:60*1000*10,
        sameSite:"lax"
    },
    saveUninitialized:false,
    store: store
    })
app.use(sessionMiddleware);

//WARN : initialise session and cookie before route, 
//if not, isAuth middleware will return false even if session is enabled after

//routes importation
app.use(route)
app.use(login)
app.use(api)
//redirect to a register portal to check e-mail
//to do pls

//socket.io for message handling
const socketIo = require("socket.io");
const io = socketIo(server,{
    cors:{
        origin:"https://soly.arthur-maye.ch",
        methods:["GET","POST"],
        credentials: true
    }
});

io.use((socket,next)=>{
    sessionMiddleware(socket.request,{},next)
})
socketHandler(io)

server.listen(3001, () => {
    console.log("server started");
});