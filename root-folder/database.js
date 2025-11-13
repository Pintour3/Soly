const mongoose = require("mongoose")
const session = require("express-session")
const mongoDbStore = require("connect-mongodb-session")(session)

//Database
const url = `mongodb://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_URL}`;
mongoose.connect(url)
const store = new mongoDbStore({
    uri:url,
    collection:"Sessions"
})

module.exports = {store}