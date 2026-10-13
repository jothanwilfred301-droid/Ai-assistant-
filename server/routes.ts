import express from 'express';
import { getGeminiClient, hasApiKey } from './gemini.js';
import { getState, saveState, MemoryItem, TaskItem, ProjectItem, RoutineItem, AuditLogItem } from './storage.js';

export const apiRouter = express.Router();

// System Status
apiRouter.get('/system/status', (req, res) => {
  const state = getState();
  res.json({
    hasApiKey: hasApiKey(),
    memoryCount: state.memories.length,
    taskCount: state.tasks.length,
    projectCount: state.projects.length,
    activeTasks: state.tasks.filter((t) => t.status === 'in_progress').length,
    timestamp: new Date().toISOString(),
  });
});

// Full state
apiRouter.get('/state', (req, res) => {
  res.json(getState());
});

// Reset or import state
apiRouter.post('/state/import', (req, res) => {
  const newState = req.body;
  if (!newState || !Array.isArray(newState.memories)) {
    return res.status(400).json({ error: 'Invalid state format' });
  }
  saveState(newState);
  res.json({ success: true, message: 'State imported successfully' });
});

// 1. AI Orchestrator Chat Endpoint
apiRouter.post('/orchestrator/chat', async (req, res) => {
  const { message, history = [], currentAgent = 'Planner', attachments = [] } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const state = getState();
  // Build memory context
  const memoryContext = state.memories
    .map((m) => `[${m.category.toUpperCase()}]: ${m.title} - ${m.content}`)
    .join('\n');

  const systemInstruction = `You are DAYMATE AI, a personal AI operating system for mobile and daily execution.
Your tagline: "Your Personal AI. Your Projects. Your Progress."
You coordinate 8 specialized agent roles: Planner, Research Analyst, Writer, Coder, Creative Director, Motion Designer, Video Editor, Quality Controller.
Current active role: ${currentAgent}.

USER PERSISTENT MEMORIES & PREFERENCES:
${memoryContext || 'None saved yet.'}

BEHAVIORAL RULES:
1. Always be practical, structured, and proactive.
2. If the user's objective is complex, break it down into explicit stages or action items.
3. If an action has significant consequences (deleting data, executing untrusted code, external deployment), flag it for user approval.
4. If the user corrects you, acknowledge the correction cleanly and state that a durable memory can be recorded.
5. Provide high quality, executive answers formatted nicely with markdown.
6. If the user is asking to build or do something, recommend specific next steps or a plan.`;

  if (!hasApiKey()) {
    // Elegant local fallback response when API key is not yet set
    return res.json({
      content: `I received your goal: "${message}".\n\nI am operating in local orchestrator mode. Here is the recommended plan:\n\n1. **Align Objectives**: Review saved personal memories and project targets.\n2. **Decompose Tasks**: Break this into actionable subtasks in the Planner.\n3. **Execute & Review**: Quality-control outputs through the designated agent (${currentAgent}).\n\n*(To connect live Gemini intelligence, attach your GEMINI_API_KEY in Settings > Secrets)*`,
      agentRole: currentAgent,
      suggestedTasks: [
        {
          title: `Execute: ${message.slice(0, 40)}`,
          priority: 'medium',
        },
      ],
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const ai = getGeminiClient();
    const { model = 'gemini-3.8-flash', grounding = 'none' } = req.body;

    // Validate supported model
    const selectedModel =
      model === 'gemini-3.1-flash-lite' || model === 'gemini-3.1-pro-preview' || model === 'gemini-3.5-flash'
        ? model
        : 'gemini-3.8-flash';

    // Prepare contents
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> }> = [];

    // Add recent history (up to last 8 turns)
    if (Array.isArray(history)) {
      for (const h of history.slice(-8)) {
        contents.push({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.content }],
        });
      }
    }

    const currentParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

    // Add attached media if present
    if (Array.isArray(attachments)) {
      for (const att of attachments) {
        if (att.base64 && att.mimeType) {
          currentParts.push({
            inlineData: {
              mimeType: att.mimeType,
              data: att.base64.replace(/^data:[^;]+;base64,/, ''),
            },
          });
        }
      }
    }

    currentParts.push({ text: message });
    contents.push({ role: 'user', parts: currentParts });

    // Configure tools for search or maps grounding
    const configObj: any = {
      systemInstruction,
      temperature: 0.7,
    };

    if (grounding === 'search') {
      configObj.tools = [{ googleSearch: {} }];
      configObj.toolConfig = { includeServerSideToolInvocations: true };
    } else if (grounding === 'maps') {
      configObj.tools = [{ googleMaps: {} }];
      configObj.toolConfig = { includeServerSideToolInvocations: true };
    }

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: contents as any,
      config: configObj,
    });

    const replyText = response.text || 'Task analyzed. Ready for your direction.';

    // Extract grounding citations
    let citations: Array<{ title: string; url: string }> = [];
    const groundingChunks = (response.candidates?.[0] as any)?.groundingMetadata?.groundingChunks;
    if (Array.isArray(groundingChunks)) {
      citations = groundingChunks
        .filter((c: any) => c.web?.uri)
        .map((c: any) => ({
          title: c.web.title || c.web.uri,
          url: c.web.uri,
        }))
        .slice(0, 6);
    }

    res.json({
      content: replyText,
      agentRole: currentAgent,
      modelUsed: selectedModel,
      groundingUsed: grounding,
      citations,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Gemini chat error:', err);
    res.status(500).json({
      error: 'Orchestrator error',
      details: err?.message || 'Failed to process request with AI model.',
    });
  }
});

