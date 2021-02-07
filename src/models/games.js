const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')
const gameSchema = new mongoose.Schema({
    gameId:{
        type:String,
        unique:true,
        required:true,
        trim:true,
        lowercase:true   
    },
    gameName:{
        type:String,
        unique:true,
        required:true,
        trim:true
        
    }
},{
    timestamps:true
})

gameSchema.methods.toJSON = function(){
    const user =this
    const userObject = user.toObject()

    delete userObject._id
    delete userObject.createdAt
    delete userObject.updatedAt

    return userObject
}
gameSchema.plugin(uniqueValidator)
const Games = mongoose.model('Games',gameSchema)

module.exports = Games