// ─── AI Helper — Claude API fetch utilities ───────────────────────

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL   = 'claude-opus-4-5';

// Retrieve API key from localStorage (user-configurable)
const getApiKey = () => localStorage.getItem('stadiumiq_claude_key') || '';

/**
 * Send a message to Claude and get a response.
 * @param {string} prompt - User or system prompt
 * @param {Array}  messages - Conversation history [{role, content}]
 * @param {string} systemPrompt - System prompt for context
 * @param {Function} onStream - Optional streaming callback (chunk) => void
 * @returns {Promise<string>} - Complete AI response text
 */
export async function callClaude({ prompt, messages = [], systemPrompt, onStream }) {
  const apiKey = getApiKey();

  const builtMessages = [
    ...messages,
    { role: 'user', content: prompt },
  ];

  const body = {
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system: systemPrompt || buildDefaultSystemPrompt(),
    messages: builtMessages,
    stream: !!onStream,
  };

  if (!apiKey) {
    // Return mock response if no API key configured
    return getMockResponse(prompt);
  }

  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || `HTTP ${response.status}`);
    }

    if (onStream) {
      return await handleStreamResponse(response, onStream);
    } else {
      const data = await response.json();
      return data.content?.[0]?.text || '';
    }
  } catch (error) {
    console.error('[StadiumIQ AI] Error:', error);
    return getMockResponse(prompt);
  }
}

async function handleStreamResponse(response, onStream) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

    for (const line of lines) {
      try {
        const data = JSON.parse(line.slice(6));
        if (data.type === 'content_block_delta' && data.delta?.text) {
          fullText += data.delta.text;
          onStream(data.delta.text);
        }
      } catch {
        // Skip malformed SSE lines
      }
    }
  }

  return fullText;
}

// ─── System Prompts ───────────────────────────────────────────────

export function buildDefaultSystemPrompt() {
  return `You are StadiumIQ, an AI assistant for the FIFA World Cup 2026 smart stadium management platform. 
You have expertise in crowd management, stadium operations, fan experience optimization, staff coordination, and sustainability metrics.
You provide concise, actionable insights and recommendations. Use emojis sparingly for clarity.
Current context: FIFA World Cup 2026 tournament operations.`;
}

export function buildFanSystemPrompt(stadiumName, matchInfo) {
  return `You are a friendly FIFA World Cup 2026 Fan Assistant at ${stadiumName || 'the stadium'}.
Match: ${matchInfo || 'upcoming match'}
You help fans with: seating, directions, food & beverages, services, match information, and general stadium queries.
Be warm, enthusiastic, and helpful. Keep responses under 150 words unless asked for details.`;
}

export function buildOperationsSystemPrompt(stadiumData) {
  return `You are an Operations Intelligence AI for ${stadiumData?.name || 'the stadium'} (capacity: ${stadiumData?.capacity?.toLocaleString() || 'N/A'}).
You analyze real-time crowd data, security alerts, entry/exit flows, and operational metrics.
Provide specific, numbered recommendations. Flag critical issues first. Use data-driven reasoning.`;
}

export function buildStaffSystemPrompt() {
  return `You are a Staff Coordination AI for FIFA World Cup 2026 stadium operations.
You help with staff assignments, shift planning, emergency protocols, and team communications.
Generate clear briefings, identify coverage gaps, and suggest optimal deployments.`;
}

export function buildSustainabilitySystemPrompt() {
  return `You are a Sustainability AI Advisor for the FIFA World Cup 2026 green initiative.
Analyze energy consumption, carbon footprint, waste diversion, and water usage data.
Suggest actionable improvements to achieve FIFA's net-zero targets for this tournament.`;
}

// ─── Mock Responses (offline / no API key) ────────────────────────

