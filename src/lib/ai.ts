export function getAiConfig() {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.VITE_GEMINI_API_KEY;
  
  if (geminiKey) {
    return {
      url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      headers: {
        "Authorization": `Bearer ${geminiKey}`,
        "Content-Type": "application/json"
      },
      model: "models/gemini-flash-latest"
    };
  } else {
    throw new Error("No AI API key found. Please add GEMINI_API_KEY to your .env file.");
  }
}
