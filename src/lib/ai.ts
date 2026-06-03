export function getAiConfig() {
  const groqKey = process.env.GROQ_API_KEY || process.env.GROQ_FITWITHAI;
  
  if (groqKey) {
    return {
      url: "https://api.groq.com/openai/v1/chat/completions",
      headers: {
        "Authorization": `Bearer ${groqKey}`,
        "Content-Type": "application/json"
      },
      model: "llama-3.3-70b-versatile"
    };
  } else {
    throw new Error("No AI API key found. Please add GROQ_API_KEY to your .env file.");
  }
}