const MOCK_RESPONSES = {
  default: [
    '🏟️ Based on current crowd patterns, I recommend opening additional concession lanes in Concourse B to reduce wait times by approximately 40%.',
    '⚡ Energy analysis shows HVAC systems are operating at 15% above optimal efficiency. Adjusting temperature zones could save ~2.3 MWh per match.',
    '👥 Staff deployment looks optimal. Consider rotating Zone D volunteers at 17:30 to maintain peak performance for kickoff.',
    '🔒 All security perimeters are nominal. Predictive models show a 12% crowd surge expected at Gate B in approximately 22 minutes.',
    '🌱 Current waste diversion rate is 73.2% — 4.8% above tournament average. Compostable packaging swap at North concessions could push this to 80%.',
  ],
  fan: [
    '🎉 Your seat is in Section 14, Row G, Seat 22 — North Stand, great view of both goals! Head through Gate C, turn right at the concourse.',
    '🍔 The shortest food queue right now is at Concourse B Bar 2 — estimated 3-minute wait. They serve the official FIFA burger and local craft beer.',
    '📍 From your current location, your seat is about a 4-minute walk. Go up Ramp 3, follow the blue signs to North Stand.',
    '⚽ Kickoff is in 45 minutes. Gates close 10 minutes before kickoff, so you have plenty of time to grab food first!',
  ],
  operations: [
    '🚨 Alert: Gate D throughput is 105% of rated capacity. Recommend opening overflow lane and deploying 3 additional stewards immediately.',
    '📊 Crowd density is peaking in the South Stand at 94%. Historical patterns suggest a natural dispersal in 8 minutes as fans settle for kickoff.',
    '🔮 AI prediction: 78% probability of a queue surge at North concessions during halftime. Pre-positioning 2 additional staff recommended.',
  ],
};

function getMockResponse(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  let pool;

  if (lowerPrompt.includes('fan') || lowerPrompt.includes('seat') || lowerPrompt.includes('food')) {
    pool = MOCK_RESPONSES.fan;
  } else if (lowerPrompt.includes('crowd') || lowerPrompt.includes('gate') || lowerPrompt.includes('security')) {
    pool = MOCK_RESPONSES.operations;
  } else {
    pool = MOCK_RESPONSES.default;
  }

  // Add a note about API key
  const response = pool[Math.floor(Math.random() * pool.length)];
  return `${response}\n\n_[Demo mode — add your Claude API key in settings for live AI responses]_`;
}

// ─── Prompt Builders ──────────────────────────────────────────────

export function buildCrowdAnalysisPrompt(crowdData) {
  const totalOccupancy = crowdData.reduce((sum, z) => sum + z.current, 0);
  const totalCapacity  = crowdData.reduce((sum, z) => sum + z.capacity, 0);
  const hotspots = crowdData.filter(z => z.status === 'critical').map(z => z.name).join(', ');

  return `Analyze current crowd situation:
- Total occupancy: ${totalOccupancy.toLocaleString()} / ${totalCapacity.toLocaleString()} (${Math.round(totalOccupancy / totalCapacity * 100)}%)
- Critical zones: ${hotspots || 'None'}
- Zone breakdown: ${crowdData.map(z => `${z.name}: ${Math.round(z.density * 100)}%`).join(', ')}

Provide 3 specific recommendations to optimize crowd flow and safety.`;
}

export function buildSustainabilityPrompt(metrics) {
  return `Analyze sustainability performance:
- Energy: ${metrics.energy}% of target
- Carbon: ${metrics.carbon} tCO2e (${metrics.carbonDelta}% vs last match)  
- Waste diversion: ${metrics.waste}%
- Water: ${metrics.water}% of baseline

Suggest 3 achievable improvements for the next match.`;
}

export function buildStaffBriefingPrompt(staffData, matchInfo) {
  return `Generate a pre-match briefing for stadium staff.
Match: ${matchInfo}
Active staff: ${staffData.active}
Zones covered: ${staffData.zones}
Key focuses: crowd safety, fan experience, emergency readiness.
Keep it motivating and under 200 words.`;
}
