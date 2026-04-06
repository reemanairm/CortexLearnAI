import dotenv from 'dotenv';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

dotenv.config();

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('FATAL ERROR: GEMINI_API_KEY is not set in environment variables.');
}

const ai = new GoogleGenerativeAI(apiKey);

/* ---------------------------------------------------
   Generate Flashcards (Structured JSON)
--------------------------------------------------- */
export const generateFlashcards = async (text, count = 10, fileData = null) => {
  const prompt = `You are an expert educational content creator. Your goal is to generate exactly ${count} high-quality flashcards that COVERS EVERY SINGLE DETAIL in the provided text.
  
  CRITICAL INSTRUCTIONS:
  1. DO NOT SKIP ANY TOPICS. Every paragraph and key fact in the text must be reflected in at least one flashcard.
  2. Ensure the ${count} flashcards are distributed evenly across the entire provided content to ensure 100% coverage.
  3. Create comprehensive flashcards that allow a student to learn the entire material from scratch.

  IMPORTANT: Return ONLY a raw JSON array. DO NOT use markdown blocks like \`\`\`json.

  Read the provided document and create comprehensive flashcards based on the key concepts:
  ${text ? "Text context:\n" + text.substring(0, 20000) : "No text provided, rely on the document file."}`;

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
    console.log('[Gemini] Generating flashcards, count:', count, 'text length:', text?.length || 0);
    const model = ai.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    console.log('[Gemini] Raw response:', responseText.substring(0, 200));
    
    let flashcards = JSON.parse(responseText);

    if (!Array.isArray(flashcards)) {
      flashcards = flashcards.flashcards || [];
    }

    console.log('[Gemini] Flashcards generated:', flashcards.length);
    return flashcards.slice(0, count);
  } catch (error) {
    console.error('[Gemini] Flashcards API error:', error.message);
    console.error('[Gemini] Error details:', error);
    throw new Error(`Gemini API Error: ${error.message}`);
  }
};

/* ---------------------------------------------------
   Generate Quiz Questions (Structured JSON)
--------------------------------------------------- */
export const generateQuiz = async (text, numQuestions = 5, difficultyPref = "medium", fileData = null) => {
  const prompt = `
Generate exactly ${numQuestions} multiple choice questions that COVERS EVERY SINGLE DETAIL, CONCEPT, AND FACT in the provided text.

CRITICAL INSTRUCTIONS:
1. FULL COVERAGE: Every part of the document must be tested. Ensure the questions are spread across the entire content.
2. The overall difficulty tone of the questions should be focused on: ${difficultyPref}.
3. Each question must be unique and technically accurate based on the context.

IMPORTANT: Return ONLY a raw JSON array. DO NOT use markdown blocks like \`\`\`json.

If text is provided:
${text ? "Text context:\n" + text.substring(0, 15000) : "No text provided, rely on the document file."}
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
        topic: { type: SchemaType.STRING, description: "The specific sub-topic or concept this question tests (e.g., 'Array Methods', 'CSS Flexbox')." },
      },
      required: ["question", "options", "correctAnswer", "explanation", "difficulty", "topic"],
    },
  };

  try {
    console.log('[Gemini] Generating quiz, questions:', numQuestions, 'difficulty:', difficultyPref, 'text length:', text?.length || 0);
    const model = ai.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    console.log('[Gemini] Raw response:', responseText.substring(0, 200));
    
    let questions = JSON.parse(responseText);

    if (!Array.isArray(questions)) {
      questions = questions.questions || [];
    }

    console.log('[Gemini] Questions generated:', questions.length);
    return questions.slice(0, numQuestions);
  } catch (error) {
    console.error('[Gemini] Quiz API error:', error.message);
    console.error('[Gemini] Error details:', error);
    throw new Error(`Gemini API Error: ${error.message}`);
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
    console.log('[Gemini] Generating summary, text length:', text?.length || 0);
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    console.log('[Gemini] Summary generated, length:', responseText?.length || 0);
    return responseText;
  } catch (error) {
    console.error('[Gemini] Summary API error:', error.message);
    console.error('[Gemini] Error details:', error);
    throw new Error(`Gemini API Error: ${error.message}`);
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
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to explain concept');
  }
};

/* ---------------------------------------------------
   Detect Chapters or Topics
--------------------------------------------------- */
export const detectChapters = async (text) => {
  const prompt = `
Analyze the following document and divide it into a minimum of 3 and a maximum of 8 logical chapters/topics. 
CRITICAL: You MUST provide a structured breakdown regardless of the document type.

Rules for splitting:
1. If the document has clear headings (e.g., "# Chapter 1", "Introduction"), use those as the primary chapters.
2. If it is a Coding/Program file: Each complete program, class, or large function block must be its own chapter titled by the program's purpose.
3. If it is a set of Q&A or Exercises: Group every 5 questions into a "Section".
4. If it is unstructured prose/paragraphs: Divide it into 4 equal sections titled "Part 1: [Topic]", "Part 2: [Topic]", etc., based on the narrative flow.

Structure required for EACH chapter:
- title: A descriptive and engaging name.
- summary: A 2-sentence overview.
- startQuote: The first ~5-10 words of the section.
- endQuote: The last ~5-10 words of the section.

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