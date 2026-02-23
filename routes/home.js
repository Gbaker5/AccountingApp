const express = require('express')
const router = express.Router()
const homeController = require('../controllers/home')
const authController = require("../controllers/auth");

const upload = require("../middleware/multer");


router.get("/login", authController.getLogin);
router.post("/login", authController.postLogin);
router.get("/logout", authController.logout);
router.get("/signup", authController.getSignup);
router.post("/signup", authController.postSignup);


router.get('/', homeController.getIndex) 
router.get('/profile', homeController.getProfile)
router.get('/newClient', homeController.getNewClient)
router.post('/newClient', homeController.postNewClient)
router.get('/getExistingClients', homeController.getExistingClients)

router.get('/clientPage/:id', homeController.getClientPage)
router.put('/updateClientPage/:id', homeController.updateClientPage)
router.delete('/goalDelete/:id/goals/:goalId', homeController.deleteGoal)
router.get('/newDoc/:id', homeController.getNewDocs)
router.post('/postPdfDocs/:id', upload.single("pdf"), homeController.postPdfDocs)
router.get('/existingDocs/:id', homeController.getExistingDocs)
router.get("/pdf/:id/raw-text", homeController.getRawText);

//router.post('/postAnalyzeDocs/:id', homeController.postAnalyzeDocs)
router.get('/analytics/:id', homeController.getAnalytics)
router.post('/analytics/:id/ai-insight', homeController.postAiInsight)
router.get('/graphs/:id', homeController.getGraphs)



//router.get('/getPrompt', homeController.getPrompt)
//
//router.post('/postPrompt', homeController.postPrompt)



module.exports = router