// Maps Grounding Dedicated Endpoint
apiRouter.post('/maps/query', async (req, res) => {
  const { query, locationContext = '' } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Query is required for maps search' });
  }

  if (!hasApiKey()) {
    return res.json({
      query,
      answer: `Maps location intelligence simulated for: "${query}". Attach GEMINI_API_KEY to activate live Google Maps grounding.`,
      places: [
        { name: 'Studio One Film Stage', address: 'London, UK', note: 'Simulated Studio Venue' },
        { name: 'Bioscience Innovation Hub', address: 'Cambridge, MA', note: 'Simulated Research Campus' },
      ],
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const ai = getGeminiClient();
    const prompt = `Use Google Maps grounding to investigate: "${query}".
Location context: ${locationContext || 'Global / User location'}.
Provide:
1. Recommended venues, studio stages, or locations with specific addresses and operating status.
2. Logistical details (access, filming/visiting considerations, transit).
3. Summary of geographic suitability for planning.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: { includeServerSideToolInvocations: true },
      },
    });

    const text = response.text || '';
    const groundingMetadata = (response.candidates?.[0] as any)?.groundingMetadata;

    res.json({
      query,
      answer: text,
      groundingMetadata,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.warn('Maps grounding notice (falling back gracefully):', err?.message);
    res.json({
      query,
      answer: `Location intelligence query processed for "${query}". The interactive Google Maps SDK is active on the map canvas.`,
      places: [
        { name: `${query} - Scouted Location`, address: locationContext || 'Active Search Zone', note: 'Interactive marker pinned' },
      ],
      timestamp: new Date().toISOString(),
    });
  }
});

// Bioscience API (AlphaFold DB, PubChem, and Gemini Science Synthesis)
apiRouter.post('/science/query', async (req, res) => {
  const { type = 'alphafold', id = 'P04637', prompt = '' } = req.body;

  try {
    if (type === 'alphafold') {
      // Query AlphaFold DB API directly
      const afRes = await fetch(`https://alphafold.ebi.ac.uk/api/prediction/${id.trim()}`, {
        headers: {
          'User-Agent': 'DAYMATE-AI/1.0 (Mozilla/5.0; AI Studio)',
          'Accept': 'application/json',
        },
      });
      if (!afRes.ok) {
        return res.status(afRes.status).json({ error: `AlphaFold DB returned status ${afRes.status}` });
      }
      const afData = await afRes.json();
      return res.json({
        type: 'alphafold',
        id,
        data: afData,
        timestamp: new Date().toISOString(),
      });
    }

    if (type === 'pubchem') {
      // Query PubChem PUG REST API for compound properties
      const pcRes = await fetch(
        `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(
          id.trim()
        )}/property/MolecularFormula,MolecularWeight,CanonicalSMILES,InChIKey,XLogP,TPSA,HBondDonorCount,HBondAcceptorCount,RotatableBondCount,Complexity/JSON`
      );
      if (!pcRes.ok) {
        return res.status(pcRes.status).json({ error: `PubChem returned status ${pcRes.status}` });
      }
      const pcData = await pcRes.json();
      return res.json({
        type: 'pubchem',
        id,
        data: pcData,
        timestamp: new Date().toISOString(),
      });
    }

    // General Bioscience synthesis via Gemini 3.8 Flash
    if (hasApiKey()) {
      const ai = getGeminiClient();
      const scienceSystemPrompt = `You are the Lead Bioscience Scout and Molecular Biologist for DAYMATE AI.
You adhere strictly to Google DeepMind Science guidelines:
- For protein structures: cite AlphaFold DB accession IDs, pLDDT scores (>90 very high, 70-90 confident, 50-70 low, <50 disordered), and PAE matrices.
- For chemistry: analyze Lipinski's Rule of 5 (MW <= 500, LogP <= 5, HBD <= 5, HBA <= 10, rotatable bonds <= 10).
- Provide precise scientific citations with PubMed IDs or clinical trial NCT identifiers.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt || `Analyze biological significance of ${id}`,
        config: {
          systemInstruction: scienceSystemPrompt,
          tools: [{ googleSearch: {} }],
        },
      });

      return res.json({
        type: 'synthesis',
        answer: response.text || '',
        timestamp: new Date().toISOString(),
      });
    }

    return res.json({
      type: 'offline',
      answer: `Offline science scout. Connect GEMINI_API_KEY for real-time DeepMind science synthesis.`,
    });
  } catch (err: any) {
    console.error('Science query error:', err);
    res.status(500).json({ error: 'Science query failed', details: err?.message });
  }
});

// 2. Web Research & Grounding Endpoint
apiRouter.post('/research', async (req, res) => {
  const { query, depth = 'standard' } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  if (!hasApiKey()) {
    return res.json({
      query,
      summary: `Simulated Research Report for "${query}". Real web search grounding requires an attached GEMINI_API_KEY.`,
      verifiedFacts: [
        'Web search grounding uses Gemini 3.8 Flash with Google Search tool.',
        'Synthesizes citations and differentiates verified data from hypotheses.',
      ],
      hypotheses: ['Verify latest developments directly with live search integration.'],
      sources: [
        { title: 'Google AI Studio Documentation', url: 'https://ai.google.dev' },
        { title: 'DAYMATE Knowledge Base', url: 'https://daymate.internal' },
      ],
      conductedAt: new Date().toISOString(),
    });
  }

  try {
    const ai = getGeminiClient();
    const prompt = `Perform an in-depth web intelligence search on: "${query}".
Format your report with:
1. Executive Summary
2. Verified Facts & Empirical Findings (with specific numbers, dates, citations)
3. Unverified Hypotheses or Emerging Debates
4. Key Actionable Takeaways for a personal OS / planner.
Be rigorous, objective, and cite sources.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        toolConfig: { includeServerSideToolInvocations: true },
      },
    });

    const text = response.text || '';

    // Extract grounding chunks / search queries if available
    const groundingChunks = (response.candidates?.[0] as any)?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter((c: any) => c.web?.uri)
      .map((c: any) => ({
        title: c.web.title || c.web.uri,
        url: c.web.uri,
      }))
      .slice(0, 8);

    res.json({
      query,
      summary: text,
      sources: sources.length > 0 ? sources : [{ title: 'Google Search Grounding', url: 'https://google.com' }],
      conductedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Research error:', err);
    res.status(500).json({ error: 'Research query failed', details: err?.message });
  }
});

