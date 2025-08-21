const express = require("express");
const http = require("http");
const path = require("path");
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
const login = require("./root-folder/login")
const api = require("./root-folder/api")
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
app.use(login)
app.use(api)
//redirect to a register portal to check e-mail
//to do svp

//socket.io for message handling
io.on("connection",(socket)=>{
    console.log("someone just joined with token : " + socket.id)
});

server.listen(3001, () => {
    console.log("server started");
});