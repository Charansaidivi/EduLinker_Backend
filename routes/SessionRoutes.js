const express=require('express')
const router=express.Router()
const {postSessionHandler}=require('../controller/SessionController')
router.post('/postSession',postSessionHandler)
module.exports=router