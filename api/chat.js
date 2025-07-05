import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  const { messages, assistant_id } = req.body;

  try {
    const thread = await openai.beta.threads.create();

    for (const msg of messages) {
      await openai.beta.threads.messages.create(thread.id, {
        role: msg.role,
        content: msg.content,
      });
    }

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id,
    });

    let status;
    do {
      await new Promise(r => setTimeout(r, 1000));
      const runInfo = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      status = runInfo.status;
    } while (status !== "completed");

    const messagesResponse = await openai.beta.threads.messages.list(thread.id);
    const lastMsg = messagesResponse.data[0].content[0].text.value;

    res.status(200).json({ reply: lastMsg });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Something went wrong." });
  }
}
