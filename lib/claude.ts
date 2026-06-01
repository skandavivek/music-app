export type AppAction =
  | { action: 'set_bpm'; value: number }
  | { action: 'adjust_bpm'; delta: number }
  | { action: 'toggle_play' }
  | { action: 'set_note'; note: string; octave: number }
  | { action: 'play_note' }
  | { action: 'tap_tempo' }
  | { action: 'unknown' };

const SYSTEM_PROMPT = `You are a music app voice command parser. Convert the user's text to a JSON action.
Return ONLY a JSON object, no explanation or extra text.

Available actions:
{"action":"set_bpm","value":NUMBER}           set tempo, 20-300 BPM
{"action":"adjust_bpm","delta":NUMBER}        relative change, positive or negative
{"action":"toggle_play"}                      start or stop the metronome
{"action":"set_note","note":"X","octave":N}   note is C/C#/D/D#/E/F/F#/G/G#/A/A#/B, octave 1-7
{"action":"play_note"}                        play the currently selected note
{"action":"tap_tempo"}                        use tap tempo
{"action":"unknown"}                          cannot parse

Examples:
"set bpm to 120" -> {"action":"set_bpm","value":120}
"slow it down to 60" -> {"action":"set_bpm","value":60}
"speed up a little" -> {"action":"adjust_bpm","delta":5}
"slower" -> {"action":"adjust_bpm","delta":-10}
"start" -> {"action":"toggle_play"}
"stop" -> {"action":"toggle_play"}
"give me a C" -> {"action":"set_note","note":"C","octave":4}
"play A flat" -> {"action":"set_note","note":"G#","octave":4}
"A sharp 3" -> {"action":"set_note","note":"A#","octave":3}
"play it" -> {"action":"play_note"}`;

export type ParseResult =
  | { ok: true; action: AppAction }
  | { ok: false; error: string };

export async function parseCommand(text: string, apiKey: string): Promise<ParseResult> {
  let response: Response;
  try {
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 100,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: text }],
      }),
    });
  } catch (e) {
    return { ok: false, error: 'Network error — check your connection' };
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    return { ok: false, error: `API error ${response.status}: ${body.slice(0, 80)}` };
  }

  const data = await response.json();
  const raw = data.content?.[0]?.text ?? '';

  // extract JSON even if Claude wraps it in prose
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return { ok: false, error: `Unexpected response: ${raw.slice(0, 80)}` };

  try {
    const action = JSON.parse(match[0]) as AppAction;
    return { ok: true, action };
  } catch {
    return { ok: false, error: `Could not parse: ${match[0].slice(0, 80)}` };
  }
}
