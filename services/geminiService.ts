import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateAbcNotation = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are a world-class music composer and expert in ABC notation (v2.1).
      Your task is to compose a complete, high-quality, and complex piece of music based on this request: "${prompt}".

      **CRITICAL STANDARDS (Align with professional sheet music):**
      1.  **Structure**: The piece MUST have a full structure (Intro, Verse, Chorus, Bridge, Outro). Use % comments to label sections.
      2.  **Length**: The piece MUST be substantial (minimum 32 bars). Do not generate short snippets.
      3.  **Instrumentation & Polyphony**:
          - Create a rich texture with AT LEAST TWO Voices (V:1 Melody, V:2 Accompaniment/Harmony).
          - Use \`%%staves {1 2}\` to group them.
          - Set MIDI programs using \`%%MIDI program 1 <id>\` (e.g., 68 for Oboe, 40 for Violin, 73 for Flute) and \`%%MIDI program 2 0\` (Piano).
      4.  **Dynamics & Expression**: Liberally use dynamics (!p!, !mf!, !ff!, !crescendo!) and articulation (. (staccato), - (tenuto)).
      5.  **Lyrics**: If the prompt implies a song (sad, love, story) or mentions specific themes, you MUST include lyrics using 'w:' lines under V:1.
      6.  **Header**:
          - X:1
          - T: <Creative Title based on prompt>
          - C: AI Composer
          - M: <Time Signature>
          - L: <Unit Length>
          - Q: <Tempo>
          - K: <Key>

      **Formatting Rules**:
      - Start directly with the header (X:1).
      - Ensure strict ABC v2.1 syntax compliance.
      - Do NOT include markdown code blocks (like \`\`\`) or conversational text.
      - Return ONLY the raw ABC string.

      **Example Layout (Do not copy, just structure)**:
      X:1
      ...
      %%staves {1 2}
      ...
      % --- Intro ---
      [V:1] ...
      [V:2] ...
      % --- Verse ---
      [V:1] ...
      w: Ly-rics go here
      [V:2] ...
      `,
    });

    const text = response.text || "";
    // Clean up any accidental markdown
    let cleanText = text.replace(/```abc/g, '').replace(/```/g, '').trim();

    // Ensure it starts with the header to avoid conversational prefixes
    const xIndex = cleanText.indexOf('X:');
    if (xIndex !== -1) {
      cleanText = cleanText.substring(xIndex);
    }
    
    return cleanText;
  } catch (error) {
    console.error("Error generating ABC notation:", error);
    throw error;
  }
};