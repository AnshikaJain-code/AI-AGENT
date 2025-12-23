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
    const { summaries, patterns, examInfo } = await req.json();
    const geminiKey = Deno.env.get('VITE_GEMINI_API_KEY');

    if (!geminiKey) {
      throw new Error('Gemini API key not configured');
    }

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are an expert exam predictor. Based on study materials and historical patterns, predict likely exam questions. Return a JSON array with "topic", "probability", and "sampleQuestion" fields.\n\nBased on these study summaries and patterns, predict likely exam questions:\n\nSummaries: ${JSON.stringify(summaries)}\nPatterns: ${JSON.stringify(patterns)}\nExam Info: ${JSON.stringify(examInfo)}\n\nReturn as JSON array only with predicted topics.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text() || '[]';

    let predictions = [];
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      predictions = JSON.parse(cleanContent);
    } catch {
      predictions = [];
    }

    return new Response(JSON.stringify({ predictions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message, predictions: [] }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});