export function extractValidJSON(text: string): any {
  // Strategy 1: Direct clean and parse
  let cleanText = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(cleanText);
  } catch (e) {}

  // Strategy 2: Find first markdown block
  const markdownMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (markdownMatch) {
    try {
      return JSON.parse(markdownMatch[1].trim());
    } catch (e) {}
  }

  // Strategy 3: Find balanced { ... } incrementally
  const firstBrace = text.indexOf('{');
  if (firstBrace !== -1) {
    let lastBrace = text.lastIndexOf('}');
    while (lastBrace > firstBrace) {
      try {
        const candidate = text.substring(firstBrace, lastBrace + 1);
        return JSON.parse(candidate);
      } catch (e) {
        // Find previous closing brace
        lastBrace = text.lastIndexOf('}', lastBrace - 1);
      }
    }
  }

  // Strategy 4: Fallback for array [ ... ]
  const firstBracket = text.indexOf('[');
  if (firstBracket !== -1) {
    let lastBracket = text.lastIndexOf(']');
    while (lastBracket > firstBracket) {
      try {
        const candidate = text.substring(firstBracket, lastBracket + 1);
        return JSON.parse(candidate);
      } catch (e) {
        lastBracket = text.lastIndexOf(']', lastBracket - 1);
      }
    }
  }

  throw new Error(`Cannot extract valid JSON. Raw snippet: ${text.substring(0, 300)}`);
}
