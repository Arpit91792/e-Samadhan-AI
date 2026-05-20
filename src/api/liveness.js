import api from './axios';

const livenessConfig = { silent: true, timeout: 20000 };

export async function getLivenessAttemptStatus(email) {
      const { data } = await api.get('/liveness/attempt-status', {
            params: { email },
            ...livenessConfig,
      });
      return data;
}

export async function startLivenessSession({ email, govtIdType }) {
      const { data } = await api.post(
            '/liveness/start-liveness',
            { email, govtIdType },
            livenessConfig
      );
      return data;
}

export async function verifyLivenessSession(payload) {
      const { data } = await api.post('/liveness/verify-liveness', payload, livenessConfig);
      return data;
}

/** Development only — resets attempts + sessions for email */
export async function devResetLiveness(email) {
      const { data } = await api.post('/liveness/dev-reset', { email }, livenessConfig);
      return data;
}
