
import { GoogleGenAI } from "@google/genai";

// Ensure API_KEY is available in the environment.
// In a Vite/Create React App project, this would be import.meta.env.VITE_API_KEY or process.env.REACT_APP_API_KEY
// For this generic setup, we assume process.env.API_KEY is somehow defined globally,
// or this service won't be functional.
const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.warn(
    "API_KEY environment variable not found. Gemini API functionality will be disabled."
  );
}

// Initialize the Google AI client if API key is available
const genAI = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Example function (not used in the current slide editor)
const generateText = async (prompt: string): Promise<string | null> => {
  if (!genAI) {
    console.error("Gemini API client not initialized. API_KEY missing?");
    return "Gemini API not available. Please check your API key configuration.";
  }
  try {
    // Using a model that is generally available and suitable for text generation.
    // Replace with 'gemini-2.5-flash-preview-04-17' as per latest guidelines.
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash-preview-04-17', 
      contents: [{ role: "user", parts: [{text: prompt}] }],
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Error generating text from Gemini.";
  }
};

export const geminiService = {
  generateText,
  isAvailable: () => !!genAI,
};

// This service is created to fulfill the structural requirement.
// The current application (HTML Slide Editor) does not use Gemini API features.
