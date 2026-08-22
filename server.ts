import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy Gemini API Client
let genAI: GoogleGenAI | null = null;

function getGenAIClient(): GoogleGenAI | null {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
        genAI = new GoogleGenAI({ apiKey });
      } catch (err) {
        console.error('Failed to initialize GoogleGenAI client:', err);
      }
    }
  }
  return genAI;
}

// Fallback question generator
function getFallbackQuestions(jobRole: string, interviewType: string, difficulty: string, count: number) {
  const baseQuestions: Record<string, string[]> = {
    'HR Interview': [
      'Tell me about yourself and your background.',
      'Why are you interested in joining our organization?',
      'What are your greatest professional strengths and weaknesses?',
      'Where do you see yourself in five years?',
      'Why should we hire you over other qualified candidates?',
      'How do you handle workplace stress and tight deadlines?',
      'Describe a time you dealt with a disagreement with a team member.',
      'What environment brings out your best performance?'
    ],
    'Technical Interview': [
      `Walk me through a challenging technical problem you solved as a ${jobRole}.`,
      'How do you ensure high code quality, performance, and maintainability in your work?',
      'Explain the trade-offs between speed and thorough design when working on tight deadlines.',
      'How do you approach debugging a complex, transient production issue?',
      'Describe a project architecture you designed or contributed to significantly.',
      'How do you stay up-to-date with new technologies and industry frameworks?',
      'Explain how object-oriented or functional programming principles apply to your work.',
      'Describe your process for conducting thorough code reviews.'
    ],
    'Behavioral Interview': [
      'Describe a situation where you had to lead a project under tight constraints.',
      'Tell me about a time you made a mistake at work or school and how you handled it.',
      'Give an example of a time you had to adapt quickly to unexpected changes.',
      'Describe how you prioritize competing tasks when everything feels urgent.',
      'Tell me about a time you persuaded a colleague or stakeholder to adopt your idea.',
      'Describe how you receive construct feedback and turn it into actionable growth.',
      'How do you handle working with someone whose communication style differs from yours?',
      'Tell me about a time you exceeded expectations on a deliverable.'
    ],
    'General Interview': [
      'Tell me about yourself and your key accomplishments.',
      'What made you choose your field of study or professional career path?',
      'Describe your ideal work culture and team dynamic.',
      'What is one accomplishment you are most proud of and why?',
      'How do you approach learning a completely new skill or domain quickly?',
      'Explain a project you worked on recently from start to finish.',
      'What strategies do you use to remain organized and focused under pressure?',
      'Why do you think you are a great fit for a modern, high-performing team?'
    ]
  };

  const pool = baseQuestions[interviewType] || baseQuestions['General Interview'];
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  
  return shuffled.slice(0, count).map((q, idx) => ({
    id: `q-${Date.now()}-${idx}`,
    questionText: q,
    category: interviewType
  }));
}

