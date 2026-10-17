import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import type { DecisionData, CollaborativeRoom, ParticipantVote, ProConItem } from './src/types/decision.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper for calling Gemini with model fallback and retries on 503
async function generateContentWithFallback(params: {
  contents: any;
  config?: any;
}): Promise<any> {
  const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        ...params,
        model,
      });
      return response;
    } catch (err: any) {
      lastError = err;
      const isTransient =
        err?.message?.includes('503') ||
        err?.message?.includes('429') ||
        err?.message?.includes('UNAVAILABLE') ||
        err?.message?.includes('high demand');
      if (isTransient) {
        console.warn(`Model ${model} returned 503/transient, trying alternative model...`);
        await new Promise((r) => setTimeout(r, 600));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

// In-Memory store for collaborative rooms (can persist during process lifecycle)
const rooms = new Map<string, CollaborativeRoom>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Decision schema for structured Gemini generation
const decisionResponseSchema = {
  type: Type.OBJECT,
  properties: {
    options: {
      type: Type.ARRAY,
      description: "List of the 2-4 primary decision options evaluated.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "Unique slug identifier like 'option_a' or 'option_b'" },
          title: { type: Type.STRING, description: "Option name" },
          description: { type: Type.STRING, description: "Brief 1-2 sentence essence of this option" },
        },
        required: ["id", "title", "description"],
      },
    },
    analyses: {
      type: Type.ARRAY,
      description: "In-depth breakdown for each option including pros, cons, and SWOT.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          summary: { type: Type.STRING, description: "Summary evaluation of this option" },
          netScore: { type: Type.NUMBER, description: "Overall quantified net score from -10 to +10" },
          pros: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                type: { type: Type.STRING, description: "pro" },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                score: { type: Type.NUMBER, description: "Weight score from 1 to 5" },
                category: { type: Type.STRING, description: "e.g., Financial, Time, Wellbeing, Career, Risk, Long-term" },
                isUnderrated: { type: Type.BOOLEAN, description: "True if this is an overlooked positive" },
              },
              required: ["id", "type", "title", "description", "score", "category"],
            },
          },
          cons: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                type: { type: Type.STRING, description: "con" },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                score: { type: Type.NUMBER, description: "Impact weight from 1 to 5" },
                category: { type: Type.STRING, description: "e.g., Financial, Stress, Opportunity Cost, Uncertainty, Effort" },
                isDealbreaker: { type: Type.BOOLEAN, description: "True if this could be an unacceptable dealbreaker" },
              },
              required: ["id", "type", "title", "description", "score", "category"],
            },
          },
          swot: {
            type: Type.OBJECT,
            properties: {
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
              opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
              threats: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["strengths", "weaknesses", "opportunities", "threats"],
          },
        },
        required: ["id", "title", "summary", "pros", "cons", "swot", "netScore"],
      },
    },
    criteriaMatrix: {
      type: Type.ARRAY,
      description: "Comparison matrix across 5-7 key standard and situational criteria.",
      items: {
        type: Type.OBJECT,
        properties: {
          criteriaName: { type: Type.STRING },
          description: { type: Type.STRING },
          weight: { type: Type.NUMBER, description: "Importance weight from 1 to 5" },
          scores: {
            type: Type.OBJECT,
            description: "Map of optionId to score out of 10",
            properties: {
              opt_1: { type: Type.NUMBER },
              opt_2: { type: Type.NUMBER },
              opt_3: { type: Type.NUMBER },
              opt_4: { type: Type.NUMBER },
            },
          },
        },
        required: ["criteriaName", "description", "weight"],
      },
    },
    tiebreakerVerdict: {
      type: Type.OBJECT,
      description: "Definitive AI tiebreaker verdict and recommendation.",
      properties: {
        winnerOptionId: { type: Type.STRING },
        winnerTitle: { type: Type.STRING },
        confidenceScore: { type: Type.NUMBER, description: "Confidence percentage (e.g. 78)" },
        oneLineVerdict: { type: Type.STRING, description: "Punchy, unambiguous verdict" },
        executiveSummary: { type: Type.STRING, description: "Clear rationale explaining why this option edges out the other" },
        decisionRule: {
          type: Type.OBJECT,
          properties: {
            chooseWinnerIf: { type: Type.STRING, description: "e.g. Choose Option A if your primary priority is freedom & growth..." },
            chooseAlternativeIf: { type: Type.STRING, description: "e.g. Choose Option B if immediate stability and predictability outweigh..." },
          },
          required: ["chooseWinnerIf", "chooseAlternativeIf"],
        },
        blindSpots: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "2-3 overlooked factors or unstated assumptions",
        },
        cognitiveBiasesToWatch: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Biases that might skew this decision, e.g., Sunk Cost Fallacy, Loss Aversion, Status Quo Bias",
        },
        immediateNextStep: { type: Type.STRING, description: "Actionable concrete experiment or step within 24-48 hours" },
      },
      required: [
        "winnerOptionId",
        "winnerTitle",
        "confidenceScore",
        "oneLineVerdict",
        "executiveSummary",
        "decisionRule",
        "blindSpots",
        "cognitiveBiasesToWatch",
        "immediateNextStep",
      ],
    },
  },
  required: ["options", "analyses", "criteriaMatrix", "tiebreakerVerdict"],
};

