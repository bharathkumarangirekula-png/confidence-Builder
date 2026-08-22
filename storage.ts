import { InterviewSession, UserProfile } from '../types';

const USERS_KEY = 'ai_interview_users';
const CURRENT_USER_KEY = 'ai_interview_current_user';
const SESSIONS_KEY = 'ai_interview_sessions';

export const DEMO_USER: UserProfile = {
  id: 'demo-user-123',
  name: 'Alex Morgan',
  email: 'alex.morgan@university.edu',
  targetRole: 'Software Developer',
  targetDifficulty: 'Intermediate',
  createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
};

export const INITIAL_DEMO_INTERVIEWS: InterviewSession[] = [
  {
    id: 'demo-session-1',
    userId: 'demo-user-123',
    config: {
      jobRole: 'Software Developer',
      interviewType: 'Behavioral Interview',
      difficulty: 'Beginner',
      questionCount: 5
    },
    status: 'completed',
    currentQuestionIndex: 4,
    overallScore: 64,
    categoryScores: {
      answerQuality: 65,
      relevance: 70,
      clarity: 62,
      communication: 60,
      structure: 58,
      confidence: 68
    },
    summaryStats: {
      totalQuestions: 5,
      questionsAnswered: 5,
      averageResponseTimeSeconds: 48,
      totalFillerWords: 14,
      mostCommonFillers: ['like', 'um', 'basically'],
      strongestCategory: 'Relevance',
      needsImprovementCategory: 'Structure'
    },
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(),
    questions: [
      {
        id: 'q1',
        questionText: 'Tell me about yourself and why you chose Software Engineering.',
        category: 'Introduction',
        userAnswer: 'I am a computer science student with a passion for web development. I have built several projects using React and Node.js. Um, I really like solving algorithmic problems and working in teams.',
        metrics: {
          durationSeconds: 42,
          wordCount: 38,
          wordsPerMinute: 54,
          fillerWordCount: 3,
          fillerWordsFound: ['um', 'like'],
          repeatedWordsCount: 1,
          longPausesDetected: 1
        },
        analysis: {
          relevanceScore: 78,
          clarityScore: 72,
          structureScore: 60,
          completenessScore: 65,
          communicationScore: 68,
          confidenceScore: 70,
          confidenceLabel: 'Good',
          overallScore: 68,
          feedback: 'Solid introductory response that highlights core technical skills, though structured framing can be expanded.',
          strengths: ['Clear enthusiasm for software engineering', 'Mentioned modern web technologies'],
          improvements: ['Elaborate on a specific project win', 'Reduce filler word usage ("um", "like")'],
          suggestedSTAR: {
            situation: 'As a final year CS student, I spearheaded web development projects.',
            action: 'Engineered full-stack applications using React and Node.js.',
            result: 'Built 3 deployed apps and collaborated with peer developer teams.'
          },
          practiceTip: 'Take a 2-second breath before starting your response to reduce initial hesitation.'
        }
      },
      {
        id: 'q2',
        questionText: 'Describe a challenging project you worked on and how you handled difficulties.',
        category: 'Problem Solving',
        userAnswer: 'In my database project, we ran into big performance issues when handling large queries. Basically, like, I refactored the SQL queries and added indexing which speeded it up by 40%.',
        metrics: {
          durationSeconds: 52,
          wordCount: 36,
          wordsPerMinute: 41,
          fillerWordCount: 4,
          fillerWordsFound: ['basically', 'like'],
          repeatedWordsCount: 0,
          longPausesDetected: 2
        },
        analysis: {
          relevanceScore: 82,
          clarityScore: 65,
          structureScore: 60,
          completenessScore: 58,
          communicationScore: 60,
          confidenceScore: 65,
          confidenceLabel: 'Good',
          overallScore: 65,
          feedback: 'Good technical resolution example, but lacks initial context on the project constraints.',
          strengths: ['Quantified performance improvement (40%)', 'Demonstrated database expertise'],
          improvements: ['Structure with clear Situation -> Action -> Result', 'Speak at a steady pace of ~120 WPM'],
          suggestedSTAR: {
            situation: 'During our database capstone project, high query latency bottlenecked throughput.',
            action: 'I profiled memory logs, optimized index execution paths, and refactored queries.',
            result: 'Reduced query latency by 40% and enabled seamless multi-user testing.'
          },
          practiceTip: 'Use transition phrases like "Specifically, my contribution was..." to highlight ownership.'
        }
      }
    ]
  },
  {
    id: 'demo-session-2',
    userId: 'demo-user-123',
    config: {
      jobRole: 'Software Developer',
      interviewType: 'Technical Interview',
      difficulty: 'Intermediate',
      questionCount: 5
    },
    status: 'completed',
    currentQuestionIndex: 4,
    overallScore: 72,
    categoryScores: {
      answerQuality: 74,
      relevance: 78,
      clarity: 70,
      communication: 68,
      structure: 72,
      confidence: 71
    },
    summaryStats: {
      totalQuestions: 5,
      questionsAnswered: 5,
      averageResponseTimeSeconds: 55,
      totalFillerWords: 9,
      mostCommonFillers: ['you know', 'so'],
      strongestCategory: 'Relevance',
      needsImprovementCategory: 'Communication'
    },
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 20 * 60 * 1000).toISOString(),
    questions: []
  },
  {
    id: 'demo-session-3',
    userId: 'demo-user-123',
    config: {
      jobRole: 'Software Developer',
      interviewType: 'Behavioral Interview',
      difficulty: 'Intermediate',
      questionCount: 5
    },
    status: 'completed',
    currentQuestionIndex: 4,
    overallScore: 81,
    categoryScores: {
      answerQuality: 82,
      relevance: 85,
      clarity: 80,
      communication: 79,
      structure: 80,
      confidence: 80
    },
    summaryStats: {
      totalQuestions: 5,
      questionsAnswered: 5,
      averageResponseTimeSeconds: 62,
      totalFillerWords: 5,
      mostCommonFillers: ['actually'],
      strongestCategory: 'Relevance',
      needsImprovementCategory: 'Confidence'
    },
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 22 * 60 * 1000).toISOString(),
    questions: []
  }
];

