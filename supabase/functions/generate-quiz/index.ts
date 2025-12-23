import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { summary, difficulty, count } = await req.json();
    const geminiKey = Deno.env.get('VITE_GEMINI_API_KEY');

    if (!geminiKey) {
      throw new Error('Gemini API key not configured');
    }

    const difficultyGuidance = {
      easy: 'Create simple, straightforward questions that test basic comprehension.',
      medium: 'Create moderate difficulty questions that require understanding of key concepts.',
      hard: 'Create challenging questions that require deep analysis and synthesis of concepts.',
    };

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are an expert educational content creator. Generate quiz questions as a JSON array with "question", "options" (array of 4), and "correctIndex" (0-3) fields.\n\n${difficultyGuidance[difficulty]} Generate ${count} multiple choice questions from this content:\n\n${summary}\n\nReturn as JSON array only, no other text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text() || '[]';

    let questions = [];
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      questions = JSON.parse(cleanContent);
    } catch {
      questions = [];
    }

    return new Response(JSON.stringify({ questions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message, questions: [] }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});