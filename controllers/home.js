const { GoogleGenAI } = require("@google/genai");
const PromptResult = require("../models/PromptResults")


module.exports = {
    getIndex: (req,res)=>{
        res.render('index.ejs')
    },

    getPrompt: async (req,res) => {

        const Prompts = await PromptResult.find().sort({createdAt: "asc"})
        console.log(Prompts)


        res.render('prompt.ejs', {myResults: Prompts})
    },

    postPrompt: async (req,res) =>{

        console.log(req.body.prompt)
        const company = req.body.company
        const prompt = req.body.prompt

     try{
        const ai = new GoogleGenAI({apikey: process.env.GOOGLE_API_KEY});

        async function main() {
        const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `I want to get hired in Tech as a software engineer. I'm using information from employees profiles to craft a message as an introduction to start a conversation and become more familiar with them, I will input information from persons biography or other information and I would like you to give me a few responses, one is super professional and related to something that may have happened with tech or their specific company, second is a witty response based on something personal in the profile, and the third is a reponse that is funny based on pop culture or some recent social media phenomenons. I want it to be a few sentences to a paragraph for each response. seperated by the words 'professional, witty, and funny' followed by each response. Here is the company: ${company} Here is the information: ${prompt}`,
        });
        console.log(response.text);

        await PromptResult.create({
            company: req.body.company,
            prompt: req.body.prompt,
            name: req.body.personName,
            result: response.text
        })
        }

        await main();

       


        //let resultInfo = req.body.prompt

        //const resultText = document.getElementById('result')

        //resultText.innerText = resultInfo

        res.redirect('/')
        //res.send(response.text()); // send result to client

     } catch (err){
        console.log(err)
     }


    }
}