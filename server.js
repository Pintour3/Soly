const express = require("express");
const http = require("http");
const path = require("path");
const app = express();
const session = require("express-session");
const server = http.createServer(app);
const { urlencoded } = require("body-parser");

require('dotenv').config();

// Body parsers
app.use(urlencoded({extended: true}));
app.use(express.json());

// Files imports
const route = require("./root-folder/route");
const login = require("./root-folder/login");
const api = require("./root-folder/api");
const {store} = require("./root-folder/database");
const socketHandler = require("./root-folder/socket");

// Cookie and sessions
const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || "temporary",
    resave: false,
    cookie: {
        maxAge: 60*1000*60,
        sameSite: "lax",
        secure: process.env.NODE_ENV === 'production'
    },
    saveUninitialized: false,
    store: store
});

app.use(sessionMiddleware);

// IMPORTANT : Middleware de suppression des slashes AVANT tout le reste
// mais APRÈS la session
app.use((req, res, next) => {
    // Exclure les fichiers statiques (avec extension)
    if (req.path.match(/\.[^\/]+$/)) {
        return next();
    }
    
    // Supprimer le slash final si présent
    if (req.path.length > 1 && req.path.endsWith('/')) {
        const query = req.url.slice(req.path.length);
        const newPath = req.path.slice(0, -1) + query;
        return res.redirect(301, newPath); // 301 permanent pour SEO
    }
    
    next();
});

// Static files
app.use(express.static(path.join(__dirname, 'public'), {
    index: false,
    redirect: false
}));

// Routes - dans l'ordre
app.use(api);
app.use(login);
app.use(route);

// Socket.io
const socketIo = require("socket.io");
const io = socketIo(server, {
    cors: {
        origin: "https://soly.arthur-maye.ch",
        methods: ["GET", "POST"],
        credentials: true
    }
});

io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});

socketHandler(io);

// 404 handler
app.use((req, res) => {
    res.status(404).send('Page non trouvée');
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});