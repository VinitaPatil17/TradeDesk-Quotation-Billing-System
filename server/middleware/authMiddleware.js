function isAuthenticated(req, res, next){

    if(req.session.user){
        next();
    } else {
        res.redirect("/login"); // or send JSON if API
    }

}

module.exports = isAuthenticated;