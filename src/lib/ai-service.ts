import type { QuizQuestion, PredictionPatterns, GeneratedPaper, PredictionConfig } from '../types/database';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function callEdgeFunction(functionName: string, body: Record<string, unknown>) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Edge function error`);
  }
  return response.json();
}

export async function extractTextFromFile(file: File): Promise<string> {
  if (file.type === 'text/plain') {
    return file.text();
  }
  const base64 = await fileToBase64(file);
  try {
    const result = await callEdgeFunction('extract-text', {
      fileData: base64,
      mimeType: file.type,
      fileName: file.name,
    });
    return result.text || '';
  } catch {
    return `[Extracted content from ${file.name}]`;
  }
}

export async function summarizeText(text: string): Promise<string> {
  if (!text.trim()) return 'No content to summarize.';
  try {
    const result = await callEdgeFunction('summarize', { text });
    return result.summary;
  } catch {
    return generateLocalSummary(text);
  }
}

export async function generateQuizFromSummary(
  summary: string,
  difficulty: 'easy' | 'medium' | 'hard',
  count: number
): Promise<QuizQuestion[]> {
  try {
    const result = await callEdgeFunction('generate-quiz', { summary, difficulty, count });
    return result.questions;
  } catch {
    return generateLocalQuiz(summary, difficulty, count);
  }
}

export async function analyzePapersAndSyllabus(
  syllabusText: string,
  paperTexts: string[]
): Promise<PredictionPatterns> {
  try {
    const result = await callEdgeFunction('analyze-papers', { syllabusText, paperTexts });
    return result.patterns;
  } catch {
    return generateLocalPatterns(syllabusText, paperTexts);
  }
}

export async function generatePredictedPaper(
  patterns: PredictionPatterns,
  config: PredictionConfig
): Promise<GeneratedPaper> {
  try {
    const result = await callEdgeFunction('generate-paper', { patterns, config });
    return result.paper;
  } catch {
    return generateLocalPaper(patterns, config);
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
  });
}

function generateLocalSummary(text: string): string {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const keyPoints = sentences.slice(0, 5).map(s => s.trim());
  const words = text.toLowerCase().split(/\s+/);
  const wordFreq: Record<string, number> = {};
  words.forEach(word => {
    if (word.length > 4) wordFreq[word] = (wordFreq[word] || 0) + 1;
  });
  const topWords = Object.entries(wordFreq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([word]) => word);
  return `Key Concepts:\n${keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\nMain Topics: ${topWords.slice(0, 5).join(', ')}\n\nImportant Terms: ${topWords.slice(5, 10).join(', ')}\n\nStudy Tips:\n- Review the key concepts above\n- Practice with quizzes to reinforce learning`;
}

function generateLocalQuiz(summary: string, difficulty: 'easy' | 'medium' | 'hard', count: number): QuizQuestion[] {
  const sentences = summary.split(/[.!?\n]+/).filter(s => s.trim().length > 20);
  const questions: QuizQuestion[] = [];
  const templates = {
    easy: ['What is mentioned about {}?', 'Which relates to {}?', 'The content discusses {}?'],
    medium: ['How does {} relate to the main concept?', 'What is the significance of {}?', 'Which best describes {}?'],
    hard: ['Analyze the relationship between {} and the core concepts.', 'What inference can be drawn about {}?', 'How would {} apply practically?'],
  };
  const diffTemplates = templates[difficulty];
  for (let i = 0; i < Math.min(count, sentences.length); i++) {
    const sentence = sentences[i].trim();
    const words = sentence.split(/\s+/).filter(w => w.length > 4);
    const keyword = words[Math.floor(Math.random() * words.length)] || 'this topic';
    const template = diffTemplates[i % diffTemplates.length];
    const questionText = template.replace('{}', keyword);
    const correctOption = sentence.length > 50 ? sentence.substring(0, 50) + '...' : sentence;
    const wrongOptions = ['This is not mentioned in the notes', 'The opposite is true', 'This relates to a different concept'];
    const options = [correctOption, ...wrongOptions];
    for (let j = options.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [options[j], options[k]] = [options[k], options[j]];
    }
    const newCorrectIndex = options.indexOf(correctOption);
    questions.push({
      id: `q-${i}-${Date.now()}`,
      question: questionText,
      options,
      correctIndex: newCorrectIndex,
      explanation: `This answer is derived from: "${sentence}"`,
    });
  }
  while (questions.length < count) {
    questions.push({
      id: `q-gen-${questions.length}-${Date.now()}`,
      question: `Question ${questions.length + 1}: What key concept should be remembered?`,
      options: ['Review all material thoroughly', 'Skip to next section', 'Ignore fundamentals', 'Only memorize'],
      correctIndex: 0,
      explanation: 'Thorough review is always recommended.',
    });
  }
  return questions.slice(0, count);
}

function generateLocalPatterns(syllabusText: string, paperTexts: string[]): PredictionPatterns {
  const syllabusTopics = extractTopics(syllabusText);
  const allQuestions: string[] = [];
  paperTexts.forEach(paper => {
    const questions = paper.split(/\d+[\.\)]/g).filter(q => q.trim().length > 20);
    allQuestions.push(...questions.map(q => q.trim()));
  });
  const topicFrequency: Record<string, { count: number; marks: number; years: Set<number> }> = {};
  syllabusTopics.forEach(topic => { topicFrequency[topic] = { count: 0, marks: 0, years: new Set() }; });
  allQuestions.forEach((question, idx) => {
    const year = 2020 + (idx % 5);
    syllabusTopics.forEach(topic => {
      if (question.toLowerCase().includes(topic.toLowerCase())) {
        topicFrequency[topic].count++;
        topicFrequency[topic].marks += 5;
        topicFrequency[topic].years.add(year);
      }
    });
  });
  const topics = Object.entries(topicFrequency).map(([name, data]) => ({
    name, frequency: data.count, totalMarks: data.marks, yearsAppeared: Array.from(data.years).sort(),
  }));
  const repeatedQuestions = findRepeatedQuestions(allQuestions, syllabusTopics);
  return { topics, repeatedQuestions };
}

function extractTopics(text: string): string[] {
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  const topics: string[] = [];
  lines.forEach(line => {
    const cleaned = line.replace(/^\d+[\.\)]\s*/, '').replace(/^[-•]\s*/, '').trim();
    if (cleaned.length > 3 && cleaned.length < 100) topics.push(cleaned);
  });
  if (topics.length === 0) {
    const words = text.split(/\s+/).filter(w => w.length > 5);
    return [...new Set(words)].slice(0, 10);
  }
  return topics.slice(0, 20);
}

function findRepeatedQuestions(questions: string[], topics: string[]): PredictionPatterns['repeatedQuestions'] {
  const repeated: PredictionPatterns['repeatedQuestions'] = [];
  const seen: Record<string, { count: number; variants: string[] }> = {};
  questions.forEach(q => {
    const normalized = q.toLowerCase().replace(/[^\w\s]/g, '').trim();
    const key = normalized.split(/\s+/).slice(0, 5).join(' ');
    if (seen[key]) {
      seen[key].count++;
      if (!seen[key].variants.includes(q)) seen[key].variants.push(q);
    } else {
      seen[key] = { count: 1, variants: [q] };
    }
  });
  Object.entries(seen).filter(([, data]) => data.count > 1).forEach(([, data]) => {
    const topic = topics.find(t => data.variants[0].toLowerCase().includes(t.toLowerCase())) || 'General';
    repeated.push({ questionText: data.variants[0], variants: data.variants.slice(1), topic, timesRepeated: data.count });
  });
  return repeated.slice(0, 10);
}

function generateLocalPaper(patterns: PredictionPatterns, config: PredictionConfig): GeneratedPaper {
  const totalQuestions = config.totalQuestions || 20;
  const sortedTopics = [...patterns.topics].sort((a, b) => b.frequency - a.frequency);
  const sections: GeneratedPaper['sections'] = [
    { name: 'Section A - Short Answer', totalMarks: 20, questions: [] },
    { name: 'Section B - Medium Answer', totalMarks: 30, questions: [] },
    { name: 'Section C - Long Answer', totalMarks: 50, questions: [] },
  ];
  const questionsPerSection = Math.ceil(totalQuestions / 3);
  let questionId = 0;
  sections.forEach((section, sectionIdx) => {
    const difficulty: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];
    const sectionDifficulty = difficulty[sectionIdx];
    const marks = [2, 5, 10][sectionIdx];
    for (let i = 0; i < questionsPerSection && questionId < totalQuestions; i++) {
      const topicIdx = i % sortedTopics.length;
      const topic = sortedTopics[topicIdx] || { name: 'General', frequency: 1 };
      const probabilityScore = Math.min(0.95, 0.3 + (topic.frequency * 0.1));
      const relatedRepeated = patterns.repeatedQuestions.find(rq => rq.topic === topic.name);
      let questionText: string;
      let sourceType: 'new' | 'inspired' | 'similar-to-past';
      if (relatedRepeated && Math.random() > 0.5) {
        questionText = `Based on ${topic.name}: ${relatedRepeated.questionText.substring(0, 100)}...`;
        sourceType = 'similar-to-past';
      } else if (topic.frequency > 2) {
        questionText = `Explain the concept of ${topic.name} and its applications.`;
        sourceType = 'inspired';
      } else {
        questionText = `Discuss ${topic.name} with relevant examples.`;
        sourceType = 'new';
      }
      section.questions.push({ id: `pred-${questionId++}`, text: questionText, topic: topic.name, marks, difficulty: sectionDifficulty, probabilityScore, sourceType });
    }
  });
  return { sections };
}