const express = require("express");
const http = require("http");
const path = require("path");
const app = express();
const session = require("express-session")
const server = http.createServer(app);
const { urlencoded } = require("body-parser");
app.use(urlencoded({extended: true}))
app.use(express.json())
require('dotenv').config()


//files imports
const route = require("./root-folder/route")
const login = require("./root-folder/login")
const api = require("./root-folder/api")
const {store} = require("./root-folder/database")
const socketHandler = require("./root-folder/socket")

app.use(express.static(path.join(__dirname, 'public'), {index: false,redirect:false}));



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

//slash middleware
app.use((req, res, next) => {
  if (
    req.path.length > 1 &&
    req.path.endsWith('/') &&
    !req.path.match(/\.[^\/]+\/$/) // ignore si c’est un fichier avec extension suivi d’un slash
  ) {
    const newPath = req.path.slice(0, -1);
    return res.redirect(301, newPath);
  }
  next();
});

//WARN : initialise session and cookie before route, 
//if not, isAuth middleware will return false even if session is enabled after

//routes importation
app.use(route)
app.use(login)
app.use(api)


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