export function getStoredUser(): UserProfile | null {
  try {
    const data = localStorage.getItem(CURRENT_USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function saveStoredUser(user: UserProfile | null): void {
  try {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  } catch (e) {
    console.error('Failed to save user in local storage', e);
  }
}

export function getStoredSessions(userId: string): InterviewSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    const sessions: InterviewSession[] = raw ? JSON.parse(raw) : [];
    
    // Seed demo sessions if user is demo user and no sessions exist
    if (userId === DEMO_USER.id) {
      const userSessions = sessions.filter((s) => s.userId === userId);
      if (userSessions.length === 0) {
        saveStoredSessions([...sessions, ...INITIAL_DEMO_INTERVIEWS]);
        return INITIAL_DEMO_INTERVIEWS;
      }
      return userSessions;
    }

    return sessions.filter((s) => s.userId === userId);
  } catch {
    return userId === DEMO_USER.id ? INITIAL_DEMO_INTERVIEWS : [];
  }
}

export function saveStoredSessions(allSessions: InterviewSession[]): void {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(allSessions));
  } catch (e) {
    console.error('Failed to save sessions in local storage', e);
  }
}

export function saveSingleSession(session: InterviewSession): void {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    const existing: InterviewSession[] = raw ? JSON.parse(raw) : [];
    const idx = existing.findIndex((s) => s.id === session.id);
    if (idx >= 0) {
      existing[idx] = session;
    } else {
      existing.unshift(session);
    }
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error('Failed to save single session', e);
  }
}

// === Preparation Profile Storage ===
const PREPARATION_KEY = 'ai_interview_prep_profile';

export function getStoredPreparation(userId: string) {
  try {
    const raw = localStorage.getItem(`${PREPARATION_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStoredPreparation(userId: string, data: any): void {
  try {
    localStorage.setItem(`${PREPARATION_KEY}_${userId}`, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save preparation data', e);
  }
}

// === Programming Mock Test Storage ===
const MOCK_TESTS_KEY = 'ai_programming_mock_tests';

export function getStoredMockTests(userId: string) {
  try {
    const raw = localStorage.getItem(`${MOCK_TESTS_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSingleMockTest(userId: string, testResult: any): void {
  try {
    const raw = localStorage.getItem(`${MOCK_TESTS_KEY}_${userId}`);
    const existing = raw ? JSON.parse(raw) : [];
    existing.unshift(testResult);
    localStorage.setItem(`${MOCK_TESTS_KEY}_${userId}`, JSON.stringify(existing));
  } catch (e) {
    console.error('Failed to save mock test result', e);
  }
}

