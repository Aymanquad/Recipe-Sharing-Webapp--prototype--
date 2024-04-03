const Public = require('../models/public');
const crypto = require('crypto');


exports.mainPg = (req ,res , next)=>{
  res.render('recipe_stuff/index', { 
    pgTitle: 'Recipes',
    path: '/',
  });
}

exports.getGlobalRecipes = (req ,res , next)=>{
  res.render('recipe_stuff/search_recipes', { 
    pgTitle: 'GlobalRecipes',
    path: '/search_recipes',
    results : [],
  });
}

exports.getMyRecipes = (req ,res , next)=>{
  const recipes = req.session.user.my_recipes ;

      res.render('recipe_stuff/my_recipes', { 
        pgTitle: 'My Recipes',
        path: '/my-recipes',
        recipe_arr : recipes ,
      });
}


exports.getAddrecipe = (req, res, next) => {
    const user = req.user;
    const recipe_arr_length = user.my_recipes.length + 1;

    // Generate a unique hash for the user using their email or username
    const uniqueHash = crypto.createHash('sha256').update(user.email || user.name).digest('hex');

    // Calculate the recipe ID incorporating the unique hash
    const calculation = parseInt(user._id.toString(), 16) * recipe_arr_length * parseInt(uniqueHash.substring(0, 8), 16);
    const recipeId = calculation.toPrecision(5);

    res.render('recipe_stuff/add-recipe', {
        pgTitle: 'Add a Recipe',
        path: '/Add-recipe',
        editing: false,
        recipeId: recipeId,
    });
}




exports.postAddrecipe = (req,res,next)=>{
  const title = req.body.title ;
  const image= req.body.imageUrl;
  const time= req.body.time ;
  const ingredients= req.body.ingredients
  const recipe= req.body.recipe ;
  const visibility = req.body.visibility;
  const recipe_id = req.body.recipeid ;

  
  const recipe_data = { title : title , imageUrl : image  , time_req : time , ingredients : ingredients , recipe : recipe , visibility : visibility  , id : recipe_id , ratings : [] };
  
  console.log(visibility);
  if(visibility == 'public'){
    console.log("Adding to public db");

    const public_recipe_data = {...recipe_data , madeBy : req.user.name};

    req.public.recipeObjects.push(public_recipe_data);
    req.public.save();
  };
    // const addInPublic = new Public(public_arr);
    // addInPublic.save();
  
  
  //console.log(req.user.my_recipes);
  req.user.my_recipes.push(recipe_data);
  req.user.save() 
    .then(result => {
      req.session.user = req.user ;
      res.redirect('/my-recipes');
    })
    .catch(err => {
        console.log(err);
        
    });
}



exports.postDeleteRecipe = (req, res, next) => {
  const recipe_id = req.body.recipeId;
  const recipes = req.user.my_recipes;
  const  public_recipes = req.public.recipeObjects;

  for (let i = 0; i < recipes.length; i++) {
      if (recipes[i].id === recipe_id) {

          //public part
          if(recipes[i].visibility == 'public'){
            for (let i = 0; i < public_recipes.length; i++) {
              if (public_recipes[i].id === recipe_id) {
                  public_recipes.splice(i, 1); 
                  req.public.save();
                  console.log("recipe removed from public as well !");
                  break;
                }
            }
          }

          recipes.splice(i, 1); 
          req.user.save()
              .then(result => {
                  req.session.user = req.user ;
                  console.log("Recipe removed!");
                  return res.redirect('/my-recipes');
              })
              .catch(err => {
                  console.log(err);
                  return res.redirect('/');
              });
          return; 
      }
  }

  return res.redirect('/');
}


exports.getEditRecipe = (req ,res, next)=>{
  const recipeId = req.params.recipeId ;
  const recipes = req.user.my_recipes;

  // console.log("Inside diss");


  for (let i = 0; i < recipes.length; i++) {
    if (recipes[i].id === recipeId) {
        req.user.save()
            .then(result => {
              console.log("found recipe!");
              res.render('recipe_stuff/add-recipe', { 
                pgTitle: 'Update a Recipe',
                path: '/edit-recipe',
                recipe : recipes[i],
                editing : true,
                recipeId : recipeId,
              });
            })
            .catch(err => {
                console.log(err);
                return res.redirect('/');
            });
        return; // Exit the loop after removing the recipe
    }
  }

  return res.redirect('/');
};


exports.postEditRecipe = (req ,res, next) =>{
  const recipes = req.user.my_recipes;
  const  public_recipes = req.public.recipeObjects;

  
  const title = req.body.title ;
  const image= req.body.imageUrl;
  const time= req.body.time ;
  const ingredients= req.body.ingredients
  const recipe= req.body.recipe ;
  const visibility = req.body.visibility;
  const recipe_id = req.body.recipeId ;
  let ratings = [];

  for(i=0; i<public_recipes.length ; i++){
    if(public_recipes[i].title == title){
      ratings = public_recipes[i].ratings ;
    }
  }


  // console.log(recipe_id);
  
  const recipe_data2 = { title : title , imageUrl : image , time_req : time , ingredients : ingredients , recipe : recipe , visibility : visibility  , id : recipe_id , ratings : ratings};
  const public_recipe_data2 = {...recipe_data2 , madeBy : req.user.name };
  console.log(" public data  is ...",public_recipe_data2);


  //public part
  if(visibility == 'public'){
    let flag = 0;
    for (let i = 0; i < public_recipes.length; i++) {
      if(public_recipes[i].id === recipe_id) {
          public_recipes[i] = public_recipe_data2;
          req.public.save();
          console.log("recipe updated in public as well !");
          flag = 1;
          break;
        }
    }

    if(flag == 0){  //recipe made from private to public 
      req.public.recipeObjects.push(public_recipe_data2);
      req.public.save();
      console.log("recipe changed to public !");
    }
  }

  if(visibility == 'private'){   // recipe made from public to private 
    for (let i = 0; i < public_recipes.length; i++) {
      if (public_recipes[i].id === recipe_id) {
          public_recipes.splice(i, 1); 
          req.public.save();
          console.log("recipe removed from public only!");
          break;
        }
    }
  }


  for (let i = 0; i < recipes.length; i++) {
    if (recipes[i].id === recipe_id) {

      recipes[i] = recipe_data2;
      req.user.save()
        .then(result => {
          req.session.user = req.user ;
          return res.redirect('/my-recipes');
        })
        .catch(err => {
            console.log(err);              
        });
      return; // Exit the loop after removing the recipe
    }
  } 
  res.redirect('/');
}


