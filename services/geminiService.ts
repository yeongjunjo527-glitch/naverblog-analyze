import { GoogleGenAI } from "@google/genai";
import { BlogStat, AnalysisResult } from '../types';
import { GEMINI_MODEL_FLASH } from '../constants';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeBlogStats = async (stats: BlogStat[]): Promise<AnalysisResult> => {
  if (!stats || stats.length === 0) {
    return { markdown: "No data available to analyze." };
  }

  // 1. Prepare Data for Prompt
  const dataSummary = JSON.stringify(stats.map(s => ({
    date: s.date,
    views: s.views,
    visitors: s.visitors
  })));

  // 2. Construct Prompt
  const prompt = `
    I am providing you with JSON data representing my blog's performance over the last 30 days.
    Data: ${dataSummary}

    Please analyze this data and provide a response in Markdown format.
    
    1. **Growth Trend**: Analyze the trend of views and visitors. Is it growing, stagnant, or declining?
    2. **Anomalies**: Identify any specific dates with unusually high or low traffic and suggest potential reasons based on general blogging patterns (e.g., weekends vs weekdays).
    3. **Strategy**: Propose 3 actionable strategies to improve blog traffic based on this specific data pattern.

    Keep the tone professional yet encouraging.
  `;

  try {
    // 3. Call Gemini
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_FLASH,
      contents: prompt,
    });

    const text = response.text;
    
    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    return {
      markdown: text
    };

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      markdown: "Failed to generate analysis. Please try again later.\n\nError details: " + (error instanceof Error ? error.message : "Unknown error")
    };
  }
};
