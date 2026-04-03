const BASE_URL = '/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    credentials: 'include',
    headers: {},
    ...options,
  };

  if (!(options.body instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }
  }

  const res = await fetch(url, config);
  const raw = await res.text();
  let data = {};

  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = { message: raw };
    }
  }

  if (!res.ok) {
    throw {
      status: res.status,
      message: data.message || 'Request failed',
      ...data,
    };
  }

  return data;
}

/* ========== Auth ========== */
export const authAPI = {
  sendOtp: (body) => request('/auth/send-otp', { method: 'POST', body }),
  verifyOtp: (body) => request('/auth/verify-otp', { method: 'POST', body }),
  getProfile: () => request('/auth/profile'),
  updateProfile: (formData) =>
    request('/auth/update-profile', { method: 'PUT', body: formData }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getAllUsers: () => request('/auth/all-users'),
};

/* ========== Chat ========== */
export const chatAPI = {
  getConversations: () => request('/chat/conversations'),
  getMessages: (conversationId) => request(`/chat/messages/${conversationId}`),
  sendMessage: (formData) =>
    request('/chat/send-message', { method: 'POST', body: formData }),
  deleteConversation: (id) =>
    request(`/chat/conversation/${id}`, { method: 'DELETE' }),
  deleteMessage: (id) =>
    request(`/chat/message/${id}`, { method: 'DELETE' }),
};
