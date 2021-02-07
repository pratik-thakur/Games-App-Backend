const mongoose=require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const uniqueValidator = require('mongoose-unique-validator')
const Games = require('./games')

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        //required:true,
        trim:true
    },
    age:{
        type:Number,
        default:0,
        validate(value){
            if(value<0){
                throw new Error('Age must be a positive number')
            }
        }
    },
    role:{
        type:String,
        default:'User',
        trim:true
    },
    location:{
        type:String,
        trim:true
    },
    email:{
        type:String,
        // unique:true,
        // required:true,
        trim:true,
        lowercase:true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Email is Invalid')
            }
        }
    },
    phoneNumber:{
        type:Number,
        unique:true,
        required:true,
        minlength:10,
        maxlength:10
    },
    password:{
        type:String,
        required:true,
        minlength:7,
        trim:true,
        validate(value){
            if(value.toLowerCase().includes('password'))
            {
            throw new Error('Password cannot conatin "password"')
            }
        }
    },
    games:[
        {
            gameId:{
                type:String,
                required:true,
            },
            score:{
                type:Number,
                required:true
            },
            win : {
                type:Number,
                required:true
            }
        }
    ],
    tokens:[{
        token:{
            type:String,
            required:true
        }
    }],
},{
    timestamps:true
})

userSchema.methods.toJSON = function(){
    const user =this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.role
    delete userObject.createdAt
    delete userObject.updatedAt
    return userObject
}

userSchema.methods.addGamesToUser = async function (){
    const user = this 
    const games = await Games.find()
        games.forEach(async (game)=>{
            //console.log(game,typeof(game))
            const gameId = game.gameId
            user.games = user.games.concat({gameId,score:0,win:0})
            
        })
        await user.save()
        return user
}

userSchema.methods.generateAuthToken = async function (){
    const user = this 
    const token = jwt.sign({_id : user._id.toString()},process.env.JWT_SECRET)
    user.tokens = user.tokens.concat({token})
    await user.save()
    return token
}

//model methods
userSchema.statics.findByCredentials = async (phoneNumber,password)=>{
    const user = await User.findOne({phoneNumber})
    if(!user){
        throw new Error('Unable to login')
    }
    const isMatch = await bcrypt.compare(password,user.password)
    if(!isMatch){
        throw new Error('Unable to login')
    }
    return user
}

//hash the plain text password before saving
userSchema.pre('save',async function(next){
    const user = this

    if(user.isModified('password')){
        user.password= await bcrypt.hash(user.password,8)
    }
    //console.log('just before saving')
    next()
})

userSchema.plugin(uniqueValidator)
const User = mongoose.model('User',userSchema)


module.exports = User