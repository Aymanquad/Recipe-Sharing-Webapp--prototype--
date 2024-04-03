const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const csrf = require('csurf');                         // to use csrf(cross site response forgery) tokens to provide security to users
const flash = require('connect-flash');
const session = require('express-session');
const cors = require('cors');
const request = require('request');
const mongoose = require('mongoose');
const MongoDBStore = require('connect-mongodb-session')(session); //function

app.use(
    cors({
      origin: ["http://localhost:3000", "https://receipe-sharing-webapp.onrender.com"],
    })
  );

app.set('view engine' , 'ejs');       
app.set('views' , 'views');     

app.use(flash());

const webApp = new MongoDBStore({
    uri : process.env.MONGO_URI,
    collection : "sessions"   // collection name 
});

const errorRoute = require('./controllers/error');
const recipesRoute = require('./routes/recipes');
const authRoute = require('./routes/auth');
const User = require('./models/user');
const Public = require('./models/public');
const { log } = require('console');




const csrfProtection = csrf();

app.use(bodyParser.urlencoded({extended:false}));   
app.use(express.static(path.join(__dirname , 'public'))); 

app.use(
    session({ secret: 'my secret' , resave: false , saveUninitialized : true , store : webApp }) // resave and saveUninitialized are kept false in order to improve efficiency and provide more security as it does not change with every req change . 
);
 
app.use(csrfProtection);

app.use((req , res , next) =>{
    res.locals.isAuthenticated = req.session.loggedIn ; 
    res.locals.csrfToken = req.csrfToken() ;             //doing this for the csrf token which will generate and look for a name="_csrf" in our views to assign it a csrf_token 
    next();
})


app.use((req, res, next) => {
    if(!req.session.user) {
        // req.session.destroy();
        // console.log("session destroyed !");
        return next();
    }

    User.findById(req.session.user._id)
        .then(user => {
            if(!user) {
                return next();
            }

            req.user = user;
            next();
        })
        .catch(err => {
            next (new Error(err));
        });
    
});

app.use((req, res, next) => {
    Public.findById(process.env.PUBLIC_DB_ID)
        .then(public => {
            if(!public) {
                console.log("No public found !");
                return ;
            }

            req.public = public;
            next();
            })
        .catch(err => {
            console.log(err);
        });
});


// Middleware to serve static files from the frontend directory
app.use(express.static(path.join(__dirname, 'frontend')));


//API STUFF
app.post('/search', (req, res) => { // Use POST method instead of GET for form submission
    const query = req.body.query;
    const options = {
        method: 'GET',
        url: 'https://api.edamam.com/search',
        qs: {
            q: query,
            app_id: process.env.FOOD_API_ID ,
            app_key: process.env.FOOD_API_KEY ,
            to: 18 // Limit the number of results
        }
    };

    request(options, (error, response, body) => {
        if (error) {
            console.error(error);
            res.render('error');
        } else {
            const data = JSON.parse(body);
            //console.log("data retreived is ...",data);
            res.render('recipe_stuff/search_recipes', { pgTitle : 'Search' , query, results: data.hits });
        }
    });
});



app.use(recipesRoute);
app.use(authRoute);
app.use(errorRoute.get404); 

 
// app.listen(3000);
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB !'); 
        app.listen(3000);
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error);
    });
