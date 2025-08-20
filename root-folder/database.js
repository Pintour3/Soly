const mongoose = require("mongoose")
const session = require("express-session")
const mongoDbStore = require("connect-mongodb-session")(session)



//Database
const url = "mongodb://127.0.0.1:27017/Soly";
mongoose.connect(url)
const store = new mongoDbStore({
    uri:url,
    collection:"Sessions"
})

module.exports = {store}