// Fallback answer analysis
function getFallbackAnalysis(userAnswer: string, metrics: any) {
  const length = userAnswer ? userAnswer.trim().length : 0;
  const wordCount = metrics?.wordCount || (userAnswer ? userAnswer.split(/\s+/).length : 0);
  const fillerCount = metrics?.fillerWordCount || 0;
  const wpm = metrics?.wordsPerMinute || 0;

  let relevance = 75;
  let clarity = 75;
  let structure = 70;
  let completeness = 70;
  let communication = 75;
  let confidence = 75;

  if (length < 30) {
    completeness -= 30;
    structure -= 20;
    clarity -= 15;
    confidence -= 20;
  } else if (length > 150) {
    completeness += 15;
    structure += 10;
  }

  if (fillerCount > 5) {
    communication -= 15;
    confidence -= 15;
  } else if (fillerCount === 0 && length > 50) {
    communication += 10;
    confidence += 10;
  }

  if (wpm > 0 && (wpm < 80 || wpm > 180)) {
    communication -= 10;
    confidence -= 10;
  }

  // Bound scores between 40 and 95
  const clamp = (v: number) => Math.min(95, Math.max(40, v));

  relevance = clamp(relevance);
  clarity = clamp(clarity);
  structure = clamp(structure);
  completeness = clamp(completeness);
  communication = clamp(communication);
  confidence = clamp(confidence);

  const overallScore = Math.round((relevance + clarity + structure + completeness + communication + confidence) / 6);

  let confidenceLabel: 'Strong' | 'Good' | 'Needs Improvement' = 'Good';
  if (confidence >= 80) confidenceLabel = 'Strong';
  else if (confidence < 65) confidenceLabel = 'Needs Improvement';

  return {
    relevanceScore: relevance,
    clarityScore: clarity,
    structureScore: structure,
    completenessScore: completeness,
    communicationScore: communication,
    confidenceScore: confidence,
    confidenceLabel,
    overallScore,
    feedback: length < 30 
      ? 'Your response was quite brief. Providing specific examples and elaborating on your actions helps build a stronger impression.'
      : 'Good effort in addressing the prompt! You clearly communicated key details while staying focused on the core theme.',
    strengths: [
      'Direct address of the question topic',
      wordCount > 30 ? 'Provided adequate elaboration' : 'Concise baseline answer'
    ],
    improvements: [
      fillerCount > 3 ? `Reduce filler word usage (${fillerCount} detected)` : 'Incorporate specific metrics or measurable outcomes',
      'Follow the STAR method (Situation, Action, Result) for structured storytelling'
    ],
    suggestedSTAR: {
      situation: 'Set up the context and initial constraint clearly.',
      action: 'Detail the concrete steps you personally spearheaded.',
      result: 'Conclude with quantifiable impact or key takeaways.'
    },
    practiceTip: 'Pause for 1-2 seconds to compose your thought before speaking to improve response structure.'
  };
}

// Route: Generate Questions
app.post('/api/ai/generate-questions', async (req, res) => {
  const { jobRole, customRole, interviewType, difficulty, questionCount } = req.body;
  const targetRole = customRole || jobRole || 'Software Developer';
  const count = Number(questionCount) || 5;

  const client = getGenAIClient();
  if (!client) {
    return res.json({
      questions: getFallbackQuestions(targetRole, interviewType, difficulty, count),
      source: 'fallback'
    });
  }

  try {
    const prompt = `You are an expert technical and HR interview conductor. 
Generate exactly ${count} distinct realistic interview questions for a candidate applying for the role: "${targetRole}".
Interview Type: ${interviewType}
Difficulty Level: ${difficulty}

Return ONLY a raw JSON array of objects with the following schema:
[
  {
    "id": "q1",
    "questionText": "The question text here...",
    "category": "Topic category (e.g., Problem Solving, Leadership, System Design, Communication)"
  }
]
Do not include markdown code block formatting (or wrap in \`\`\`json). Just the raw JSON.`;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    const text = response.text || '';
    const cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanText);

    if (Array.isArray(parsed) && parsed.length > 0) {
      return res.json({ questions: parsed, source: 'gemini' });
    }
  } catch (err) {
    console.error('Gemini API question generation error, using fallback:', err);
  }

  return res.json({
    questions: getFallbackQuestions(targetRole, interviewType, difficulty, count),
    source: 'fallback'
  });
});

