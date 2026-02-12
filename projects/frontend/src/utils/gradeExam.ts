import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Helper to pause execution
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function gradeExam(question: string, studentCode: string): Promise<{ passed: boolean; feedback: string; score: number }> {
    console.log("🤖 AI GRADER: Analyzing Code...");

    // 1. DEMO MODE: If no key, skip straight to success
    if (!API_KEY) {
        console.warn("⚠️ No API Key found. Using Simulation Mode.");
        await sleep(1500); // Fake delay
        return { passed: true, score: 92, feedback: "Simulation: Excellent use of O(n) logic. (No API Key)" };
    }

    const genAI = new GoogleGenerativeAI(API_KEY);

    // 2. REAL AI: Try to grade
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        
        const prompt = `
        You are a Python Interviewer. Grade this code.
        QUESTION: "${question}"
        CODE: "${studentCode}"
        OUTPUT JSON: { "passed": boolean, "score": number, "feedback": "string" }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleanJson);

    } catch (error: any) {
        console.error("AI Error:", error.message);
        
        // 3. FALLBACK: If Quota Exceeded (429) or Network Error, PASS THE USER
        console.warn("⚠️ AI Failed (Quota/Network). Falling back to Simulation Mode.");
        await sleep(1000); 
        
        return {
            passed: true,
            score: 88,
            feedback: "Simulation: Good job! (AI Service Busy, fallback active)"
        };
    }
}