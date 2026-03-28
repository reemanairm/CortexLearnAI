import dotenv from 'dotenv';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

dotenv.config();

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

if (!process.env.GEMINI_API_KEY) {
  console.error('FATAL ERROR: GEMINI_API_KEY is not set in environment variables.');
  process.exit(1);
}

/* ---------------------------------------------------
   Generate Flashcards (Structured JSON)
--------------------------------------------------- */
export const generateFlashcards = async (text, count = 10, fileData = null) => {
  const prompt = `You are an expert flashcard creator. Generate exactly ${count} high-quality educational flashcards.
  
  IMPORTANT: Return ONLY a raw JSON array. DO NOT use markdown blocks like \`\`\`json.
  
  Read the provided document and create comprehensive flashcards based on the key concepts.
  If text is provided:
  ${text ? text.substring(0, 20000) : "No text provided, rely on the document file."}`;

  const schema = {
    type: SchemaType.ARRAY,
    items: {
      type: SchemaType.OBJECT,
      properties: {
        question: { type: SchemaType.STRING, description: "Clear, specific question covering a key concept." },
        answer: { type: SchemaType.STRING, description: "Detailed, comprehensive answer." },
        difficulty: { type: SchemaType.STRING, enum: ["easy", "medium", "hard"], description: "Difficulty level." },
      },
      required: ["question", "answer", "difficulty"],
    },
  };

  try {
    const model = ai.getGenerativeModel({
      model: 'gemini-2.5-flash', // upgraded from flash-lite for better multimodal reasoning
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });

    const contentParts = [prompt];
    // If a file was uploaded and passed in, use it for multimodal context
    if (fileData) {
      contentParts.push(fileData);
    }

    const result = await model.generateContent(contentParts);
    let flashcards = JSON.parse(result.response.text());

    if (!Array.isArray(flashcards)) {
      flashcards = flashcards.flashcards || [];
    }

    return flashcards.slice(0, count);
  } catch (error) {
    console.error('Gemini API (Flashcards) error:', error);
    throw new Error('Failed to generate flashcards');
  }
};

/* ---------------------------------------------------
   Generate Quiz Questions (Structured JSON)
--------------------------------------------------- */
export const generateQuiz = async (text, numQuestions = 5, difficultyPref = "medium", fileData = null) => {
  const prompt = `
Generate exactly ${numQuestions} multiple choice questions from the provided document.
The overall difficulty tone of the questions should be focused on: ${difficultyPref}.

IMPORTANT: Return ONLY a raw JSON array. DO NOT use markdown blocks like \`\`\`json.

If text is provided:
${text ? text.substring(0, 15000) : "No text provided, rely on the document file."}
`;

  const schema = {
    type: SchemaType.ARRAY,
    items: {
      type: SchemaType.OBJECT,
      properties: {
        question: { type: SchemaType.STRING, description: "The quiz question." },
        options: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: "Exactly 4 options for the multiple choice question."
        },
        correctAnswer: { type: SchemaType.STRING, description: "The exact text of the correct option." },
        explanation: { type: SchemaType.STRING, description: "Brief explanation of why the answer is correct." },
        difficulty: { type: SchemaType.STRING, enum: ["easy", "medium", "hard"] },
      },
      required: ["question", "options", "correctAnswer", "explanation", "difficulty"],
    },
  };

  try {
    const model = ai.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });

    const contentParts = [prompt];
    // If a file was uploaded and passed in, use it for multimodal context
    if (fileData) {
      contentParts.push(fileData);
    }

    const result = await model.generateContent(contentParts);
    let questions = JSON.parse(result.response.text());

    if (!Array.isArray(questions)) {
      questions = questions.questions || [];
    }

    return questions.slice(0, numQuestions);
  } catch (error) {
    console.error('Gemini API (Quiz) error:', error);
    throw new Error('Failed to generate quiz');
  }
};