// Route: Analyze Answer
app.post('/api/ai/analyze-answer', async (req, res) => {
  const { questionText, userAnswer, metrics, config } = req.body;

  const client = getGenAIClient();
  if (!client) {
    return res.json({
      analysis: getFallbackAnalysis(userAnswer, metrics),
      source: 'fallback'
    });
  }

  try {
    const prompt = `You are an AI Interview Confidence & Speech Coach. Analyze the user's mock interview response objectively.
IMPORTANT: This is an educational coaching tool, NOT a medical or psychological diagnosis. Do NOT mention medical or psychological disorders.

Job Role: ${config?.jobRole || 'Professional'}
Interview Type: ${config?.interviewType || 'General'}
Difficulty: ${config?.difficulty || 'Intermediate'}
Question Asked: "${questionText}"
User Answer Transcript: "${userAnswer || ''}"
Speech Metrics: Duration ${metrics?.durationSeconds || 0}s, Word Count: ${metrics?.wordCount || 0}, WPM: ${metrics?.wordsPerMinute || 0}, Filler Words Found: ${(metrics?.fillerWordsFound || []).join(', ') || 'None'}

Evaluate and return ONLY a raw JSON object with this exact schema:
{
  "relevanceScore": number (0-100),
  "clarityScore": number (0-100),
  "structureScore": number (0-100),
  "completenessScore": number (0-100),
  "communicationScore": number (0-100),
  "confidenceScore": number (0-100),
  "confidenceLabel": "Strong" | "Good" | "Needs Improvement",
  "overallScore": number (0-100),
  "feedback": "2-3 constructive sentences focusing on answer content and communication flow",
  "strengths": ["string", "string"],
  "improvements": ["string", "string"],
  "suggestedSTAR": {
    "situation": "Short sentence guiding situation setup",
    "action": "Short sentence guiding concrete actions",
    "result": "Short sentence guiding measurable outcomes"
  },
  "practiceTip": "One direct, actionable speech or delivery tip"
}
Do not use markdown wrappers. Return raw JSON.`;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    const text = response.text || '';
    const cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanText);

    if (parsed && typeof parsed.overallScore === 'number') {
      return res.json({ analysis: parsed, source: 'gemini' });
    }
  } catch (err) {
    console.error('Gemini API answer analysis error, using fallback:', err);
  }

  return res.json({
    analysis: getFallbackAnalysis(userAnswer, metrics),
    source: 'fallback'
  });
});

// Route: Get Coaching Insights
app.post('/api/ai/generate-coaching', async (req, res) => {
  const { userProfile, recentInterviews } = req.body;

  const client = getGenAIClient();
  if (!client) {
    return res.json({
      coaching: {
        summary: `Great progress! Based on your recent practice sessions, focusing on structuring responses using the STAR method will give your answers maximum punch.`,
        strengths: ['Consistent technical vocabulary', 'Good topic engagement'],
        focusAreas: ['Reducing speech hesitation fillers', 'Adding quantifiable project results'],
        recommendedDifficulty: 'Intermediate',
        tips: [
          'Use 1-2 second intentional pauses instead of filler words like "um" or "like".',
          'Frame your project stories with clear metrics (e.g., "improved performance by 25%").',
          'Practice speaking at a rhythmic pace of 120-140 words per minute.'
        ]
      },
      source: 'fallback'
    });
  }

  try {
    const prompt = `You are a personalized AI Interview & Confidence Coach.
User: ${userProfile?.name || 'Student'}
Target Role: ${userProfile?.targetRole || 'Software Developer'}
Recent Interview Count: ${recentInterviews?.length || 0}

Generate tailored coaching guidance in raw JSON with this format:
{
  "summary": "2-3 motivational coaching sentences summarizing recent growth",
  "strengths": ["string", "string"],
  "focusAreas": ["string", "string"],
  "recommendedDifficulty": "Beginner" | "Intermediate" | "Advanced",
  "tips": ["string", "string", "string"]
}
Do not wrap in markdown. Return raw JSON.`;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    const cleanText = (response.text || '').replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanText);
    return res.json({ coaching: parsed, source: 'gemini' });
  } catch (err) {
    return res.json({
      coaching: {
        summary: `Great job staying consistent with your interview practice! Build answer structure using the STAR technique to reach the next tier.`,
        strengths: ['Great enthusiasm', 'Clear domain terminology'],
        focusAreas: ['Filler word reduction', 'STAR framework adoption'],
        recommendedDifficulty: 'Intermediate',
        tips: [
          'Pause briefly before speaking to organize your thoughts.',
          'Quantify your achievements with numbers whenever possible.',
          'Keep your answer delivery around 1 to 2 minutes.'
        ]
      },
      source: 'fallback'
    });
  }
});