// API: Analyze Decision
app.post('/api/decision/analyze', async (req, res) => {
  try {
    const { dilemma, options, criteria, context, perspective } = req.body;

    if (!dilemma || typeof dilemma !== 'string' || dilemma.trim().length === 0) {
      return res.status(400).json({ error: 'A dilemma or decision question is required.' });
    }

    const prompt = `
You are "The Tiebreaker", an elite rational decision strategist, executive coach, and multi-criteria analyst.
Analyze the following decision dilemma with deep insight, rigorous logic, and zero fluff.

DILEMMA:
"${dilemma}"

${options && options.length > 0 ? `SPECIFIED OPTIONS TO COMPARE:\n${options.map((opt: string, idx: number) => `Option ${idx + 1}: ${opt}`).join('\n')}` : 'No specific options provided. Please formulate the 2 or 3 most sensible, distinct, and realistic options to compare.'}

${context ? `ADDITIONAL CONTEXT & CONSTRAINTS:\n${context}` : ''}
${criteria ? `KEY PRIORITIES OR CRITERIA HIGHLIGHTED BY USER:\n${criteria}` : ''}
${perspective ? `ANALYSIS LENS: ${perspective}` : ''}

INSTRUCTIONS:
1. Provide a comprehensive, nuanced breakdown for each option.
2. In the Pros and Cons, identify realistic nuances: note whether items are "underrated perks" or "potential dealbreakers". Assign quantified impact scores (1-5).
3. In the Comparison Matrix, evaluate options against 5 to 7 concrete criteria (such as Financial Cost/Return, Execution Speed/Effort, Risk & Downside Exposure, Long-term Strategic Value, Quality of Life/Stress, Flexibility/Optionality). Score each option from 1 to 10 for each criteria. Ensure the keys in 'scores' match the option IDs exactly!
4. In the SWOT Analysis, provide 3-4 razor-sharp points for Strengths, Weaknesses, Opportunities, and Threats for each option.
5. In the Tiebreaker Verdict: deliver a clear, actionable ruling with confidence score, a conditional "decision rule" ("Choose Option A IF... but Choose Option B IF..."), hidden blind-spots, cognitive biases to watch out for, and the immediate 24-hour test/step.
`;

    const response = await generateContentWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: decisionResponseSchema,
        temperature: 0.7,
      },
    });

    const rawText = response.text;
    if (!rawText) {
      throw new Error('Gemini returned an empty response.');
    }

    const parsed = JSON.parse(rawText);

    // Normalize option IDs across matrix scores if necessary
    const optionIds = parsed.options.map((o: any) => o.id);
    if (parsed.criteriaMatrix && Array.isArray(parsed.criteriaMatrix)) {
      parsed.criteriaMatrix = parsed.criteriaMatrix.map((crit: any) => {
        const scores: Record<string, number> = {};
        optionIds.forEach((id: string, idx: number) => {
          if (crit.scores && crit.scores[id] !== undefined) {
            scores[id] = crit.scores[id];
          } else if (crit.scores && crit.scores[`opt_${idx + 1}`] !== undefined) {
            scores[id] = crit.scores[`opt_${idx + 1}`];
          } else {
            // Default reasonable score fallback
            scores[id] = Math.floor(Math.random() * 4) + 6;
          }
        });
        return {
          ...crit,
          scores,
        };
      });
    }

    const decisionData: DecisionData = {
      id: 'dec_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      dilemma,
      context,
      createdAt: Date.now(),
      options: parsed.options,
      analyses: parsed.analyses,
      criteriaMatrix: parsed.criteriaMatrix,
      tiebreakerVerdict: parsed.tiebreakerVerdict,
    };

    res.json(decisionData);
  } catch (error: any) {
    console.error('Error analyzing decision:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze decision.' });
  }
});

