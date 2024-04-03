const User = require('../models/user');

const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');  //using this email service to notify the newly logged in user in their mail
const crypto = require('crypto'); 
const bcrypt = require('bcryptjs');


const transporter = nodemailer.createTransport(sendgridTransport({
    auth :{
      api_key : process.env.NODEMAILER_API_KEY 
    }
  }));
  


 
exports.getSignUp = (req,res,next) =>{

    let errMsg = req.flash('err');
    if(errMsg.length >0){
        errMsg = errMsg[0]; 
    }
    else{
        errMsg = null;
    }



    res.render('auth/signup',{
        pgTitle: 'Sign-In ',
        path: '/signup',
        errorMsg : errMsg,
    })
};

exports.postSignUp = (req,res,next)=>{
    const name = req.body.name ;
    const email = req.body.email ;
    const password = req.body.password ;

    User.findOne({email : email})
        .then(Userdoc =>{
            if(Userdoc){  //already a user
                req.flash('err', 'User with this email already exists.');
                return res.redirect('/signup');
            }

            //new User
            return bcrypt.hash(password , 12) //12 default
                .then(hashedpassword =>{
                    //adding new user to db
                    const user = new User({  id : null , name : name , email : email , password : hashedpassword , my_recipes : [] , my_favourites : [] , resetToken : null , resetTokenExpiry : null});
                    return user.save();
                    }).then(result =>{
                        res.redirect('/login');
                        return transporter.sendMail({
                            to : email ,
                            from : 'mohammedaymanquadri@gmail.com',
                            subject : "Sign In Succeeded !",
                            html : '<h1>You Successfully signed In </h1>'
                        })
                        })
                        .catch(err=>{
                        console.log(err); 
                        })
        })
        .catch(err=>{
            console.log(err); 
        })
}




exports.getLogin = (req,res,next) =>{

    let errMsg = req.flash('err');
    let pswderrMsg = req.flash('pswderr');
    if(errMsg.length >0){
        errMsg = errMsg[0]; 
    }
    else{
        errMsg = null;
    }
    if(pswderrMsg.length >0){
        pswderrMsg = pswderrMsg[0]; 
    }
    else{
        pswderrMsg = null;
    }



    res.render('auth/login',{
        pgTitle: 'Login ',
        path: '/login',
        errorMsg : errMsg ,
        pswderrMsg : pswderrMsg,
    })
};


exports.postLogin = (req,res,next) =>{
    const email = req.body.email ;
    const password = req.body.password ;

    User.findOne({email : email})
        .then(Userdoc =>{
            if(!Userdoc){ // no user
                req.flash('err','Invalid email or password ...');  
                return res.redirect('/login');
              }

            if(Userdoc){ //existing user
                bcrypt.compare(password , Userdoc.password)
                    .then(doMatch =>{

                        if(doMatch){ // matching
                            req.session.loggedIn = true;
                            req.session.user = new User({_id : Userdoc._id ,name : Userdoc.name , email :Userdoc.email ,password : Userdoc.password ,my_recipes: Userdoc.my_recipes ,my_favourites: Userdoc.my_favourites ,resetToken : Userdoc.resetToken ,resetTokenExpiry: Userdoc.resetTokenExpiry}) ;
                            return req.session.save(err =>{console.log(err) ; res.redirect('/')})
                            //res.redirect('/');
                        }
                  
                            //don't match 
                            req.flash('pswderr','Invalid password.');
                            return res.redirect('/login');
                    })
                
            } 
            
        })
        .catch(err=>{
            console.log(err);
            res.redirect('/login');
        })
};



exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
      if (err) {
          console.error("Error destroying session:", err);
          return next(err);
      }
      res.redirect('/');
  });
};
 



exports.getresetPasswordPage = (req,res,next) =>{
    let errMsg = req.flash('err');
    if(errMsg.length >0){
        errMsg = errMsg[0]; 
    }
    else{
        errMsg = null;
    }

    res.render('auth/reset',{
        pgTitle: 'Reset ',
        path: '/reset',
        errorMsg : errMsg ,
    })
};


exports.postresetPasswordPage = (req,res,next) =>{
     
    crypto.randomBytes(32 , (err , buffer) =>{   //32 bytes of a token
        if(err){
          console.log(err);
          return res.redirect('/reset');
        }
    
        const token = buffer.toString('hex');    // assigning them back to ascii from hex
        User.findOne({email : req.body.email})
          .then(user =>{
            if(!user){
              req.flash('err','User for the provided email does not exist !');
              return res.redirect('/reset');
            } 
    
            //user is found with that email
            user.resetToken = token;
            user.resetTokenExpiry = Date.now() + 3600000 ;    // 3600000ms is 1 hr
            //console.log(token);
            return user.save()
            .then(result =>{
                res.redirect('/login');

                transporter.sendMail({
                    to : req.body.email ,
                    from : 'mohammedaymanquadri@gmail.com',
                    subject : "Password Reset !",
                    html : `
                        <p> You requested a password Reset ? </p>
                        <p> If yes click the following link.... <a href='http://localhost:3000/reset/${token}'>Link</a>  </p>`   //change the link at deployment
                    });
                })
                .then(result => {
                  console.log('Reset password email sent!')
                })
              })
              .catch(err => {
                console.log("err is.." ,err);
              })
          
    });
};







exports.getNewPasswordPage = (req,res,next) =>{
    const token = req.params.token ;
    User.findOne({resetToken :  token  , resetTokenExpiry : {$gt : Date.now()}})
      .then(user=>{
        let errmsg = req.flash('err1') ;   
        if(errmsg.length > 0){ 
          errmsg = errmsg[0];
        }
        else{
          errmsg = null;
        }
  
        console.log(user);
        res.render('auth/new-password', {
          path: '/new-password',
          pgTitle: 'New Password',
          errorMsg : errmsg,
          userId : user._id.toString(),
          passwordToken : token,
        });
      })
      .catch(err=>{
        console.log(err);
      });
};
  
  
exports.postNewPasswordPage = (req ,res ,next ) =>{
    const userid = req.body.userId;
    const newPassword = req.body.password;
    const passwordToken = req.body.passwordToken;
    let resetUser;
    console.log(userid);
  
    User.findOne({resetToken :  passwordToken  , resetTokenExpiry : {$gt : Date.now()} , _id : userid})
      .then(user=>{
        resetUser = user;
        return bcrypt.hash(newPassword , 12 ) 
      })
        .then(hashedpassword=>{
            resetUser.password = hashedpassword;
            resetUser.resetToken = undefined;
            resetUser.resetTokenExpiration = undefined;
    
        return resetUser.save();          
    })
      .then(result =>{
        console.log("password changed !");
        res.redirect('/login');
      })
      .catch(err=>{
        console.log(err);
      });
  
}