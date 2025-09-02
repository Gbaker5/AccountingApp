const express = require('express')
const router = express.Router()
const homeController = require('../controllers/home')

router.get('/', homeController.getIndex) 

router.get('/getPrompt', homeController.getPrompt)

router.post('/postPrompt', homeController.postPrompt)


module.exports = router