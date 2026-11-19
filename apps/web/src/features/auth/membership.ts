import { resolveMembership, type AuthenticatedMember } from '@partner-os/auth';
import { MembershipsSchema } from '@partner-os/contracts';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function loadAuthenticatedMember(client: SupabaseClient): Promise<AuthenticatedMember | null> {
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  if (sessionError) throw sessionError;
  const session = sessionData.session;
  if (!session) return null;

  const { data: userData, error: userError } = await client.auth.getUser(session.access_token);
  if (userError) throw userError;
  if (!userData.user) throw new Error('Không thể xác thực tài khoản.');
  const { data: claimData, error: claimError } = await client.auth.getClaims(session.access_token);
  if (claimError) throw claimError;
  if (!claimData?.claims) throw new Error('Không thể xác minh quyền tài khoản.');
  const { data, error } = await client
    .from('memberships')
    .select('user_id, tenant_id, role')
    .eq('user_id', userData.user.id);
  if (error) throw error;
  return resolveMembership(userData.user.id, MembershipsSchema.parse(data), claimData.claims);
}
