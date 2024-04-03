const express = require('express');
const router = express.Router();

const recipeController = require('../controllers/recipes');

const Auth = require('../auth_protection/auth_middleware');

router.get('/', recipeController.mainPg);

router.get('/search_recipes' , Auth ,recipeController.getGlobalRecipes);

router.get('/my-recipes' , Auth ,recipeController.getMyRecipes);

router.get('/add-recipe', Auth ,recipeController.getAddrecipe);

router.post('/add-recipe', Auth ,recipeController.postAddrecipe);

router.post('/delete-recipe' , Auth , recipeController.postDeleteRecipe); 

router.get('/edit-recipe/:recipeId', Auth ,recipeController.getEditRecipe);

router.post('/edit-recipe', Auth ,recipeController.postEditRecipe);

router.get('/details/:recipeId', Auth ,recipeController.getDetailsOfRecipe);

router.get('/public-recipes' , Auth , recipeController.getPublicRecipes);

router.get('/my-favourites' , Auth , recipeController.getFavRecipes);

router.post('/favourite-recipe' , Auth , recipeController.postAddToFavourites);

router.post('/remove-from-favourites' , Auth , recipeController.postDeleteFromFavourites);

router.post('/add-rating' , Auth , recipeController.addRating);



module.exports = router;