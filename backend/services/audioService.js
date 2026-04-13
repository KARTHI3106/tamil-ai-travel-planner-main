/**
 * audioService.js
 * Handles forwarding audio data to the Flask Whisper transcription service.
 */

const axios = require('axios');
const FormData = require('form-data');

const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL || 'http://localhost:5000';
const TRANSCRIBE_TIMEOUT = 30000; // 30 seconds

/**
 * Forward audio buffer to Flask /transcribe endpoint for Whisper transcription.
 * @param {Buffer} audioBuffer - Raw audio data
 * @param {string} [filename='recording.webm'] - Original filename
 * @param {string} [language='ta'] - Language code (default: Tamil)
 * @returns {Promise<{text: string, language: string, confidence: number, duration: number}>}
 */
async function forwardToWhisper(audioBuffer, filename = 'recording.webm', language = 'ta') {
  const form = new FormData();
  form.append('audio', audioBuffer, {
    filename,
    contentType: 'audio/webm',
  });
  form.append('language', language);

  try {
    const response = await axios.post(`${NLP_SERVICE_URL}/transcribe`, form, {
      headers: form.getHeaders(),
      timeout: TRANSCRIBE_TIMEOUT,
      maxContentLength: 10 * 1024 * 1024,
    });

    const data = response.data;

    // Check for transcription errors returned as 200 with error field
    if (data.error && !data.text) {
      throw new Error(data.error);
    }

    if (!data.text || !data.text.trim()) {
      throw new Error('குரல் கேட்கவில்லை, மீண்டும் முயற்சிக்கவும்');
    }

    console.log(`[audioService] Transcription: "${data.text.substring(0, 80)}..." (confidence: ${data.confidence})`);

    return data;
  } catch (err) {
    if (err.response) {
      // Flask returned an error response
      const msg = err.response.data?.error || 'Transcription service error';
      console.error(`[audioService] Flask error ${err.response.status}: ${msg}`);
      throw new Error(msg);
    }
    if (err.code === 'ECONNREFUSED') {
      throw new Error('Whisper transcription service is not running. Start the Flask NLP service first.');
    }
    if (err.code === 'ECONNABORTED') {
      throw new Error('Transcription timed out. தயவுசெய்து குறுகிய ஒலியை முயற்சிக்கவும்.');
    }
    throw err;
  }
}

module.exports = { forwardToWhisper };
