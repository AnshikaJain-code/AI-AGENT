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
    const { syllabusText, paperTexts } = await req.json();
    const geminiKey = Deno.env.get('VITE_GEMINI_API_KEY');

    if (!geminiKey) {
      throw new Error('Gemini API key not configured');
    }

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are an expert exam analyzer. Analyze past papers and syllabus to identify patterns. Return JSON with "topics" array (each with name, frequency, totalMarks, yearsAppeared) and "repeatedQuestions" array.\n\nAnalyze this syllabus and past papers to identify patterns:\n\nSyllabus:\n${syllabusText}\n\nPast Papers:\n${paperTexts.join('\n---\n')}\n\nReturn JSON only.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text() || '{}';

    let patterns = { topics: [], repeatedQuestions: [] };
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      patterns = JSON.parse(cleanContent);
    } catch {
      patterns = { topics: [], repeatedQuestions: [] };
    }

    return new Response(JSON.stringify({ patterns }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message, patterns: { topics: [], repeatedQuestions: [] } }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});