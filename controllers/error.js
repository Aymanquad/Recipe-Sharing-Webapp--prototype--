exports.get404 = (req, res, next) => {
    res.status(404).render('recipe_stuff/404', { 
      pgTitle: 'Page Not Found', path: '/404' ,
    });
  };
   