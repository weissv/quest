export function extractValidJSON(text: string): any {
  // Strategy 1: Direct clean and parse
  let cleanText = text
    .replace(/^```json\s*/i, '')
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

  // Strategy 3: Find the first balanced JSON object or array
  const findBalanced = (str: string, startChar: string, endChar: string): string | null => {
    let startIdx = str.indexOf(startChar);
    if (startIdx === -1) return null;

    // Try finding balanced structure from the first occurrence
    let count = 0;
    let inString = false;
    let escape = false;

    for (let i = startIdx; i < str.length; i++) {
      const char = str[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (char === '\\') {
        escape = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === startChar) count++;
        else if (char === endChar) count--;

        if (count === 0) {
          return str.substring(startIdx, i + 1);
        }
      }
    }
    return null;
  };

  const jsonObjStr = findBalanced(text, '{', '}');
  if (jsonObjStr) {
    try {
      return JSON.parse(jsonObjStr);
    } catch (e) {}
  }

  const jsonArrStr = findBalanced(text, '[', ']');
  if (jsonArrStr) {
    try {
      return JSON.parse(jsonArrStr);
    } catch (e) {}
  }

  // Strategy 4: Find the LAST balanced JSON object
  // Sometimes the model talks first, gives a fake JSON, then gives the real one at the end.
  const findLastBalanced = (str: string, startChar: string, endChar: string): string | null => {
    let lastEndIdx = str.lastIndexOf(endChar);
    if (lastEndIdx === -1) return null;

    // We can just reverse search by doing a greedy match backwards, but simplest is to find all balanced objects
    // and take the last one.
    let currentStr = str;
    let lastValidObj = null;

    while (currentStr.indexOf(startChar) !== -1) {
      const objStr = findBalanced(currentStr, startChar, endChar);
      if (!objStr) break;
      lastValidObj = objStr;
      
      // Advance past this object to find the next one
      const idx = currentStr.indexOf(objStr);
      currentStr = currentStr.substring(idx + objStr.length);
    }

    return lastValidObj;
  };

  const lastJsonObjStr = findLastBalanced(text, '{', '}');
  if (lastJsonObjStr && lastJsonObjStr !== jsonObjStr) {
    try {
      return JSON.parse(lastJsonObjStr);
    } catch (e) {}
  }

  // Strategy 5: The greedy regex fallback from first { to last }
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch (e) {}
  }

  throw new Error(`Cannot extract valid JSON. Raw snippet: ${text.substring(0, 300)}`);
}
