

class AIService {
  /**
   * Generates AI financial insights based on P&L data using Gemini 1.5 Flash.
   * Gracefully falls back to mock data if the API fails or no key is provided.
   * 
   * @param {Object} pnlData - The Profit and Loss statement data.
   * @returns {Promise<string[]>} An array of 3 insight strings.
   */
  async generateInsights(pnlData) {
    const mockInsights = [
      "Your expenses are relatively stable, but keep an eye on operational costs as they make up a large portion of your outflow.",
      "Sales revenue is healthy. Consider re-investing a portion of your net profit into marketing to accelerate growth.",
      "Cash flow appears positive. It might be a good time to negotiate better terms with your frequent vendors."
    ];

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.warn("OPENAI_API_KEY is not set. Falling back to mock insights.");
      return mockInsights;
    }

    try {
      // Format the context
      const prompt = `
You are an expert CFO. Review the following Profit and Loss statement and provide 3 short, actionable business insights.
Focus on profit margins, areas of high expenditure, and growth opportunities. Keep it concise.

FINANCIAL CONTEXT:
- Total Income: ₹${pnlData.income.total}
- Total Expenses: ₹${pnlData.expenses.total}
- Net Profit: ₹${pnlData.net_profit}

Respond ONLY with a valid JSON array of 3 strings. Example: ["Insight 1", "Insight 2", "Insight 3"]
`;

      const url = `https://api.openai.com/v1/chat/completions`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        console.error("OpenAI API Error:", await response.text());
        return mockInsights;
      }

      const data = await response.json();
      const rawText = data.choices?.[0]?.message?.content;

      if (!rawText) {
        return mockInsights;
      }

      // Parse the JSON array from the markdown code block if present
      let cleanText = rawText.trim();
      if (cleanText.startsWith("\`\`\`json")) {
        cleanText = cleanText.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
      } else if (cleanText.startsWith("\`\`\`")) {
        cleanText = cleanText.replace(/\`\`\`/g, "").trim();
      }

      const parsedInsights = JSON.parse(cleanText);
      
      if (Array.isArray(parsedInsights) && parsedInsights.length > 0) {
        return parsedInsights;
      }

      return mockInsights;
    } catch (error) {
      console.error("Failed to generate AI insights, returning fallbacks:", error);
      return mockInsights;
    }
  }
}

module.exports = new AIService();
