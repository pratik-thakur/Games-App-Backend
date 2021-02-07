const express = require('express')
const router = new express.Router()
const adminAuth = require('../middleware/adminAuth')
const User = require('../models/users')
const Game = require('../models/games')

//Add games
router.post('/addGames',adminAuth,async(req,res)=>{
    const games = new Game(req.body)
     try{
         await games.save()
         const users = await User.find()
         //console.log(users)
         users.forEach(async (user)=>{
            // console.log(user)
             user.games = user.games.concat({gameId:req.body.gameId,score:0,win:0})
             //console.log(user)
             await user.save()
         })
         
         res.status(201).send(games)
     }catch(e){
         res.status(400).send(e)
     }
})

//Add result
router.post('/addResult',adminAuth,async (req,res)=>{
    const result = req.body
    try{
        const user1 = await User.findById(result.u1Id)
       // console.log(user1)
        const user2 = await User.findById(result.u2Id)
        //console.log(user2)
        const game = await Game.findOne({gameId:result.gameId})
        //console.log(game)
        if(!user1||!user2)
            throw new Error('Please Enter a valid user Id')
        if(!game)
            throw new Error('Please Enter a valid gameId')
        if(typeof(result.scoreU1)!=='number'|| typeof(result.scoreU2)!=='number' )
            throw new Error('Please enter a valid score of users')
        if(typeof(result.win)!=="boolean")
            throw new Error('Please Enter a boolean value for win')
        //console.log("working")
        let winU1=0
        let winU2=0
        if(result.win === true)
        {
            winU1 = 1
        }
        else
        {
            winU2 = 1
        }
        //console.log(winU1,winU2)
        user1.games.forEach(async (game)=>{
            if(game.gameId===result.gameId)
            {
                game.score=game.score+result.scoreU1
                game.win = game.win + winU1
                await user1.save()
            }
        })
        user2.games.forEach(async (game)=>{
             if(game.gameId===result.gameId)
            {
                game.score=game.score+result.scoreU2
                game.win = game.win+ winU2
                await user2.save()
            }
        })
        res.send({user1,user2})

    }catch(e){
        res.status(400).send(e)
    }
})

module.exports = router