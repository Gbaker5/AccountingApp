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
        //contents: `I want to get hired in Tech as a software engineer. I'm using information from employees profiles to craft a message as an introduction to start a conversation and become more familiar with them, I will input information from persons biography or other information and I would like you to give me a few responses, one is super professional and related to something that may have happened with tech or their specific company, second is a witty response based on something personal in the profile, and the third is a reponse that is funny based on pop culture or some recent social media phenomenons. I want it to be a few sentences to a paragraph for each response. seperated by the words 'professional, witty, and funny' followed by each response. Here is the company: ${company} Here is the information: ${prompt}`,
        const ai = new GoogleGenAI({apikey: process.env.GOOGLE_API_KEY});

        async function main() {
        const responseOne = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `I want to get hired in Tech as a software engineer. I'm using information from employees profiles to craft a message as an introduction to start a conversation and become more familiar with them, I will input information from a persons biography or other information and I would like you to give me a response that is super professional and related to something that may have happened with tech or their specific company. I want it to be a few sentences to a paragraph. Start with the word 'Professional' then respond. Here is the company: ${company} Here is the information: ${prompt}`,
        });

        const responseTwo = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `I want to get hired in Tech as a software engineer. I'm using information from employees profiles to craft a message as an introduction to start a conversation and become more familiar with them, I will input information from a persons biography or other information and I would like you to give me a response that is a witty response based on something personal in the profile. I want it to be a few sentences to a paragraph. Start with the word 'Witty' then respond. Here is the company: ${company} Here is the information: ${prompt}`,
        });

        const responseThree = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `I want to get hired in Tech as a software engineer. I'm using information from employees profiles to craft a message as an introduction to start a conversation and become more familiar with them, I will input information from a persons biography or other information and I would like you to give me a response that is funny and based on pop culture or some recent social media phenomenons. I want it to be a few sentences to a paragraph. Start with the word 'Funny' then respond. Here is the company: ${company} Here is the information: ${prompt}`,
        });

        console.log(responseOne.text);
        console.log(responseTwo.text);
        console.log(responseThree.text);



        await PromptResult.create({
            company: req.body.company,
            prompt: req.body.prompt,
            name: req.body.personName,
            professional: responseOne.text,
            witty: responseTwo.text,
            funny: responseThree.text,
        })
        }

        await main();

       
        res.redirect('/getPrompt')
        

     } catch (err){
        console.log(err)
     }


    }
}