exports.getDetailsOfRecipe = (req ,res , next) =>{
  const recipeId = req.params.recipeId ;
  const recipes = req.user.my_recipes;
  let username ;
  let ratings;
  let highest_rating;
  let highest_rating_count = 1 ;
  const public_recipes = req.public.recipeObjects ;
  let recipeObj ;

  for (let i = 0; i < recipes.length; i++) {
    if (recipes[i].id === recipeId) {
      recipeObj = recipes[i];
      username = false ;
      // console.log("recipe obj sent !");
    }
  }

  if(recipeObj === undefined){   //To access data from public (accessing from public page)
    for (let i = 0; i < public_recipes.length; i++) {
      if (public_recipes[i].id === recipeId) {
        recipeObj = public_recipes[i];
        username =  req.user.name;
        ratings = public_recipes[i].ratings ;

        if(ratings.length > 0){ //ratings are present
          highest_rating = ratings[0].rating ;
          for(let j=0 ; j < ratings.length ; j++){
            if(ratings[j].rating > highest_rating){
              highest_rating_count += 1;
            }
          }
        }
        else{
          highest_rating = "No ratings given yet";
          highest_rating_count = 0 ;
        }
      }
    }
  }

  res.render('recipe_stuff/recipe-details', { 
    pgTitle: 'Recipe Details',
    path: '/details',
    recipeId : recipeId,
    recipeObj : recipeObj,
    userName : username, 
    ratingStuff : {hr :highest_rating , hrc : highest_rating_count},
  });
}


exports.getPublicRecipes = (req ,res , next)=>{
  const PublicRecipes =  req.public.recipeObjects;
  const my_fav = req.user.my_favourites ;

      res.render('recipe_stuff/public-recipes', { 
        pgTitle: 'Public Recipes',
        path: '/public-recipes',
        recipe_arr : PublicRecipes ,
        favourites : false,
        my_fav : my_fav,
      });
}

exports.getFavRecipes = (req ,res , next)=>{
  let FavRecipes =  req.user.my_favourites;

  // if(FavRecipes == undefined){
  //   FavRecipes = [];
  // }
  // console.log("fav recipes are..",FavRecipes);

    res.render('recipe_stuff/public-recipes', { 
      pgTitle: 'Favourite Recipes',
      path: '/my-favourites',
      recipe_arr : FavRecipes ,
      favourites : true,
    });
}


exports.postAddToFavourites = (req ,res , next)=>{
  const recipeId  = req.body.recipeId;
  const public_recipes = req.public.recipeObjects;
  let recipe_Object
  // const myfav = req.user.my_favourites ; 

  for (let i = 0; i < public_recipes.length; i++) {
    if (public_recipes[i].id === recipeId) {
      recipe_Object = {...public_recipes[i] , madeBy : public_recipes[i].madeBy };
    }
  }
  req.user.my_favourites.push(recipe_Object);
  req.user.save()
    .then(result =>{
      req.session.user = req.user ;   
      console.log("added to fav !!");
      res.redirect('/public-recipes');
    })
    .catch(err=>{
      console.log(err);
    })
};



exports.postDeleteFromFavourites = (req,res,next)=>{
  const recipeId  = req.body.recipeId;
  const myfav = req.user.my_favourites ; 

  // console.log("recipeId is ...",recipeId);

  for (let i = 0; i < myfav.length; i++) {
    if (myfav[i].id === recipeId) {

        myfav.splice(i, 1); 
        req.user.save()
            .then(result => {
                req.session.user = req.user ;
                console.log("Recipe removed from fav!");
                return res.redirect('/my-favourites');
            })
            .catch(err => {
                console.log(err);
                return res.redirect('/');
            });
    }
}
};


exports.addRating = (req, res, next) => {
  const rating = req.body.rating;
  const recipeId = req.body.recipeId;
  const public_recipes = req.public.recipeObjects;
  const user = req.user.name;
  const ratingObj = { user, rating } ;

  console.log("recipe id and its rating is ...", recipeId, rating);

  for (let i = 0; i < public_recipes.length; i++){
    if (public_recipes[i].id == recipeId) {
      const recipe_ratings = public_recipes[i].ratings;

      let flag = false;
      for (let j = 0; j < recipe_ratings.length; j++) {
        if (recipe_ratings[j].user == user) {                                // Update review
          flag = true;
          console.log("Recipe rating updated");
          recipe_ratings[j].rating = rating ;
          break; // Exit loop once updated
        }
      }

      if (!flag) {                                                           // New rating
        recipe_ratings.push(ratingObj);
        console.log("Recipe rating stored!");

      }
    }
    req.public.recipeObjects[i] = public_recipes[i] ;     //saving manually
  }
  // console.log(public_recipes[4]);
  

  req.public.save()
    .then(() => {
      console.log("Data saved successfully");
    })
    .catch(err => {
      console.error("Error:", err);
      res.status(500).send("Error occurred while saving data");
    });

  res.redirect(`/details/${recipeId}`);
}
