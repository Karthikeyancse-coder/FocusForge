import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY || "dummy_key", 
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } 
  });

  // API constraints check
  const apiKeyPresent = !!process.env.GEMINI_API_KEY;

  // 1. Suggest Importance
  app.post("/api/gemini/suggest-importance", async (req, res) => {
    if (!apiKeyPresent) {
      return res.json({ importance: "Medium" }); // Mock for fallback
    }

    try {
      const { title, category, daysToDeadline } = req.body;
      const prompt = `System: You are a task-importance classifier. Given a task title, category, deadline proximity, and context, return ONLY one of: Critical, High, Medium, Low. No explanation text.
      
      Task: ${title}
      Category: ${category}
      Days to deadline: ${daysToDeadline}`;

      const geminiCall = ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      
      const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve('TIMEOUT'), 6000));
      const response: any = await Promise.race([geminiCall, timeoutPromise]);

      if (response === 'TIMEOUT') {
           console.log("Gemini call timed out, using fallback");
           return res.json({ importance: "Medium" });
      }
      
      const result = response.text?.trim() as string;
      const valid = ["Critical", "High", "Medium", "Low"].includes(result) ? result : "Medium";
      res.json({ importance: valid });
    } catch (e: any) {
      console.log("Gemini fallback used for suggest-importance (API limit or network issue)");
      res.json({ importance: "Medium" });
    }
  });

  // AI Planner
  app.post("/api/gemini/planner", async (req, res) => {
    const fallbackResponse = {
       subtasks: [
         { stepName: "Phase 1: Research & Setup", estimatedDurationMinutes: 60, suggestedStart: { date: new Date().toISOString().split('T')[0], time: "10:00" } },
         { stepName: "Phase 2: Execution", estimatedDurationMinutes: 120, suggestedStart: { date: new Date().toISOString().split('T')[0], time: "14:00" } },
       ]
    };

    if (!apiKeyPresent) {
       return res.json(fallbackResponse);
    }

    try {
       const { title, estimatedEffortHours, deadline, busyBlocks, currentDate } = req.body;
       const prompt = `System: You are an AI planner. Given a task title, estimated effort (hours), deadline, current date, and a list of busy calendar blocks, break the task into logical subtasks. For each subtask, assign an estimated duration in minutes, and a specific suggested start date and time. Do NOT schedule a subtask during a marked-busy slot. Distribute the subtasks across the available days before the deadline.
       Return a JSON array of subtasks, each exactly matching this shape: { "stepName": string, "estimatedDurationMinutes": number, "suggestedStart": { "date": "YYYY-MM-DD", "time": "HH:MM" } }.
       
       Input Context:
       - Task Title: ${title}
       - Estimated Effort: ${estimatedEffortHours} hours
       - Deadline: ${deadline}
       - Current Date: ${currentDate}
       - Busy Blocks: ${JSON.stringify(busyBlocks)}`;

       const geminiCall = ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: { responseMimeType: "application/json" }
       });
       
       const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve('TIMEOUT'), 6000));
       const response: any = await Promise.race([geminiCall, timeoutPromise]);
       
       if (response === 'TIMEOUT') return res.json(fallbackResponse);
       
       const text = response.text || "[]";
       res.json({ subtasks: JSON.parse(text) });
    } catch (e) {
       console.log("Gemini fallback used for planner (API limit or network issue)");
       res.json(fallbackResponse);
    }
  });

  // 2. Recovery Plan
  app.post("/api/gemini/recovery-plan", async (req, res) => {
    const fallbackPlan = {
        schedule: [
            { date: new Date().toISOString().split('T')[0], start: "18:00", end: "22:00" },
            { date: new Date(Date.now() + 86400000).toISOString().split('T')[0], start: "10:00", end: "14:00" }
        ],
        reasoning: "We've front-loaded your schedule to maximize your remaining capacity before the deadline."
    };

    if (!apiKeyPresent) {
        return res.json(fallbackPlan);
    }

    try {
        const { remainingCapacity, requiredEffort, historicalLagBias, deadline } = req.body;
        
        const prompt = `System: Given remaining capacity (hours), required effort (hours), historical lag bias, and deadline, return a JSON schedule: [{date, start, end}]. Start bounds should be within reasonable working hours (e.g. 09:00 to 22:00) using HH:MM format. Add a one-sentence plain-language reasoning string. If required effort exceeds capacity even after maximum reasonable compression, return {"infeasible": true} instead.

        Input Context:
        - Remaining Capacity: ${remainingCapacity} hours
        - Required Effort: ${requiredEffort} hours
        - Historical Lag Bias (0-100 scale, higher means user tends to delay completion): ${historicalLagBias}
        - Deadline: ${deadline}`;

        const geminiCall = ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        });

        // 6 second timeout
        const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve('TIMEOUT'), 6000));
        const response: any = await Promise.race([geminiCall, timeoutPromise]);

        if (response === 'TIMEOUT') {
             console.log("Gemini call timed out, using fallback");
             return res.json(fallbackPlan);
        }

        const text = response.text || "{}";
        const parsed = JSON.parse(text);
        res.json(parsed);
    } catch(e: any) {
        console.log("Gemini fallback used for recovery-plan (API limit or network issue)");
        res.json(fallbackPlan);
    }
  });

  // 3. Extension Draft
  app.post("/api/gemini/extension-draft", async (req, res) => {
    const fallbackDraft = "Dear recipient,\n\nI am writing to request a short extension. I overestimated my capacity for the recent days and will need slightly more time to deliver quality work.\n\nThank you.";
    if (!apiKeyPresent) {
      return res.json({
          draft: fallbackDraft
      });
    }

    try {
        const { taskTitle, category, timeDeficitHours, realityGapSummary } = req.body;
        
        const prompt = `System: Given task title, recipient context (professor/manager/client — inferred from category), time deficit in hours, and reason (Reality Gap summary), draft a concise, professional extension request. Return plain text only.
        
        Input Context:
        - Task Title: ${taskTitle}
        - Category/Recipient Context: ${category}
        - Time Deficit: ${timeDeficitHours.toFixed(1)} hours
        - Reason (Reality Gap): ${realityGapSummary}`;

        const geminiCall = ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve('TIMEOUT'), 6000));
        const response: any = await Promise.race([geminiCall, timeoutPromise]);

        if (response === 'TIMEOUT') {
             console.log("Gemini call timed out, using fallback");
             return res.json({ draft: fallbackDraft });
        }

        res.json({ draft: response.text?.trim() });
    } catch(e: any) {
        console.log("Gemini fallback used for extension-draft (API limit or network issue)");
        res.json({ draft: fallbackDraft });
    }
  });

  // AI Command Center
  app.post("/api/gemini/command-center", async (req, res) => {
    if (!apiKeyPresent) {
      return res.json({ text: "API key missing. I cannot assist you at the moment.", actions: [] });
    }

    try {
      const { messages, tasks, userState, reminders } = req.body;
      
      // We parse out minimal info to save tokens
      const minTasks = tasks.map((t: any) => ({
        id: t.id,
        title: t.title,
        priority: t.importance?.final || "Medium",
        deadline: t.deadline,
        isPinned: !!t.isPinned,
        completed: t.realityState?.confirmedPercent >= 100,
        progressPercent: t.realityState?.inferredPercent || 0,
        focusSessions: t.realityState?.focusSessions || [],
        xp: (t.estimatedEffortHours || 0) * 100,
        calendarBlocks: t.plannedState?.plannedWorkBlocks || [],
        isWorkspaceTask: !!t.workspaceId,
        hasRecoveryPlan: t.recoveryPlan?.status === "accepted",
        riskScore: t.riskEngine?.riskScore || 0,
        riskTier: t.riskEngine?.riskTier || "Green"
      }));

      const prompt = `System: You are an AI executive assistant and productivity coach for FocusForge.
Tone: Professional, friendly, motivating, short responses, action-oriented.
You have access to the user's current app state.
Do NOT hallucinate or invent data. Use the provided state.

Current State:
User Level: ${userState?.level || 1}
User XP: ${userState?.xp || 0}
(Next level requires: ${ (userState?.level || 1) * 200 + 200 } XP)
Active Notifications/Reminders: ${JSON.stringify(reminders || [])}
Tasks: ${JSON.stringify(minTasks)}
Date: ${new Date().toISOString()}

Respond to the latest user message. 
If the user asks to create, update, delete, or complete a task, or start a focus session, infer the intent and add the corresponding action to the 'actions' array.
For 'durationMinutes', default to 25 if not specified.
Return a JSON object matching this schema.

Schema format:
{
  "text": "The response to show the user. Markdown allowed.",
  "actions": [
    {
      "type": "CREATE_TASK",
      "payload": { "title": "...", "deadline": "...", "priority": "High", "estimatedEffortHours": 2 }
    },
    {
      "type": "EDIT_TASK",
      "payload": { "id": "t1", "title": "new name", "priority": "Low", "deadline": "...", "isPinned": true }
    },
    {
      "type": "DELETE_TASK",
      "payload": { "id": "t1" }
    },
    {
      "type": "COMPLETE_TASK",
      "payload": { "id": "t1" }
    },
    {
      "type": "START_FOCUS",
      "payload": { "id": "t1", "durationMinutes": 25 }
    }
  ]
}

Previous Conversation:
${messages.map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n')}`;

      const geminiCall = ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      
      const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve('TIMEOUT'), 8000));
      const response: any = await Promise.race([geminiCall, timeoutPromise]);
      
      if (response === 'TIMEOUT') {
         return res.json({ text: "Sorry, I took too long to think. Please try again.", actions: [] });
      }
      
      const text = response.text || "{}";
      res.json(JSON.parse(text));
    } catch (e: any) {
      console.log("Gemini error in command-center:", e?.message || e);
      let errorMessage = "I encountered an error processing your request.";
      if (e?.status === 503 || e?.message?.includes("503") || e?.message?.includes("high demand") || e?.message?.includes("UNAVAILABLE")) {
         errorMessage = "The AI model is currently experiencing high demand. Please try again in a moment.";
      }
      res.json({ text: errorMessage, actions: [] });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log("Server running on port " + PORT);
  });
}

startServer();
