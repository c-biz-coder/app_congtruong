import { describe, expect, it } from 'vitest';

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;

// E2E requires a live Supabase instance. Skips cleanly when env is not set.
describe.skipIf(!SUPABASE_URL)('supabase connectivity (e2e)', () => {
  it('answers on the auth health endpoint', async () => {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/health`);
    expect(response.status).toBe(200);
  });
});
