function isAuthenticated(req, res, next){

    if(req.session.user){
        next();
    } else {
        res.redirect("/login.html"); // or send JSON if API
    }

}

module.exports = isAuthenticated;