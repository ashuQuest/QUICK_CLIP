import api from './api';

export async function createClipboardShare({ text, expirySeconds = 86400, burnAfterRead = false }) {
  const response = await api.post('/api/clipboard', {
    text,
    expirySeconds,
    burnAfterRead,
  });
  return response.data.data;
}

export async function getClipboardShare(code) {
  const response = await api.get(`/api/clipboard/${encodeURIComponent(code)}`);
  return response.data.data;
}
