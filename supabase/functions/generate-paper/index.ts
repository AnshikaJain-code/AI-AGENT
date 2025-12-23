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
    const { patterns, config } = await req.json();
    const geminiKey = Deno.env.get('VITE_GEMINI_API_KEY');

    if (!geminiKey) {
      throw new Error('Gemini API key not configured');
    }

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are an expert exam creator. Based on analysis patterns, generate a realistic exam paper. Return JSON with "sections" array, each containing questions with id, text, topic, marks, difficulty, probabilityScore, sourceType.\n\nGenerate an exam paper based on these patterns and config:\n\nPatterns: ${JSON.stringify(patterns)}\nConfig: ${JSON.stringify(config)}\n\nReturn JSON only.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text() || '{}';

    let paper = { sections: [] };
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      paper = JSON.parse(cleanContent);
    } catch {
      paper = { sections: [] };
    }

    return new Response(JSON.stringify({ paper }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message, paper: { sections: [] } }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});