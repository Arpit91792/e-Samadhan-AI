import { GoogleGenerativeAI } from "@google/generative-ai";

console.log("🤖 [geminiService] Initializing Google Generative AI...");

if (!process.env.GEMINI_API_KEY) {
      console.error("❌ [geminiService] GEMINI_API_KEY not found in .env");
      console.error("❌ [geminiService] Voice complaint feature will not work");
} else {
      console.log("✅ [geminiService] GEMINI_API_KEY loaded from environment");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
});

console.log("✅ [geminiService] Gemini 1.5 Flash model initialized");

export default model;
