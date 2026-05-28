import fs from 'fs/promises';
import path from 'path';

const QUESTIONS_PATH = path.join(process.cwd(), 'data', 'db', 'questions.json');
const RESULTS_PATH = path.join(process.cwd(), 'data', 'db', 'results.json');

export async function getQuestions() {
  try {
    const data = await fs.readFile(QUESTIONS_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading questions:', error);
    return [];
  }
}

export async function saveQuestions(questions: any) {
  await fs.writeFile(QUESTIONS_PATH, JSON.stringify(questions, null, 2), 'utf-8');
}

export async function getResults() {
  try {
    const data = await fs.readFile(RESULTS_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading results:', error);
    return [];
  }
}

export async function saveResult(result: any) {
  const results = await getResults();
  results.unshift({ ...result, createdAt: new Date().toISOString() }); // Add to beginning
  await fs.writeFile(RESULTS_PATH, JSON.stringify(results, null, 2), 'utf-8');
  return result;
}

export async function saveResults(results: any[]) {
  await fs.writeFile(RESULTS_PATH, JSON.stringify(results, null, 2), 'utf-8');
}
