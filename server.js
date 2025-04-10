const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

let openai;

app.post('/api/generate-quiz', async (req, res) => {
  try {
    const { text, apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    // Initialize OpenAI with the provided API key
    openai = new OpenAI({
      apiKey: apiKey
    });

    const prompt = `Create a quiz with 5 multiple choice questions based on the following text. Each question should have 4 options and one correct answer. Return ONLY the JSON object with the following structure, without any markdown formatting or additional text:
    {
      "questions": [
        {
          "question": "question text",
          "options": ["option1", "option2", "option3", "option4"],
          "correctAnswer": "correct option"
        }
      ]
    }
    
    Text: ${text}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant that creates educational quizzes. Always return only the JSON object without any additional text or markdown formatting." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    });

    // Clean the response to ensure it's valid JSON
    const responseText = completion.choices[0].message.content;
    const cleanJson = responseText.replace(/```json\n?|\n?```/g, '').trim();
    const quiz = JSON.parse(cleanJson);
    
    res.json(quiz);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 