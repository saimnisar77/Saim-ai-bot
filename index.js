const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const sock = makeWASocket({ auth: state, printQRInTerminal: true, browser: ["Saim Bot","Chrome","1.0"] });
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if(connection === 'close' && lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut) startBot();
    else if(connection === 'open') console.log('Bot Connected!');
  });
  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if(!msg.message || msg.key.fromMe) return;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
    if(!text) return;
    try {
      const chat = await groq.chat.completions.create({
        messages: [{ role: "system", content: "You are Saim AI Bot. Reply in Roman Urdu mixed English, friendly and short." }, { role: "user", content: text }],
        model: "llama-3.3-70b-versatile",
      });
      await sock.sendMessage(msg.key.remoteJid, { text: chat.choices[0]?.message?.content || "Samajh nahi aya" });
    } catch (e) { console.log(e.message); }
  });
}
startBot();
