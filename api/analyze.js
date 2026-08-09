import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.LLM_API_KEY,
  baseURL: process.env.LLM_BASE_URL || 'https://api.deepseek.com',
});

const MODEL = process.env.LLM_MODEL || 'deepseek-v4-flash';

const SYSTEM_PROMPT = `Ты — опытный бизнес‑аналитик и эксперт по социальным контрактам. Твоя задача — профессионально и конструктивно проанализировать бизнес‑идею, которую подаёт заявитель. Оценивай реалистичность, востребованность на рынке, потенциальные риски и соответствие условиям соцконтракта. Не хвали безосновательно, но и не критикуй резко. Всегда отвечай только на русском языке. Верни ответ строго в формате JSON со следующей структурой:
{
  "strengths": ["сильная сторона 1", "сильная сторона 2", "сильная сторона 3"],
  "weaknesses": ["слабое место 1", "слабое место 2", "слабое место 3"],
  "questions": ["вопрос, который может задать комиссия 1", "вопрос 2", "вопрос 3"]
}
По 3 пункта в каждом массиве. Формулируй конкретно, без общих фраз. Никакого текста до или после JSON.`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не разрешён. Используйте POST.' });
  }

  try {
    const { idea } = req.body;
    if (!idea) return res.status(400).json({ error: 'Поле idea обязательно' });

    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: idea },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const parsed = JSON.parse(response.choices[0].message.content);
    res.status(200).json(parsed);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Не удалось получить разбор. Попробуйте ещё раз.' });
  }
}