// API: Devil's Advocate Stress Test
app.post('/api/decision/devils-advocate', async (req, res) => {
  try {
    const { dilemma, optionTitle, allOptions, context } = req.body;

    const prompt = `
You are a sharp, skeptical Devil's Advocate.
The user is leaning heavily toward choosing: "${optionTitle}" for the decision: "${dilemma}".
Other options being considered: ${Array.isArray(allOptions) ? allOptions.join(', ') : 'None specified'}.
${context ? `Context: ${context}` : ''}

Provide a fierce but constructive stress-test of "${optionTitle}":
1. The "Worst Case Nightmare" scenario that people usually overlook.
2. The 2 biggest hidden costs or unseen sacrifices.
3. The "Pre-Mortem": Assume it's 18 months from now and this choice turned out to be a disaster. What went wrong?
4. A stress-test question the decider must honestly answer before pulling the trigger.

Keep the tone intellectual, candid, and constructive (under 300 words).
`;

    const response = await generateContentWithFallback({
      contents: prompt,
    });

    res.json({ critique: response.text });
  } catch (error: any) {
    console.error('Error running devil advocate:', error);
    res.status(500).json({ error: error.message || 'Failed to run devil advocate test.' });
  }
});

// API: Suggest Options for a Dilemma
app.post('/api/decision/suggest-options', async (req, res) => {
  try {
    const { dilemma, context } = req.body;

    const prompt = `
For the dilemma: "${dilemma}"
${context ? `Context: ${context}` : ''}

Generate 3 compelling, distinct, mutually exclusive strategic options that someone facing this dilemma should evaluate.
Respond with pure JSON array of strings:
["Option 1 label", "Option 2 label", "Option 3 label"]
`;

    const response = await generateContentWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
    });

    const parsed = JSON.parse(response.text || '[]');
    res.json({ suggestions: parsed });
  } catch (error: any) {
    console.error('Error suggesting options:', error);
    res.status(500).json({ error: error.message || 'Failed to suggest options.' });
  }
});

// Collaborative Room APIs
app.post('/api/rooms', (req, res) => {
  const { decisionData, hostName, title } = req.body;
  if (!decisionData) {
    return res.status(400).json({ error: 'decisionData is required.' });
  }

  const id = 'room_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  const code = generateRoomCode();

  const newRoom: CollaborativeRoom = {
    id,
    code,
    title: title || decisionData.dilemma || 'Decision Vote',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    hostName: hostName || 'Organizer',
    decisionData,
    votes: [],
    status: 'active',
    customArguments: [],
  };

  rooms.set(id, newRoom);
  rooms.set(code, newRoom); // allow lookup by 6-char code as well

  res.json(newRoom);
});

app.get('/api/rooms/:idOrCode', (req, res) => {
  const key = req.params.idOrCode.toUpperCase();
  const room = rooms.get(req.params.idOrCode) || rooms.get(key);
  if (!room) {
    return res.status(404).json({ error: 'Room not found. Check the code and try again.' });
  }
  res.json(room);
});

app.post('/api/rooms/:idOrCode/vote', (req, res) => {
  const key = req.params.idOrCode.toUpperCase();
  const room = rooms.get(req.params.idOrCode) || rooms.get(key);
  if (!room) {
    return res.status(404).json({ error: 'Room not found.' });
  }

  const { participantId, participantName, mode, ranking, points, approval, comment } = req.body;
  if (!participantName) {
    return res.status(400).json({ error: 'Participant name is required.' });
  }

  const vote: ParticipantVote = {
    participantId: participantId || 'user_' + Math.random().toString(36).substring(2, 9),
    participantName,
    votedAt: Date.now(),
    mode: mode || 'points',
    ranking,
    points,
    approval,
    comment,
  };

  // Replace existing vote if same participantId or append
  const existingIdx = room.votes.findIndex((v) => v.participantId === vote.participantId);
  if (existingIdx >= 0) {
    room.votes[existingIdx] = vote;
  } else {
    room.votes.push(vote);
  }
  room.updatedAt = Date.now();

  res.json({ success: true, room });
});

