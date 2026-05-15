import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history, language } = req.body;
      
      let systemInstruction = "You are ThermaBot, an AI support assistant for ThermaPredict. ThermaPredict is an Enterprise ML Monitor for predictive maintenance of industrial systems. Provide detailed, comprehensive, and exact answers to the user's questions. If asked about a specific sensor, error code, or scenario, offer a deep, plausible industrial analysis and clear actionable steps.";
      if (language && language !== "English") {
        systemInstruction += ` You must reply entirely in ${language}.`;
      }
      const chat = ai.chats.create({
        model: "gemini-2.5-flash",
        config: {
           systemInstruction,
        },
      });

      let responseText = "Sorry, I could not process that request.";
      if (history && Array.isArray(history) && history.length > 0) {
          // If you have a robust history mapping you can process it here. For now we will just send the latest message.
          const response = await chat.sendMessage({ message });
          responseText = response.text;
      } else {
          const response = await chat.sendMessage({ message });
          responseText = response.text;
      }
      res.json({ text: responseText });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch response from Gemini." });
    }
  });

  app.post("/api/analyze", async (req, res) => {
    try {
      const { filename } = req.body;
      
      const prompt = `Generate a detailed industrial predictive maintenance report for an uploaded telemetry database/file named "${filename}".
      Return ONLY a JSON object with the exact following schema:
      {
        "targetName": "Detected Asset/Machine Name",
        "riskStatus": "CRITICAL" | "WARNING" | "HEALTHY",
        "confidence": "e.g., 94.2%",
        "risk": "Detailed description of the primary risk identified",
        "warnings": ["warning 1", "warning 2"],
        "solutions": ["actionable solution 1", "actionable solution 2"],
        "healthAlerts": ["alert 1", "alert 2"],
        "temperature": "e.g., 184.5°C",
        "efficiency": "e.g., 78% (Predicted compared to previous 85%)",
        "fluctuations": "Detailed analysis of recent thermal/vibration fluctuations in the data compared with previous data generation"
      }
      Make the data highly realistic, professional, and detailed for an industrial IoT monitoring context, and make sure to explicitly mention how efficiency and temperature fluctuate based on the previous data vs current data.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const data = JSON.parse(response.text!);
      res.json(data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to analyze." });
    }
  });

  app.post("/api/transcribe", express.json({limit: '50mb'}), async (req, res) => {
    try {
      const { audioBase64, mimeType } = req.body;
      if (!audioBase64 || !mimeType) {
        return res.status(400).json({ error: "Missing audio data." });
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              { text: "Transcribe the following audio accurately. Reply ONLY with the transcription, nothing else." },
              {
                inlineData: {
                  data: audioBase64,
                  mimeType: mimeType
                }
              }
            ]
          }
        ]
      });

      res.json({ text: response.text });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to transcribe audio." });
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
