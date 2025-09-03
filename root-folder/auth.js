function isAuth(req,res,next){
    if(req.session && req.session.user&& req.session.user.userId) {
        next()
    } else {
        res.redirect("/")
    }
}

module.exports = isAuth



