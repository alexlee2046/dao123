'use server';

import { unstable_cache } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Automation, AutomationWithStats } from '@/lib/actions/automations';

/**
 * Cache tags for invalidation
 */
export const AUTOMATION_CACHE_TAGS = {
  list: (userId: string) => `automations:${userId}:list`,
  detail: (id: string) => `automations:${id}:detail`,
  enrollments: (id: string) => `automations:${id}:enrollments`,
} as const;

/**
 * Cache durations (in seconds)
 */
const CACHE_TTL = {
  LIST: 60, // 1 minute for list
  DETAIL: 300, // 5 minutes for detail
  STATS: 30, // 30 seconds for stats
};

/**
 * Get automation by ID with caching
 * Cache is keyed by automation ID and user ID for security
 */
export async function getCachedAutomation(
  automationId: string,
  userId: string
): Promise<Automation | null> {
  const cacheKey = `automation:${automationId}:${userId}`;

  const getCached = unstable_cache(
    async () => {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('automations')
        .select('*')
        .eq('id', automationId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new Error(error.message);
      }

      return data as Automation;
    },
    [cacheKey],
    {
      revalidate: CACHE_TTL.DETAIL,
      tags: [AUTOMATION_CACHE_TAGS.detail(automationId)],
    }
  );

  return getCached();
}

/**
 * Get all automations with stats (cached)
 * Uses a short TTL since stats change frequently
 */
export async function getCachedAutomationsList(
  userId: string
): Promise<AutomationWithStats[]> {
  const cacheKey = `automations:list:${userId}`;

  const getCached = unstable_cache(
    async () => {
      const supabase = await createClient();

      // Get automations
      const { data: automations, error } = await supabase
        .from('automations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      if (!automations || automations.length === 0) {
        return [];
      }

      // Get all automation IDs
      const automationIds = automations.map(a => a.id);

      // Get all enrollments for these automations
      const { data: allEnrollments } = await supabase
        .from('automation_enrollments')
        .select('automation_id, status')
        .in('automation_id', automationIds);

      // Build stats map
      const statsMap = new Map<string, { total: number; active: number; completed: number }>();
      for (const id of automationIds) {
        statsMap.set(id, { total: 0, active: 0, completed: 0 });
      }

      if (allEnrollments) {
        for (const enrollment of allEnrollments) {
          const stats = statsMap.get(enrollment.automation_id);
          if (stats) {
            stats.total++;
            if (enrollment.status === 'active') stats.active++;
            if (enrollment.status === 'completed') stats.completed++;
          }
        }
      }

      return automations.map(automation => {
        const stats = statsMap.get(automation.id) || { total: 0, active: 0, completed: 0 };
        return {
          ...automation,
          enrollment_count: stats.total,
          active_count: stats.active,
          completed_count: stats.completed,
        } as AutomationWithStats;
      });
    },
    [cacheKey],
    {
      revalidate: CACHE_TTL.LIST,
      tags: [AUTOMATION_CACHE_TAGS.list(userId)],
    }
  );

  return getCached();
}

/**
 * Invalidate automation cache
 * Call this after mutations (create, update, delete)
 *
 * Note: With Next.js 16+, cache invalidation works via revalidatePath.
 * The unstable_cache with revalidate TTL handles automatic expiration.
 */
export async function invalidateAutomationCache(
  _automationId: string,
  _userId: string
): Promise<void> {
  try {
    const { revalidatePath } = await import('next/cache');
    // Invalidate automation pages
    revalidatePath('/mail/automations', 'layout');
  } catch {
    // Ignore errors in non-server context
  }
}

/**
 * Invalidate all caches for a user
 */
export async function invalidateUserAutomationCache(_userId: string): Promise<void> {
  try {
    const { revalidatePath } = await import('next/cache');
    revalidatePath('/mail/automations', 'layout');
  } catch {
    // Ignore errors in non-server context
  }
}
