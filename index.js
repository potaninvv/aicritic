import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
app.use(cors());
app.use(express.json());

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

app.post('/api/analyze', async (req, res) => {
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

    const raw = response.choices[0].message.content;
    const parsed = JSON.parse(raw);
    res.json(parsed);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Не удалось получить разбор. Попробуйте ещё раз.' });
  }
});

app.get('/', (req, res) => {
  res.send('AI-критик работает. Эндпоинт: POST /api/analyze');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`AI-критик готов на порту ${PORT}`));
export default app;