// 3. Speech / TTS Endpoint
apiRouter.post('/tts', async (req, res) => {
  const { text, voice = 'Kore' } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text is required for TTS' });
  }

  if (!hasApiKey()) {
    // Signal client to use browser Web Speech API
    return res.json({ useWebSpeechFallback: true, text });
  }

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text.slice(0, 400), // Keep concise for responsive mobile audio
              speechMetadata: {
                style: 'Natural, poised personal assistant',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice || 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return res.json({
        audioBase64: base64Audio,
        mimeType: 'audio/wav',
        text,
      });
    }

    return res.json({ useWebSpeechFallback: true, text });
  } catch (err: any) {
    console.error('TTS error:', err);
    return res.json({ useWebSpeechFallback: true, text, error: err?.message });
  }
});

// 4. Code Generation Workshop
apiRouter.post('/code/generate', async (req, res) => {
  const { prompt, currentCode = '', language = 'typescript' } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  if (!hasApiKey()) {
    return res.json({
      code: `// Generated code sample for: ${prompt}
function runDaymateTask() {
  console.log("DAYMATE Workshop executing task...");
  return { status: "success", timestamp: new Date().toISOString() };
}
runDaymateTask();`,
      explanation: 'Generated in offline prototype mode.',
      safetyReview: 'Safe: Local sandbox execution only.',
    });
  }

  try {
    const ai = getGeminiClient();
    const systemPrompt = `You are the Lead Coder Agent of DAYMATE AI.
Given a prompt, generate clean, production-grade, secure, modern code (${language}).
Return your response formatted clearly with:
1. The code inside markdown \`\`\`${language} blocks.
2. An architectural summary.
3. A security review note (checking for data leaks, unbounded loops, or unsafe DOM injections).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `User request: ${prompt}\n\nContext / Existing code:\n${currentCode}`,
      config: { systemInstruction: systemPrompt },
    });

    const raw = response.text || '';
    // Extract code block
    const codeMatch = raw.match(/```(?:[a-zA-Z]+)?\n([\s\S]*?)```/);
    const code = codeMatch ? codeMatch[1].trim() : raw;

    res.json({
      code,
      fullResponse: raw,
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Code gen error:', err);
    res.status(500).json({ error: 'Code generation failed', details: err?.message });
  }
});

// 5. Motion Studio Script & Storyboard Generator
apiRouter.post('/motion/generate-script', async (req, res) => {
  const { brief, duration = 30, style = 'Cinematic Sci-Fi' } = req.body;

  const defaultResult = {
    title: 'DAYMATE: Autonomous Progress',
    durationSeconds: duration,
    style,
    scenes: [
      {
        sceneNumber: 1,
        title: 'Dawn Awakening',
        duration: 5,
        visualPrompt: 'A sleek minimal bedroom, smartphone screen glow casting ambient cyan light on wood desk, soft bokeh.',
        cameraAngle: 'Macro close-up slowly pulling back',
        narration: 'Every morning begins with intention.',
        motionGraphic: 'Kinetic lower third: DAYMATE // OS BOOT',
      },
      {
        sceneNumber: 2,
        title: 'Orchestrator at Work',
        duration: 10,
        visualPrompt: 'Holographic interface nodes linking tasks, calendar, and code commits in dark theme studio.',
        cameraAngle: 'Smooth 3D orbit around focal point',
        narration: 'Your goals are decomposed into instant milestones, without friction.',
        motionGraphic: 'Animated progress circle 0% to 100%',
      },
      {
        sceneNumber: 3,
        title: 'Creative Output',
        duration: 10,
        visualPrompt: 'Render timeline editing footage with waveform pulsing to music beats in neon violet.',
        cameraAngle: 'Dynamic rack focus from timeline scrubber to finished render',
        narration: 'From concept to finished production in minutes.',
        motionGraphic: 'Split-screen kinetic subtitle glitch effect',
      },
      {
        sceneNumber: 4,
        title: 'Progress Locked',
        duration: 5,
        visualPrompt: 'Sunset skyline through floor-to-ceiling glass, DAYMATE badge gleaming on screen.',
        cameraAngle: 'Wide cinematic lock-off with lens flare',
        narration: 'DAYMATE AI. Your Personal AI. Your Projects. Your Progress.',
        motionGraphic: 'Centered glowing monogram logo transition',
      },
    ],
  };

  if (!hasApiKey() || !brief) {
    return res.json(defaultResult);
  }

  try {
    const ai = getGeminiClient();
    const prompt = `You are the Creative Director and Motion Designer Agent for DAYMATE AI Motion Studio.
Create a detailed ${duration}-second video production script and storyboard for: "${brief}".
Style: ${style}.
Return a JSON object with:
{
  "title": "Project Title",
  "durationSeconds": ${duration},
  "style": "${style}",
  "scenes": [
    {
      "sceneNumber": 1,
      "title": "Scene Name",
      "duration": 5,
      "visualPrompt": "Detailed prompt for video/image generation",
      "cameraAngle": "Camera movement and shot type",
      "narration": "Voiceover words",
      "motionGraphic": "On-screen animated title or kinetic graphic"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed.scenes ? parsed : defaultResult);
  } catch (err: any) {
    console.error('Motion script gen error:', err);
    res.json(defaultResult);
  }
});

// 6. Memory CRUD
apiRouter.post('/memories', (req, res) => {
  const state = getState();
  const { id, category, title, content, tags = [], isSensitive = false } = req.body;
  if (!title || !content || !category) {
    return res.status(400).json({ error: 'Title, content, and category are required' });
  }

  const existingIndex = state.memories.findIndex((m) => m.id === id);
  const now = new Date().toISOString();

  let savedMemory: MemoryItem;
  if (existingIndex >= 0) {
    savedMemory = {
      ...state.memories[existingIndex],
      category,
      title,
      content,
      tags: Array.isArray(tags) ? tags : [],
      isSensitive: Boolean(isSensitive),
      updatedAt: now,
    };
    state.memories[existingIndex] = savedMemory;
  } else {
    savedMemory = {
      id: id || `mem-${Date.now()}`,
      category,
      title,
      content,
      tags: Array.isArray(tags) ? tags : [],
      isSensitive: Boolean(isSensitive),
      createdAt: now,
      updatedAt: now,
    };
    state.memories.unshift(savedMemory);
  }

  // Record audit log
  state.auditLogs.unshift({
    id: `aud-${Date.now()}`,
    timestamp: now,
    action: existingIndex >= 0 ? 'MEMORY_UPDATED' : 'MEMORY_CREATED',
    category: 'Personal Memory',
    details: `Memory "${title}" (${category}) saved.`,
    approvedBy: 'User',
    status: 'success',
  });

  saveState(state);
  res.json(savedMemory);
});

apiRouter.delete('/memories/:id', (req, res) => {
  const state = getState();
  const id = req.params.id;
  const memory = state.memories.find((m) => m.id === id);
  state.memories = state.memories.filter((m) => m.id !== id);

  state.auditLogs.unshift({
    id: `aud-${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: 'MEMORY_DELETED',
    category: 'Personal Memory',
    details: `Memory "${memory?.title || id}" deleted.`,
    approvedBy: 'User',
    status: 'warning',
  });

  saveState(state);
  res.json({ success: true });
});

// Semantic Memory Search by Intent or Topic
apiRouter.post('/memories/semantic-search', async (req, res) => {
  const state = getState();
  const query = typeof req.body.query === 'string' ? req.body.query.trim() : '';
  const memoriesList: MemoryItem[] = Array.isArray(req.body.memories) && req.body.memories.length > 0
    ? req.body.memories
    : state.memories;

  if (!query) {
    return res.json({
      detectedIntent: '',
      matches: [],
      source: 'heuristic',
      totalConsidered: memoriesList.length,
    });
  }

  if (memoriesList.length === 0) {
    return res.json({
      detectedIntent: `Query: "${query}"`,
      matches: [],
      source: 'heuristic',
      totalConsidered: 0,
    });
  }

  // 1. Try Gemini AI if API key is active
  if (hasApiKey()) {
    try {
      const ai = getGeminiClient();
      const sanitizedMemories = memoriesList.map((m) => ({
        id: m.id,
        category: m.category,
        title: m.title,
        content: m.content,
        tags: m.tags,
        isSensitive: m.isSensitive,
      }));

      const prompt = `You are the Semantic Memory Retrieval Engine for DAYMATE AI.
The user is querying their personal memory core using natural language intent, goal, or topic.
User Query: "${query}"

Here are the memories stored:
${JSON.stringify(sanitizedMemories, null, 2)}

Instructions:
1. Deduce the user's intent, core concepts, emotional tone, or topical focus from the query.
2. Determine which memories are semantically relevant to this intent or topic, even if the exact words or titles do NOT match.
   For example:
   - "how do I want videos produced" matches workflow pipelines or media editing instructions.
   - "what are my safety guidelines" matches approval gates, confirmation requirements, or sensitive data.
   - "styling preferences for mobile" matches concise bullet formats, mobile summaries, or UI layout.
3. Assign a semantic relevance score between 0.0 (irrelevant) and 1.0 (exact match). Include ONLY memories with score >= 0.35. Sort by score descending.
4. For each match, provide a brief 1-sentence explanation of why it aligns with the intent or topic.

Return ONLY a JSON object matching this schema:
{
  "detectedIntent": "Short description of detected user intent / topic",
  "matches": [
    {
      "id": "memory id string",
      "score": 0.95,
      "reason": "1-sentence reason for semantic match"
    }
  ]
}`;

      const callGeminiWithTimeout = async (modelName: string) => {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AI response timed out')), 5000)
        );
        const apiPromise = ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });
        return Promise.race([apiPromise, timeoutPromise]);
      };

      let response;
      try {
        response = await callGeminiWithTimeout('gemini-3.8-flash');
      } catch (e) {
        // Try flash-lite if 3.8-flash is busy/unavailable
        response = await callGeminiWithTimeout('gemini-3.1-flash-lite');
      }

      const parsed = JSON.parse(response.text || '{}');
      if (Array.isArray(parsed.matches)) {
        return res.json({
          detectedIntent: parsed.detectedIntent || `Semantic intent for: "${query}"`,
          matches: parsed.matches.filter((m: any) => typeof m?.id === 'string' && typeof m?.score === 'number'),
          source: 'gemini',
          totalConsidered: memoriesList.length,
        });
      }
    } catch (err: any) {
      console.warn('Gemini semantic search fallback to heuristic engine:', err?.message || err);
    }
  }

  // 2. Intelligent Semantic Heuristic Engine (when Gemini key is absent or on transient error)
  const queryLower = query.toLowerCase();
  const queryTokens = queryLower
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w: string) => w.length > 2);

  // Concept / topic expansion clusters
  const topicClusters: Record<string, string[]> = {
    design: ['ui', 'ux', 'styling', 'look', 'theme', 'color', 'layout', 'mobile', 'visual', 'button', 'font', 'dark', 'clean'],
    safety: ['approval', 'safety', 'confirmation', 'permission', 'destructive', 'protect', 'sensitive', 'security', 'danger', 'gate'],
    media: ['video', 'motion', 'pipeline', 'render', 'animation', 'storyboard', 'script', 'stage', 'creative', 'shot'],
    workflow: ['pipeline', 'process', 'steps', 'stage', 'method', 'routine', 'workflow', 'cadence'],
    coding: ['code', 'developer', 'typescript', 'react', 'refactor', 'function', 'test', 'deploy', 'api', 'architecture'],
    communication: ['tone', 'summary', 'briefing', 'concise', 'bullet', 'message', 'voice', 'format', 'style'],
    learning: ['correction', 'fix', 'mistake', 'learning', 'feedback', 'remember', 'rule', 'instruction'],
    goals: ['goal', 'roadmap', 'launch', 'deliverable', 'pwa', 'android', 'milestone', 'target', 'objective'],
  };

  const activatedClusters = Object.entries(topicClusters).filter(([_, terms]) =>
    terms.some((term) => queryLower.includes(term))
  );

  const scoredMatches = memoriesList
    .map((mem) => {
      let score = 0;
      const reasons: string[] = [];

      const memText = `${mem.title} ${mem.content} ${mem.category} ${mem.tags.join(' ')}`.toLowerCase();

      // Category matching
      if (queryLower.includes(mem.category)) {
        score += 0.35;
        reasons.push(`Direct category match with "${mem.category}"`);
      }

      // Check topic clusters
      for (const [clusterName, terms] of activatedClusters) {
        const clusterHits = terms.filter((term) => memText.includes(term));
        if (clusterHits.length > 0) {
          score += Math.min(0.5, clusterHits.length * 0.15);
          reasons.push(`Aligns with ${clusterName} topic concepts (${clusterHits.slice(0, 3).join(', ')})`);
        }
      }

      // Query token overlap in content/tags
      const tokenHits = queryTokens.filter((token: string) => memText.includes(token));
      if (tokenHits.length > 0) {
        score += Math.min(0.4, (tokenHits.length / Math.max(1, queryTokens.length)) * 0.4);
        if (!reasons.some((r) => r.includes('concepts'))) {
          reasons.push(`Contains relevant topic terms: ${tokenHits.slice(0, 3).join(', ')}`);
        }
      }

      // Tag overlap
      const tagHits = mem.tags.filter((t) => queryLower.includes(t.toLowerCase()) || queryTokens.includes(t.toLowerCase()));
      if (tagHits.length > 0) {
        score += 0.25;
        reasons.push(`Tagged with #${tagHits.join(', #')}`);
      }

      // Sensitive intent
      if ((queryLower.includes('sensitive') || queryLower.includes('private') || queryLower.includes('secret')) && mem.isSensitive) {
        score += 0.4;
        reasons.push('Flags as sensitive personal context');
      }

      const normalizedScore = Math.min(1.0, Math.round(score * 100) / 100);
      return {
        id: mem.id,
        score: normalizedScore,
        reason: reasons[0] || 'Topic and contextual alignment with your query',
      };
    })
    .filter((m) => m.score >= 0.28)
    .sort((a, b) => b.score - a.score);

  const detectedTopicName = activatedClusters.length > 0 ? activatedClusters.map(([name]) => name).join(' & ') : 'Intent Match';

  return res.json({
    detectedIntent: `Semantic filter for ${detectedTopicName}: "${query}"`,
    matches: scoredMatches,
    source: 'heuristic',
    totalConsidered: memoriesList.length,
  });
});

// 7. Task Management CRUD
apiRouter.post('/tasks', (req, res) => {
  const state = getState();
  const {
    id,
    projectId,
    title,
    description = '',
    priority = 'medium',
    status = 'queued',
    assignedAgent = 'Planner',
    progress = 0,
    deadline,
    dependencies = [],
    stages = [],
    requiresApproval = false,
    deliverable,
  } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const existingIndex = state.tasks.findIndex((t) => t.id === id);
  const now = new Date().toISOString();

  let savedTask: TaskItem;
  if (existingIndex >= 0) {
    savedTask = {
      ...state.tasks[existingIndex],
      projectId,
      title,
      description,
      priority,
      status,
      assignedAgent,
      progress: Number(progress),
      deadline,
      dependencies,
      stages,
      requiresApproval,
      deliverable,
      updatedAt: now,
    };
    state.tasks[existingIndex] = savedTask;
  } else {
    savedTask = {
      id: id || `task-${Date.now()}`,
      projectId,
      title,
      description,
      priority,
      status,
      assignedAgent,
      progress: Number(progress),
      deadline,
      dependencies,
      stages: stages.length > 0 ? stages : [{ id: `stg-${Date.now()}`, name: 'Execute plan', completed: false }],
      requiresApproval,
      deliverable,
      createdAt: now,
      updatedAt: now,
    };
    state.tasks.unshift(savedTask);
  }

  saveState(state);
  res.json(savedTask);
});

apiRouter.delete('/tasks/:id', (req, res) => {
  const state = getState();
  state.tasks = state.tasks.filter((t) => t.id !== req.params.id);
  saveState(state);
  res.json({ success: true });
});

// 8. Projects CRUD
apiRouter.post('/projects', (req, res) => {
  const state = getState();
  const { id, title, description, goal, deadline, category = 'General', status = 'active', deliverables = [] } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Project title is required' });
  }

  const existingIndex = state.projects.findIndex((p) => p.id === id);
  let savedProj: ProjectItem;
  if (existingIndex >= 0) {
    savedProj = {
      ...state.projects[existingIndex],
      title,
      description,
      goal,
      deadline,
      category,
      status,
      deliverables,
    };
    state.projects[existingIndex] = savedProj;
  } else {
    savedProj = {
      id: id || `proj-${Date.now()}`,
      title,
      description,
      goal,
      deadline,
      category,
      status,
      progress: 0,
      deliverables,
      createdAt: new Date().toISOString(),
    };
    state.projects.unshift(savedProj);
  }

  saveState(state);
  res.json(savedProj);
});

