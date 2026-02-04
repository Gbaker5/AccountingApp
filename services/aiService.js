const OpenAI = require("openai");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


///OPENAI analyzing raw text and sending back json
async function analyzeTransactions(rawText) {
  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini", // fast + cheap + accurate
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "You are an accounting assistant that extracts structured financial data.",
      },
      {
        role: "user",
        content: `
        Extract all transactions from the text below.

        Rules:
        - Return ONLY valid JSON
        - No markdown
        - No commentary
        - Dates must be YYYY-MM-DD
        - Amounts must be numbers
        - Categories must be one of:
          Food, Travel, Entertainment, Utilities, Shopping, Income, Other

        Text:
        """
        ${rawText}
        """
                `,
              },
            ],
          });
      
          const content = response.choices[0].message.content;
      
          return JSON.parse(content);
        }

module.exports = { analyzeTransactions };