// Route: Real-time Live Conversational Dialogue
app.post('/api/ai/live-converse', async (req, res) => {
  const { messages, jobRole, interviewType, currentQuestion, candidateSpokenText } = req.body;

  const client = getGenAIClient();
  if (!client) {
    return res.json({
      aiResponse: `Thank you for sharing that. Your thoughts regarding "${currentQuestion || 'the topic'}" give a good overview. Let's build on that as we move forward.`,
      source: 'fallback'
    });
  }

  try {
    const prompt = `You are a professional, empathetic senior hiring manager and interviewer conducting a live video interview for a ${jobRole || 'Software Engineer'} candidate.
Interview Type: ${interviewType || 'Technical and Behavioral'}
Current Topic / Question Asked: "${currentQuestion || ''}"
Candidate Spoken Response: "${candidateSpokenText || ''}"

Conversation history context:
${JSON.stringify(messages || [])}

Respond naturally as the live interviewer in 1 to 2 spoken sentences.
Acknowledge what the candidate just said with professional warmth, provide a quick conversational nod or follow-up comment, and keep the interview momentum active.
Keep it natural, conversational, and suitable for Text-to-Speech audio readout.
Do NOT use markdown, emojis, asterisks, bullet points, or list numbers. Return plain spoken English text.`;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    const text = (response.text || '').replace(/[*_#`]/g, '').trim();
    return res.json({
      aiResponse: text || "Thank you for explaining that. That gives me great context on your approach.",
      source: 'gemini'
    });
  } catch (err) {
    console.error('Gemini Live converse error:', err);
    return res.json({
      aiResponse: "Understood. That is a clear explanation. Let's proceed to the next step of our interview.",
      source: 'fallback'
    });
  }
});

// Route: Parse Resume & Analyze Interview Preparation
app.post('/api/ai/parse-resume-and-prep', async (req, res) => {
  const { resumeText, fileName, linkedInUrl, gitHubUrl, portfolioUrl, additionalInfo, jobDescription } = req.body;

  const client = getGenAIClient();
  if (!client) {
    // High quality local fallback parsing
    const commonSkills = ['React', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'SQL', 'Git', 'REST APIs', 'AWS', 'Docker', 'Tailwind CSS'];
    const textLower = (resumeText || '' + ' ' + additionalInfo || '').toLowerCase();
    const detected = commonSkills.filter(s => textLower.includes(s.toLowerCase()));
    if (detected.length === 0) detected.push('JavaScript', 'React', 'Problem Solving', 'Data Structures');

    return res.json({
      success: true,
      analysis: {
        matchPercentage: jobDescription ? 82 : 88,
        skillsIdentified: detected,
        missingSkills: jobDescription ? ['System Architecture', 'CI/CD Pipelines', 'Performance Profiling'] : ['Advanced Microservices', 'Distributed Systems'],
        suggestedFocusAreas: [
          'Highlight concrete project impact with quantitative metrics (e.g. % performance increase)',
          'Be prepared to answer deep questions on technical architecture and debugging',
          'Practice STAR method storytelling for teamwork challenges'
        ],
        customizedQuestions: [
          `Walk me through how you implemented core features in your recent projects mentioned in your resume.`,
          `Given the requirements in the target job description, how would you design a scalable system using your skills in ${detected.slice(0, 2).join(' and ')}?`,
          `Tell me about a time you encountered a critical bug or bottleneck and how you systematically diagnosed it.`,
          `How do you stay updated with modern development standards and collaborate across engineering teams?`
        ],
        evaluatedAt: new Date().toISOString()
      },
      parsedSummary: {
        candidateName: 'Candidate',
        extractedSkills: detected,
        experienceLevel: 'Intermediate (2-4 years equivalent)',
        detectedProjects: ['Full-Stack Web Application', 'API Integration & State Management'],
        education: 'Computer Science / Engineering'
      },
      source: 'fallback'
    });
  }

  try {
    const prompt = `You are an expert AI Technical Recruiter and Career Coach. 
Analyze the candidate's interview preparation profile:

Resume File: ${fileName || 'Resume.pdf'}
Resume Content / Raw Extract:
"""
${resumeText || 'Candidate with background in software development and computing.'}
"""

Candidate Additional Info:
"""
${additionalInfo || 'None provided'}
"""

Target Job Description:
"""
${jobDescription || 'Software Engineering / Technical Role'}
"""

Professional Links:
LinkedIn: ${linkedInUrl || 'N/A'}
GitHub: ${gitHubUrl || 'N/A'}
Portfolio: ${portfolioUrl || 'N/A'}

Provide a comprehensive, high-value analysis in raw JSON with exact schema:
{
  "parsedSummary": {
    "candidateName": "Candidate Name or inferred",
    "extractedSkills": ["Skill 1", "Skill 2", ...],
    "experienceLevel": "Entry / Mid-level / Senior",
    "detectedProjects": ["Project 1", "Project 2"],
    "education": "Education background"
  },
  "analysis": {
    "matchPercentage": 85,
    "skillsIdentified": ["Skill 1", "Skill 2", ...],
    "missingSkills": ["Skill to learn/highlight 1", ...],
    "suggestedFocusAreas": ["Focus area 1", "Focus area 2", "Focus area 3"],
    "customizedQuestions": [
      "Custom question 1 tailored specifically to their resume and the JD",
      "Custom question 2 tailored to their projects",
      "Custom question 3 targeting technical depth",
      "Custom question 4 on behavioral/situational problem"
    ],
    "evaluatedAt": "${new Date().toISOString()}"
  }
}
Return ONLY pure JSON. No markdown formatting (\`\`\`json).`;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    let raw = (response.text || '').trim();
    raw = raw.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(raw);

    return res.json({
      success: true,
      analysis: parsed.analysis,
      parsedSummary: parsed.parsedSummary,
      source: 'gemini'
    });
  } catch (err) {
    console.error('Failed to parse resume with Gemini:', err);
    return res.json({
      success: true,
      analysis: {
        matchPercentage: 80,
        skillsIdentified: ['Problem Solving', 'Software Engineering', 'Full-Stack Development', 'Git'],
        missingSkills: ['System Design at Scale', 'Cloud Infrastructure'],
        suggestedFocusAreas: [
          'Elaborate on individual contributions to complex projects',
          'Practice explaining architectural trade-offs under pressure'
        ],
        customizedQuestions: [
          'Explain the architecture of the most challenging project on your resume.',
          'How do you manage state and data flow across complex frontend and backend components?'
        ],
        evaluatedAt: new Date().toISOString()
      },
      parsedSummary: {
        candidateName: 'Candidate',
        extractedSkills: ['TypeScript', 'JavaScript', 'React', 'Node.js'],
        experienceLevel: 'Mid-Level',
        detectedProjects: ['Web Application Development'],
        education: 'Computer Science'
      },
      source: 'fallback'
    });
  }
});

// Route: Generate Dynamic Programming Mock Test (MCQ)
app.post('/api/ai/generate-mock-test', async (req, res) => {
  const { language, difficulty, questionCount, topic, customContext } = req.body;
  const targetLanguage = language || 'JavaScript';
  const targetDiff = difficulty || 'Intermediate';
  const count = Number(questionCount) || 5;
  const cleanTopic = topic && typeof topic === 'string' ? topic.trim() : '';

  const client = getGenAIClient();
  if (!client) {
    return res.json({
      success: true,
      questions: [],
      source: 'fallback'
    });
  }

  try {
    const topicConstraint = cleanTopic ? `
*** CRITICAL REQUIREMENT: EXCLUSIVE TOPIC FOCUS ON "${cleanTopic}" ***
The user has explicitly chosen the topic: "${cleanTopic}".
1. EVERY SINGLE ONE of the ${count} questions MUST BE 100% EXCLUSIVELY and SPECIFICALLY about "${cleanTopic}" in the context of ${targetLanguage}.
2. DO NOT output generic or unrelated ${targetLanguage} questions. Every question must directly test "${cleanTopic}".
3. Sequence the questions strictly in progressive difficulty from Easy to Hard:
   - Early questions: Fundamental definition, core syntax, simple concept mechanics of "${cleanTopic}".
   - Middle questions: Common edge cases, error handling, practical usage gotchas, and pitfalls of "${cleanTopic}".
   - Late questions: Deep architectural nuances, memory footprint, performance profiling, concurrency, or advanced design trade-offs of "${cleanTopic}".
4. In each question JSON object, set the "topic" field to "${cleanTopic}".
` : `
Provide a diverse set of high-yield questions covering different core pillars and foundational-to-advanced areas across ${targetLanguage}.
`;

    const prompt = `You are a Principal Software Engineer and Technical Interviewer specializing in ${targetLanguage}.
Generate exactly ${count} realistic, challenging Multiple Choice Questions (MCQs) for an objective Programming Mock Test.

Language / Domain: ${targetLanguage}
Difficulty Range: ${targetDiff}
${cleanTopic ? `Targeted Focus Topic: "${cleanTopic}"` : 'Targeted Focus Topic: General Core Curriculum'}
${customContext ? `Candidate Resume / Skill Context: ${customContext}` : ''}

${topicConstraint}

*** MANDATORY REQUIREMENT: PROGRESSIVE DIFFICULTY SEQUENCE (FROM EASY TO HARD) ***
You MUST strictly sequence all ${count} questions in ascending order of difficulty from EASIEST to HARDEST:
1. First 30-35% of questions (e.g. Q1 to Q${Math.max(1, Math.round(count * 0.35))}): EASY / BEGINNER level. Focus on fundamental syntax, basic definitions, direct expressions, and foundational language concepts. Set "difficulty": "Beginner".
2. Middle 35-40% of questions: MEDIUM / INTERMEDIATE level. Focus on practical functions, common edge cases, scope, asynchronous flow, collections, and standard design idioms. Set "difficulty": "Intermediate".
3. Final 30-35% of questions: HARD / ADVANCED level. Focus on complex code execution tracing, concurrency, memory layout, subtle compiler/runtime gotchas, and advanced optimization trade-offs. Set "difficulty": "Advanced".

General Guidelines:
1. Every question must test real-world depth, syntax nuance, memory/performance mechanics, algorithmic complexity, or common design gotchas.
2. Provide a clean, relevant \`codeSnippet\` for at least 60% of the questions.
3. Provide exactly 4 distinct, realistic options (index 0, 1, 2, 3).
4. Specify \`correctAnswerIndex\` (0, 1, 2, or 3).
5. Provide a thorough \`explanation\` detailing why the correct answer is right and the underlying mechanism.
6. Provide \`detailedOptionExplanations\` (array of exactly 4 strings) explaining specifically why each option (0, 1, 2, 3) is correct or incorrect.
7. Provide an array of 2-4 subtopic \`tags\` related to ${cleanTopic || targetLanguage}.

Output MUST be a valid JSON array of objects with the exact schema:
[
  {
    "id": "q1",
    "language": "${targetLanguage}",
    "topic": "${cleanTopic || 'Core Concepts'}",
    "difficulty": "Beginner",
    "questionText": "Question text here...",
    "codeSnippet": "// optional code snippet",
    "options": [
      "Option 1",
      "Option 2",
      "Option 3",
      "Option 4"
    ],
    "correctAnswerIndex": 1,
    "explanation": "Clear explanation of the correct mechanism...",
    "detailedOptionExplanations": [
      "Why option 0 is incorrect...",
      "Why option 1 is correct...",
      "Why option 2 is incorrect...",
      "Why option 3 is incorrect..."
    ],
    "tags": ["Tag1", "Tag2"]
  }
]
Return ONLY pure JSON. No markdown code blocks (\`\`\`json).`;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    let raw = (response.text || '').trim();
    raw = raw.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
    const questions = JSON.parse(raw);

    return res.json({
      success: true,
      questions: Array.isArray(questions) ? questions : [],
      source: 'gemini'
    });
  } catch (err) {
    console.error('Failed to generate mock test via Gemini:', err);
    return res.json({
      success: false,
      questions: [],
      error: 'Failed to generate dynamic test'
    });
  }
});

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Vite middleware for Dev vs Production static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
