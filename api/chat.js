import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  console.log("📨 Incoming request:", req.body);

  if (req.method !== "POST") {
    console.log("⛔ Invalid request method:", req.method);
    return res.status(405).send("Method not allowed");
  }

  const { messages, assistant_id } = req.body;

  console.log("✅ Assistant ID:", assistant_id);
  console.log("✅ Messages:", messages);
  console.log("🔑 API Key exists:", !!process.env.OPENAI_API_KEY);

  try {
    const thread = await openai.beta.threads.create();
    console.log("🧵 Created thread:", thread.id);

    for (const msg of messages) {
      await openai.beta.threads.messages.create(thread.id, {
        role: msg.role,
        content: msg.content,
      });
      console.log(`📩 Added message from ${msg.role}`);
    }

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id,
    });
    console.log("▶️ Run started:", run.id);

    let status;
    do {
      await new Promise((r) => setTimeout(r, 1000));
      const runInfo = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      status = runInfo.status;
      console.log("⏳ Run status:", status);
    } while (status !== "completed");

    const messagesResponse = await openai.beta.threads.messages.list(thread.id);
    const lastMsg = messagesResponse.data[0].content[0].text.value;

    console.log("✅ Assistant response:", lastMsg);
    res.status(200).json({ reply: lastMsg });
  } catch (e) {
    console.error("❌ Error from OpenAI:", e);
    res.status(500).json({ error: "Something went wrong." });
  }
}
