// ─── AI Helper — Cohere and Mistral fetch utilities ───────────────────────

// ─── Env-first key reader ─────────────────────────────────────────────────
// Priority: .env (VITE_*) → localStorage → fallback
const getKey = (envVar, lsKey, fallback = '') =>
  import.meta.env[envVar] || localStorage.getItem(lsKey) || fallback;

export async function callAI(params) {
  const provider = getKey('VITE_AI_PROVIDER', 'stadiumiq_ai_provider') || 'cohere';
  
  const { prompt, messages = [], systemPrompt, onStream } = params;

  // Build messages array
  const builtMessages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    ...messages,
    { role: 'user', content: prompt }
  ];

  try {
    let resultText = '';
    
    if (provider === 'cohere') {
      const apiKey = getKey('VITE_COHERE_API_KEY', 'stadiumiq_cohere_key');
      if (!apiKey) {
        const mock = getMockResponse(prompt);
        simulateMockStream(mock, onStream);
        return mock;
      }
      
      const cohereEndpoint = import.meta.env.MODE === 'test'
        ? 'https://api.cohere.com/v2/chat'
        : '/cohere-api/v2/chat';

      const res = await fetch(cohereEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'command-r-08-2024',
          max_tokens: 1024,
          temperature: 0.7,
          messages: builtMessages,
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || `HTTP ${res.status}`);
      }
      const data = await res.json();
      resultText = data?.message?.content?.[0]?.text || data?.text || '';
      
    } else if (provider === 'mistral') {
      const apiKey = getKey('VITE_MISTRAL_API_KEY', 'stadiumiq_mistral_key');
      if (!apiKey) {
        const mock = getMockResponse(prompt);
        simulateMockStream(mock, onStream);
        return mock;
      }
      
      const mistralEndpoint = import.meta.env.MODE === 'test'
        ? 'https://api.mistral.ai/v1/chat/completions'
        : '/mistral-api/v1/chat/completions';

      const res = await fetch(mistralEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: getKey('VITE_MISTRAL_MODEL', 'stadiumiq_mistral_model', 'mistral-small-latest'),
          max_tokens: 1024,
          temperature: 0.7,
          messages: builtMessages,
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || `HTTP ${res.status}`);
      }
      const data = await res.json();
      resultText = data?.choices?.[0]?.message?.content || '';
    } else if (provider === 'huggingface') {
      const apiKey = getKey('VITE_HF_API_KEY', 'stadiumiq_hf_key');
      if (!apiKey) {
        const mock = getMockResponse(prompt);
        simulateMockStream(mock, onStream);
        return mock;
      }

      const hfEndpoint = import.meta.env.MODE === 'test'
        ? 'https://api-inference.huggingface.co/v1/chat/completions'
        : '/hf-api/v1/chat/completions';

      const res = await fetch(hfEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: getKey('VITE_HF_MODEL', 'stadiumiq_hf_model', 'Qwen/Qwen2.5-72B-Instruct'),
          max_tokens: 512,
          temperature: 0.7,
          messages: builtMessages,
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || err?.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      resultText = data?.choices?.[0]?.message?.content || '';
    } else {
      // Demo Mode
      const mock = getMockResponse(prompt);
      simulateMockStream(mock, onStream);
      return mock;
    }

    // Stream the final text artificially so the UI feels responsive
    simulateMockStream(resultText, onStream);
    return resultText;

  } catch (error) {
    console.error('[StadiumIQ AI] Error:', error);
    const mock = getMockResponse(prompt);
    simulateMockStream(mock, onStream);
    return mock;
  }
}

function simulateMockStream(mock, onStream) {
  if (!onStream) return;
  const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
  if (isTest) {
    onStream(mock);
  } else {
    const words = mock.split(' ');
    let currentIdx = 0;
    const interval = setInterval(() => {
      if (currentIdx >= words.length) {
        clearInterval(interval);
        return;
      }
      onStream((currentIdx === 0 ? '' : ' ') + words[currentIdx]);
      currentIdx++;
    }, 45);
  }
}

// Removed handleStreamResponse as it was specific to Anthropic SSE

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
    '[CROWD] Based on current crowd patterns, I recommend opening additional concession lanes in Concourse B to reduce wait times by approximately 40%.',
    '[ENERGY] Energy analysis shows HVAC systems are operating at 15% above optimal efficiency. Adjusting temperature zones could save ~2.3 MWh per match.',
    '[STAFF] Staff deployment looks optimal. Consider rotating Zone D volunteers at 17:30 to maintain peak performance for kickoff.',
    '[SECURITY] All security perimeters are nominal. Predictive models show a 12% crowd surge expected at Gate B in approximately 22 minutes.',
    '[GREEN] Current waste diversion rate is 73.2% — 4.8% above tournament average. Compostable packaging swap at North concessions could push this to 80%.',
  ],
  fan: [
    '[SEAT] Your seat is in Section 14, Row G, Seat 22 — North Stand, great view of both goals! Head through Gate C, turn right at the concourse.',
    '[FOOD] The shortest food queue right now is at Concourse B Bar 2 — estimated 3-minute wait. They serve the official FIFA burger and local craft beer.',
    '[NAV] From your current location, your seat is about a 4-minute walk. Go up Ramp 3, follow the blue signs to North Stand.',
    '[MATCH] Kickoff is in 45 minutes. Gates close 10 minutes before kickoff, so you have plenty of time to grab food first!',
  ],
  operations: [
    '[ALERT] Gate D throughput is 105% of rated capacity. Recommend opening overflow lane and deploying 3 additional stewards immediately.',
    '[CROWD] Crowd density is peaking in the South Stand at 94%. Historical patterns suggest a natural dispersal in 8 minutes as fans settle for kickoff.',
    '[PREDICTION] AI prediction: 78% probability of a queue surge at North concessions during halftime. Pre-positioning 2 additional staff recommended.',
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

  const response = pool[Math.floor(Math.random() * pool.length)];
  const provider = getKey('VITE_AI_PROVIDER', 'stadiumiq_ai_provider') || 'cohere';
  const hintMap = {
    mistral:      'add your Mistral API key in Settings for live AI',
    huggingface:  'add your Hugging Face token in Settings for live AI',
    cohere:       'add your Cohere API key in Settings for live AI',
  };
  const hint = hintMap[provider] || hintMap.cohere;
  return `${response}\n\n_[Demo mode — ${hint}]_`;
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
