// test-ai.js
async function test() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent("Hola, responde 'Conectado con Gemini 2.0'");
    console.log("Respuesta de IA:", result.response.text());
  } catch (e) {
    console.error("Error de conexión:", e.message);
  }
}