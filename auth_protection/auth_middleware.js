module.exports = (req ,res, next) =>{
    try{
        if(req.session.loggedIn){
            next();
        }
        else{
            return res.redirect('/login');
        }
    }
    catch (error) {
        console.error(error);
        return res.redirect('/login'); 
    }
    // next();
};