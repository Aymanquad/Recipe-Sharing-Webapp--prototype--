const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    id : {
        type : mongoose.Schema.Types.ObjectId ,
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    my_recipes: {
        type : Array,
    },
    my_favourites :{
        type: Array,
    },
    resetToken : {
        type : String,
    },
    resetTokenExpiry : {
        type : String,
    },

})




module.exports = mongoose.model('User', userSchema);