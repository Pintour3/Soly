function isAuth(req,res,next){
    if(req.session && req.session.user&& req.session.user.userId) { //if session is active
        if (req.session.user.verified) { //if user is verified
            next()
        } else {
            res.redirect("/emailVerif")
        }
    } else {
        res.redirect("/")
    }
}

module.exports = isAuth