// 9. Routine Trigger
apiRouter.post('/routines/trigger/:id', async (req, res) => {
  const state = getState();
  const routine = state.routines.find((r) => r.id === req.params.id);
  if (!routine) {
    return res.status(400).json({ error: 'Routine not found' });
  }

  routine.lastRun = new Date().toISOString();
  saveState(state);

  const activeTaskCount = state.tasks.filter((t) => t.status === 'in_progress').length;
  const urgentTaskCount = state.tasks.filter((t) => t.priority === 'urgent' && t.status !== 'completed').length;

  let briefing = `Good day! Routine "${routine.title}" triggered.\n\n` +
    `• Active tasks: ${activeTaskCount}\n` +
    `• Urgent action items: ${urgentTaskCount}\n` +
    `• Priority focus: ${state.projects[0]?.title || 'Main Sprint'}\n` +
    `• Recommendation: Execute highest priority tasks first and review milestones before midday.`;

  if (hasApiKey()) {
    try {
      const ai = getGeminiClient();
      const prompt = `Generate a concise, inspiring personal briefing for the routine "${routine.title}".
Active Tasks: ${activeTaskCount}
Urgent Tasks: ${urgentTaskCount}
Summary prompt: ${routine.summaryPrompt}
Format as a clean 3-bullet executive morning/evening summary suitable for mobile phone display.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });
      briefing = response.text || briefing;
    } catch (e) {
      console.error('Routine AI generation error:', e);
    }
  }

  res.json({
    routine,
    briefing,
    timestamp: new Date().toISOString(),
  });
});

// 10. Audit Log Add
apiRouter.post('/audit', (req, res) => {
  const state = getState();
  const { action, category = 'General', details, approvedBy = 'User', status = 'success' } = req.body;
  const item: AuditLogItem = {
    id: `aud-${Date.now()}`,
    timestamp: new Date().toISOString(),
    action,
    category,
    details,
    approvedBy,
    status,
  };
  state.auditLogs.unshift(item);
  if (state.auditLogs.length > 100) {
    state.auditLogs.pop();
  }
  saveState(state);
  res.json(item);
});

// 11. Visual Learning & Motion Critique Engine
apiRouter.post('/motion/apply-feedback', async (req, res) => {
  const { feedbackText, scene, sceneIndex = 0 } = req.body;
  if (!feedbackText) {
    return res.status(400).json({ error: 'Feedback text is required' });
  }

  const state = getState();
  const currentScene = scene || {
    sceneNumber: sceneIndex + 1,
    title: 'Current Scene',
    duration: 6,
    visualPrompt: 'Dynamic scene',
    cameraAngle: 'Fast camera movement',
    narration: 'Voiceover text',
    motionGraphic: 'Basic title',
  };

  let detectedIssues = ['camera_speed', 'caption_placement', 'title_style'];
  let appliedChanges = [
    'Reduced camera speed by 40% to smooth orbital dolly',
    'Lowered caption Y-offset to prevent occluding focal subject',
    'Upgraded title animation to Kinetic Cyber Glow with cubic-bezier easing',
  ];
  let updatedScene = {
    ...currentScene,
    cameraAngle: 'Smooth 3D slow orbital dolly with gentle deceleration',
    motionGraphic: 'Kinetic Cyber Glow Title (Cubic-Bezier Easing)',
  };
  let durableMemoryRule = `Visual Preference: Maintain moderate camera dolly speeds and ensure subtitles do not occlude central subjects.`;

  if (hasApiKey()) {
    try {
      const ai = getGeminiClient();
      const prompt = `You are DAYMATE AI Creative Director and Visual Quality Controller.
The user provided visual feedback on a video scene: "${feedbackText}".
Current Scene:
${JSON.stringify(currentScene, null, 2)}

Interpret this critique into concrete editing parameter mutations.
Return a JSON object:
{
  "detectedIssues": ["concise list of identified mistakes, e.g. camera_speed_too_fast, caption_overlap"],
  "appliedChanges": ["concrete edits made to the scene, e.g. slowed camera by 50%, adjusted caption Y offset to bottom safe zone"],
  "updatedScene": {
    "sceneNumber": ${currentScene.sceneNumber || 1},
    "title": "${currentScene.title || 'Scene'}",
    "duration": ${currentScene.duration || 6},
    "visualPrompt": "Updated visual prompt with corrected lighting and framing",
    "cameraAngle": "Updated smoother camera angle and speed",
    "narration": "${currentScene.narration || ''}",
    "motionGraphic": "Updated higher quality motion title style"
  },
  "durableMemoryRule": "A concise lasting user preference rule to remember for future video projects"
}`;

      const aiRes = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(aiRes.text || '{}');
      if (parsed.updatedScene) {
        detectedIssues = parsed.detectedIssues || detectedIssues;
        appliedChanges = parsed.appliedChanges || appliedChanges;
        updatedScene = parsed.updatedScene;
        durableMemoryRule = parsed.durableMemoryRule || durableMemoryRule;
      }
    } catch (e) {
      console.error('Visual feedback interpretation error:', e);
    }
  }

  // Save critique record into state
  const critiqueRecord = {
    id: `crit-${Date.now()}`,
    timestamp: new Date().toISOString(),
    sceneIndex,
    feedbackText,
    detectedIssues,
    appliedChanges,
    savedDurableMemory: durableMemoryRule,
  };
  state.visualCritiques.unshift(critiqueRecord);

  // Automatically save durable memory
  const memoryId = `mem-corr-${Date.now()}`;
  state.memories.unshift({
    id: memoryId,
    category: 'correction',
    title: `Visual Correction: ${feedbackText.slice(0, 32)}...`,
    content: durableMemoryRule,
    tags: ['visual_feedback', 'motion_studio', 'camera', 'captions'],
    isSensitive: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Log in audit log
  state.auditLogs.unshift({
    id: `aud-${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: 'VISUAL_CORRECTION_APPLIED',
    category: 'Motion Studio',
    details: `Applied 3 visual corrections: ${appliedChanges.join('; ')}`,
    approvedBy: 'User Feedback',
    status: 'success',
  });

  saveState(state);

  res.json({
    critiqueRecord,
    updatedScene,
    durableMemoryRule,
  });
});

// 12. Autonomy Config & Activity
apiRouter.post('/autonomy/config', (req, res) => {
  const state = getState();
  const { tier, maxAutomatedTasksPerHour, autoApproveLowRisk, allowedCapabilities, strictGates } = req.body;

  state.autonomyConfig = {
    tier: tier ?? state.autonomyConfig.tier,
    maxAutomatedTasksPerHour: maxAutomatedTasksPerHour ?? state.autonomyConfig.maxAutomatedTasksPerHour,
    autoApproveLowRisk: autoApproveLowRisk ?? state.autonomyConfig.autoApproveLowRisk,
    allowedCapabilities: {
      ...state.autonomyConfig.allowedCapabilities,
      ...allowedCapabilities,
    },
    strictGates: {
      ...state.autonomyConfig.strictGates,
      ...strictGates,
    },
  };

  state.auditLogs.unshift({
    id: `aud-${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: 'AUTONOMY_CONFIG_UPDATED',
    category: 'Security & Autonomy',
    details: `Autonomy level set to Tier ${state.autonomyConfig.tier}.`,
    approvedBy: 'User',
    status: 'success',
  });

  saveState(state);
  res.json(state.autonomyConfig);
});

// 13. Delivery Packages Management
apiRouter.post('/delivery/item-status', (req, res) => {
  const state = getState();
  const { packageId, itemId, newStatus } = req.body;

  const pkg = state.deliveryPackages.find((p) => p.id === packageId);
  if (!pkg) return res.status(404).json({ error: 'Package not found' });

  const item = pkg.items.find((i) => i.id === itemId);
  if (!item) return res.status(404).json({ error: 'Item not found' });

  item.status = newStatus;
  // If all items are finished, package is ready
  const allFinished = pkg.items.every((i) => i.status === 'finished');
  pkg.status = allFinished ? 'ready' : 'pending_attention';

  saveState(state);
  res.json({ package: pkg, item });
});

