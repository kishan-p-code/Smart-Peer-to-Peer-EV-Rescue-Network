const OPENROUTER_API_KEY = (import.meta as any).env?.VITE_OPENROUTER_API_KEY || '';

export interface AIAnalysisRequest {
  prompt: string;
  context?: string;
}

export async function askOpenRouterAssistant(prompt: string, context?: string): Promise<string> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Evio WattVision Telemetry',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: [
          {
            role: 'system',
            content: `You are the technical AI assistant for the Evio / WattVision electrical vehicle monitoring and charging network in Bolivia.
Your persona is technical, analytical, precise, and devoid of marketing fluff or emojis.
Rules:
1. Never use emojis in your response.
2. Provide technical analysis on electrical specs (kW, kWh, Amps, Volts, power factor).
3. Always quote monetary figures in Bolivianos (Bs.) alongside kWh equivalent.
4. Keep answers concise, factual, and formatted with clear headings and bullet points.`
          },
          ...(context ? [{ role: 'system', content: `Current telemetry and network context: ${context}` }] : []),
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${err}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'No telemetry analysis generated.';
  } catch (error: any) {
    console.error('AI assistant error:', error);
    return `Error querying AI service: ${error.message || 'Unknown network error'}`;
  }
}
