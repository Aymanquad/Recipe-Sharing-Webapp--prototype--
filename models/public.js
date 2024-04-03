const mongoose = require('mongoose');

const publicSchema = mongoose.Schema({
    
    recipeObjects : {
        type: Array,
        required: true
    },

})


module.exports = mongoose.model('Public', publicSchema);