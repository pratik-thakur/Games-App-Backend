const express = require('express')
const router = new express.Router()
const auth = require('../middleware/auth')
const User = require('../models/users')
const Games = require('../models/games')
const {sendWelcomeEmail , sendCancelationEmail}=require('../emails/account')

//Register User
router.post('/register',async (req,res)=>{
    delete req.body.role
    const user = new User(req.body)
    //console.log(req.body)
    try{

        await user.save()
        if(user.email && user.name)
        {
            sendWelcomeEmail(user.email,user.name)
        }
        const token = await user.generateAuthToken()
        await user.addGamesToUser()
        
        res.send({user,token})
    }catch(e){
        res.status(400).send(e)
    }
})

//Login user
router.post('/login',async (req,res)=>{
    try{
        const user = await User.findByCredentials(req.body.phoneNumber,req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user ,token })
    }catch(e){
        res.status(400).send(e)
    }
})

router.post('/logout',auth,async(req,res)=>{
    try{
        req.user.tokens = req.user.tokens.filter(token=>{
            return token.token!==req.token
        })
        await req.user.save()
        res.send()
    }catch(e){
        res.status(500).send()
    }
})

router.post('/logoutAll',auth,async (req,res)=>{
    try{
        req.user.tokens=[]
        await req.user.save()
        res.send()
    }catch(e){
        res.status(500).send()

    }
})

router.delete('/users/me',auth,async(req,res)=>{
    try{
        //const user = await User.findByIdAndDelete(req.user._id)
        // if(!user)
        // return res.status(404).send()
        await req.user.remove()
        if(req.user.email && req.user.name)
        {
        sendCancelationEmail(req.user.email,req.user.name)
        }
        res.send(req.user)

    }catch(e){
        res.status(500).send()
    }
})
//update  user
router.patch('/users/me',auth,async(req,res)=>{
    const updates = Object.keys(req.body)
    const allowedUpdates =['name','email','password','age','location']
    const isValidOperation = updates.every((update)=>{
        return allowedUpdates.includes(update)
    })

    if(!isValidOperation){
        return res.status(400).send({error:'Invalid Updates!'})
    }
    try{
        //const user = await User.findById(req.params.id)
        updates.forEach(update=>{
            req.user[update]=req.body[update]
        })
        await req.user.save()
        //const user = await User.findByIdAndUpdate(req.params.id,req.body , {new:true, runValidators:true})
        // if(!user){
        //     return res.status(404).send()
        // }
        res.send(req.user)
    }catch(e){
        res.status(400).send(e)
    }
})

//get profile
router.get('/users/me',auth,async(req,res)=>{

    res.send(req.user)
})

//get list of games
router.get('/games',auth,async(req,res)=>{
    try{
        const games = await Games.find()
        
        res.send(games)
    }catch(e){
        res.status(500).send()
    }
})

// get LeaderBoard of all the games
router.get('/leaderBoard/:id',auth,async (req,res)=>{
    const Game= await Games.findOne({gameId:req.params.id}) 
    //console.log(game,req.params.id)
    try{
        if(!Game)
        return res.status(404).send({error:"Game Id Invalid"})
        const leaderBoard = []
        //console.log('working')
        const users = await User.find({'games.gameId':req.params.id})
        users.forEach((user)=>{
            const game = user.games.find(games=>games.gameId===req.params.id) 
            //console.log(game)       
            const totalWins = game.win
            const totalPoints= game.score
            leaderBoard.push({UserId:user._id,totalWins,totalPoints})
        })
        leaderBoard.sort((a,b)=>{
            if(a.totalWins === b.totalWins)
            {
                return a.totalPoints<b.totalPoints?1:-1;
            }
            return a.totalWins<b.totalWins ?1:-1;
        })
        let rank = 0
        let lastUserWin = NaN
        let lastUserPoints = NaN
        //console.log(lastUserPoints,lastUserWin)
        leaderBoard.forEach((user)=>{
            if((lastUserWin !==user.totalWins)||(lastUserPoints !==user.totalPoints))
            {
            rank=rank+1
            }

            user.Rank=rank
            
            lastUserWin = user.totalWins 
            lastUserPoints = user.totalPoints
            //console.log(lastUserPoints,lastUserWin)
        })
        res.send(leaderBoard)
    }catch(e){
        res.status(500).send()
    }
})

module.exports = router