/* ---------------------------------------------------
   Generate Summary
--------------------------------------------------- */
export const generateSummary = async (text, fileData = null) => {
  const prompt = `
Provide a concise summary of the accompanying document, highlighting key concepts, main ideas, and important points.
Keep it structured and easy to revise.

${text ? "Text context:\n" + text.substring(0, 20000) : ""}
`;

  try {
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const contentParts = [prompt];
    // If a file was uploaded and passed in, use it for multimodal context
    if (fileData) {
      contentParts.push(fileData);
    }

    const result = await model.generateContent(contentParts);
    return result.response.text();
  } catch (error) {
    console.error('Gemini API (Summary) error:', error);
    throw new Error('Failed to generate summary');
  }
};
// ---- Chat with Document Context ----
export const chatWithContext = async (question, chunks, fileData = null) => {
  const context = chunks
    .map((c, i) => `[Chunk ${i + 1}]\n${c.content}`)
    .join('\n\n');

  const prompt = `
You are a highly intelligent and lenient AI study assistant. 
Your goal is to answer the user's question by combining the provided document context and your vast general knowledge.

Instructions:
1. Be extremely resilient to typos (e.g., "palindrome" vs "palindrom"), misspellings, and slight concept mismatches. 
2. If the user's question relates in any way to the subjects in the document, or if you can reasonably infer what they meant, just provide a clear, educational answer immediately. Do NOT complain that the exact word wasn't found in the text.
3. Use your general knowledge liberally to fill in any gaps that the document misses.
4. The disclaimer should be VERY RARE. ONLY if the question is 100% completely, unmistakably unrelated to anything in the document, start your response EXACTLY with:
"Nothing found exactly related to '${question}' in the document, but here is the answer: "
and then answer using your broad knowledge. Otherwise, just answer the question normally.

Context:
${context}

Question: ${question}
Answer:
`;

  try {
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const contentParts = [prompt];
    if (fileData) {
      contentParts.push(fileData);
    }
    const result = await model.generateContent(contentParts);
    return result.response.text();
  } catch (error) {
    console.error('Gemini API (Chat) error:', error);
    throw new Error('Failed to process chat request');
  }
};


// ---- Explain Specific Concept ----
export const explainConcept = async (concept, context) => {
  const prompt = `
Explain the concept of "${concept}" based on the following context.
Provide a clear, educational explanation that's easy to understand.
Include examples if relevant.

Context:
${context.substring(0, 10000)}
`;

  try {
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to explain concept');
  }
};

/* ---------------------------------------------------
   Generate Structured Notes from Transcript
--------------------------------------------------- */
export const generateStructuredNotes = async (transcript) => {
  const prompt = `
You are an expert educational AI. Convert the following video transcript into structured study notes.
Include:
- A clear Title at the very top (e.g. # Video Title)
- Structured sections with headings
- Key concepts and definitions
- Examples if any
- A brief summary at the end

Transcript:
${transcript.substring(0, 30000)}
`;

  try {
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Gemini API (Notes) error:', error);
    throw new Error('Failed to generate structured notes');
  }
};

/* ---------------------------------------------------
   Detect Chapters or Topics
--------------------------------------------------- */
export const detectChapters = async (text) => {
  const prompt = `
Analyze the following educational document and divide it into logical chapters or topics.
Return ONLY a raw JSON array. DO NOT use markdown blocks like \`\`\`json.

Each object in the array should have:
- title: The name of the chapter or topic (e.g., "Chapter 1 - Introduction" or "Topic: Gradient Descent")
- summary: A brief 1-2 sentence overview of what is covered in this chapter/topic
- startQuote: The exact first few words (up to 10 words) indicating where this chapter starts in the text
- endQuote: The exact last few words (up to 10 words) indicating where this chapter ends in the text

Document Text:
${text.substring(0, 25000)}
`;

  const schema = {
    type: SchemaType.ARRAY,
    items: {
      type: SchemaType.OBJECT,
      properties: {
        title: { type: SchemaType.STRING },
        summary: { type: SchemaType.STRING },
        startQuote: { type: SchemaType.STRING },
        endQuote: { type: SchemaType.STRING }
      },
      required: ["title", "summary", "startQuote", "endQuote"],
    },
  };

  try {
    const model = ai.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });
    const result = await model.generateContent(prompt);
    let chapters = JSON.parse(result.response.text());
    return chapters;
  } catch (error) {
    console.error('Gemini API (Chapters) error:', error);
    // Fallback if AI fails or returns malformed response
    return [{ title: "General Discussion", summary: "Main topics discussed in this document.", startQuote: "", endQuote: "" }];
  }
};