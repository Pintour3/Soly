function isUnverifAuth(req,res,next){
    if(req.session && req.session.user&& req.session.user.userId) { //if session is active
        if (!req.session.user.verified) {
            next()
        } else res.redirect("/accueil")
    } else {
        res.redirect("/")
    }
}

module.exports = isUnverifAuth