app.post('/api/rooms/:idOrCode/arguments', (req, res) => {
  const key = req.params.idOrCode.toUpperCase();
  const room = rooms.get(req.params.idOrCode) || rooms.get(key);
  if (!room) {
    return res.status(404).json({ error: 'Room not found.' });
  }

  const { type, title, description, score, category, author, targetOptionId } = req.body;
  const newArg: ProConItem = {
    id: 'arg_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
    type: type === 'con' ? 'con' : 'pro',
    title: title || 'Group argument',
    description: description || '',
    score: score || 3,
    category: category || 'Team Feedback',
    author: author || 'Anonymous',
    upvotes: 1,
  };

  room.customArguments.push(newArg);

  // If a target option analysis exists, also push to that option's list
  if (targetOptionId) {
    const analysis = room.decisionData.analyses.find((a) => a.id === targetOptionId);
    if (analysis) {
      if (newArg.type === 'pro') {
        analysis.pros.push(newArg);
      } else {
        analysis.cons.push(newArg);
      }
    }
  }

  room.updatedAt = Date.now();
  res.json({ success: true, argument: newArg, room });
});

app.post('/api/rooms/:idOrCode/upvote-argument', (req, res) => {
  const key = req.params.idOrCode.toUpperCase();
  const room = rooms.get(req.params.idOrCode) || rooms.get(key);
  if (!room) {
    return res.status(404).json({ error: 'Room not found.' });
  }

  const { argumentId } = req.body;
  const target = room.customArguments.find((a) => a.id === argumentId);
  if (target) {
    target.upvotes = (target.upvotes || 0) + 1;
  }
  room.updatedAt = Date.now();
  res.json({ success: true, room });
});

// AI Tiebreaker Verdict for Group Voting Deadlock
app.post('/api/rooms/:idOrCode/ai-tiebreak', async (req, res) => {
  const key = req.params.idOrCode.toUpperCase();
  const room = rooms.get(req.params.idOrCode) || rooms.get(key);
  if (!room) {
    return res.status(404).json({ error: 'Room not found.' });
  }

  try {
    const options = room.decisionData.options;
    const votes = room.votes;
    const args = room.customArguments;

    const prompt = `
You are the Ultimate AI Tiebreaker referee summoned to break a group decision deadlock!
Dilemma: "${room.decisionData.dilemma}"

Options being voted on:
${options.map((o) => `- [${o.id}] ${o.title}: ${o.description}`).join('\n')}

Group votes cast (${votes.length} participants):
${votes
  .map(
    (v) =>
      `* ${v.participantName} (${v.mode}): ${
        v.points
          ? JSON.stringify(v.points)
          : v.ranking
          ? v.ranking.join(' > ')
          : JSON.stringify(v.approval)
      } ${v.comment ? `(Comment: "${v.comment}")` : ''}`
  )
  .join('\n')}

User-submitted arguments during session:
${args.map((a) => `[${a.type.toUpperCase()}] "${a.title}": ${a.description} (Upvotes: ${a.upvotes || 1})`).join('\n')}

YOUR TASK:
Break this deadlock authoritatively. Evaluate the tension points, identify why the team is divided, and provide:
1. "verdict": The winning choice that best balances collective priorities.
2. "rationale": Clear, persuasive reasoning that acknowledges both sides and explains why this outcome wins.
3. "compromiseSolution": A synthesis or hybrid plan that borrows the best safeguard from the losing option to appease the minority.

Respond in JSON format:
{
  "verdict": "Clear winner option title",
  "rationale": "...",
  "compromiseSolution": "..."
}
`;

    const response = await generateContentWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    room.tiebreakerResult = {
      resolvedAt: Date.now(),
      verdict: parsed.verdict || 'Balanced Verdict',
      rationale: parsed.rationale || 'Decision resolved by AI synthesis.',
      compromiseSolution: parsed.compromiseSolution,
    };
    room.updatedAt = Date.now();

    res.json({ success: true, tiebreakerResult: room.tiebreakerResult, room });
  } catch (err: any) {
    console.error('Error running group tiebreak:', err);
    res.status(500).json({ error: err.message || 'Failed to break deadlock.' });
  }
});

// Configure Vite in development or static serving in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`The Tiebreaker server running on http://localhost:${PORT}`);
  });
}

startServer();
