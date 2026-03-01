/**
 * Execute Java (and other compiled languages) via Judge0 CE on RapidAPI.
 * Free tier: 50 submissions/day.
 * User provides API key in Settings screen.
 */
import * as state from '../state.js';

const API_HOST = 'judge0-ce.p.rapidapi.com';
const API_URL  = `https://${API_HOST}/submissions?base64_encoded=false&wait=true`;

// Language IDs for Judge0 CE
const LANG_IDS = {
  java:       62,
  c:          50,
  cpp:        54,
  csharp:     51,
  kotlin:     78,
  rust:       73,
};

export async function runJudge0(code, language = 'java', stdin = '') {
  const apiKey = state.get('settings.judge0ApiKey');

  if (!apiKey) {
    throw new Error(
      'Java execution requires a free Judge0 API key.\n' +
      'Go to Settings → enter your RapidAPI key for Judge0 CE.\n' +
      '(Sign up free at rapidapi.com — 50 runs/day)'
    );
  }

  const languageId = LANG_IDS[language] ?? LANG_IDS.java;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type':    'application/json',
      'X-RapidAPI-Key':  apiKey,
      'X-RapidAPI-Host': API_HOST,
    },
    body: JSON.stringify({
      language_id: languageId,
      source_code: code,
      stdin,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Judge0 API error ${response.status}: ${text}`);
  }

  const result = await response.json();

  const stdout = result.stdout ?? '';
  const stderr = (result.stderr ?? '') + (result.compile_output ?? '');

  return {
    stdout: stdout.trim(),
    stderr: stderr.trim(),
    error:  stderr ? new Error(stderr) : null,
  };
}
