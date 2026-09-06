

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

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set. Falling back to mock insights.");
      return mockInsights;
    }

    try {
      // Format the context
      let incomeBreakdown = pnlData.income.items.map(i => `  - ${i.name}: ₹${i.balance}`).join("\n") || "  None";
      let expenseBreakdown = pnlData.expenses.items.map(e => `  - ${e.name}: ₹${e.balance}`).join("\n") || "  None";

      const prompt = `
You are an expert Chief Financial Officer (CFO) performing a strict financial audit. Review the following Profit and Loss statement and provide 3 highly analytical, data-driven financial insights. 
Do not give generic business tips or advice (e.g., "invest in marketing" or "negotiate with vendors"). Focus exclusively on deep financial analysis, margin efficiency, revenue composition anomalies, and expense distribution based strictly on the provided numbers. Use professional financial terminology.

FINANCIAL CONTEXT:
- Total Income: ₹${pnlData.income.total}
Income Breakdown:
${incomeBreakdown}

- Total Expenses: ₹${pnlData.expenses.total}
Expense Breakdown:
${expenseBreakdown}

- Net Profit: ₹${pnlData.net_profit}

Respond ONLY with a valid JSON array of 3 strings. Example: ["Insight 1", "Insight 2", "Insight 3"]
`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7
          }
        }),
      });

      if (!response.ok) {
        console.error("Gemini API Error:", await response.text());
        return mockInsights;
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

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
