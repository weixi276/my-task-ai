import { GoogleGenAI, Type } from "@google/genai";
import { SmartBreakdownResponse, Priority } from "../types";

export async function getTaskBreakdown(taskTitle: string): Promise<SmartBreakdownResponse> {
  // 建立新的 GoogleGenAI 實例，直接使用由環境注入的 API KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `請將以下任務拆解為 3-5 個繁體中文的可執行子任務，並建議優先順序（低、中、高）。任務名稱： "${taskTitle}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subTasks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "具體的子任務清單。"
            },
            suggestedPriority: {
              type: Type.STRING,
              description: "建議的優先權，必須是 '低'、'中' 或 '高'。"
            }
          },
          required: ["subTasks", "suggestedPriority"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("AI 回傳內容為空");
    
    const data = JSON.parse(text);
    
    let priority: Priority = Priority.MEDIUM;
    if (data.suggestedPriority === '高') priority = Priority.HIGH;
    if (data.suggestedPriority === '低') priority = Priority.LOW;

    return {
      subTasks: Array.isArray(data.subTasks) ? data.subTasks : [],
      suggestedPriority: priority
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    // 預設的回退方案
    return {
      subTasks: ["明確目標細節", "執行第一個步驟", "檢視成果並優化"],
      suggestedPriority: Priority.MEDIUM
    };
  }
}
