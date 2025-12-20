'use server';

import { createClient } from '@/lib/supabase/server';
import { automationLogger, workflowLogger } from '@/lib/logger';

/**
 * Error types for categorization
 */
export type WorkflowErrorType =
  | 'EXECUTION_ERROR'      // General execution failure
  | 'STEP_FAILED'          // Specific step failed
  | 'NODE_NOT_FOUND'       // Referenced node doesn't exist
  | 'VALIDATION_ERROR'     // Input validation failed
  | 'TIMEOUT'              // Step or workflow timeout
  | 'EXTERNAL_SERVICE'     // Third-party service error
  | 'PERMISSION_DENIED'    // Access control error
  | 'RATE_LIMIT'           // Rate limiting triggered
  | 'UNKNOWN';             // Uncategorized error

/**
 * Context for error reporting
 */
export interface ErrorContext {
  workflowId?: string;
  automationId?: string;
  runId?: string;
  nodeId?: string;
  stepIndex?: number;
  input?: Record<string, unknown>;
  previousData?: Record<string, unknown>;
  additionalInfo?: Record<string, unknown>;
}

/**
 * Recorded error entry
 */
export interface WorkflowError {
  id: string;
  workflow_id: string | null;
  automation_id: string | null;
  user_id: string;
  run_id: string | null;
  node_id: string | null;
  step_index: number | null;
  error_type: WorkflowErrorType;
  error_message: string;
  error_stack: string | null;
  context: Record<string, unknown>;
  resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
}

/**
 * Record a workflow or automation error
 */
export async function recordWorkflowError(
  userId: string,
  errorType: WorkflowErrorType,
  errorMessage: string,
  context: ErrorContext,
  error?: Error
): Promise<string | null> {
  try {
    const supabase = await createClient();

    const { data, error: insertError } = await supabase
      .from('workflow_errors')
      .insert({
        user_id: userId,
        workflow_id: context.workflowId || null,
        automation_id: context.automationId || null,
        run_id: context.runId || null,
        node_id: context.nodeId || null,
        step_index: context.stepIndex ?? null,
        error_type: errorType,
        error_message: errorMessage,
        error_stack: error?.stack || null,
        context: {
          input: context.input,
          previousData: context.previousData,
          ...context.additionalInfo,
        },
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Failed to record workflow error:', insertError);
      return null;
    }

    // Log to structured logger
    if (context.automationId) {
      automationLogger.enrollmentError(
        context.automationId,
        context.runId || 'unknown',
        errorMessage
      );
    } else if (context.workflowId) {
      workflowLogger.runFailed(
        context.workflowId,
        context.runId || 'unknown',
        errorMessage
      );
    }

    return data.id;
  } catch (err) {
    console.error('Error recording workflow error:', err);
    return null;
  }
}

/**
 * Get recent errors for a user
 */
export async function getRecentErrors(
  userId: string,
  options?: {
    limit?: number;
    unresolvedOnly?: boolean;
    workflowId?: string;
    automationId?: string;
  }
): Promise<WorkflowError[]> {
  const supabase = await createClient();

  let query = supabase
    .from('workflow_errors')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (options?.unresolvedOnly) {
    query = query.eq('resolved', false);
  }

  if (options?.workflowId) {
    query = query.eq('workflow_id', options.workflowId);
  }

  if (options?.automationId) {
    query = query.eq('automation_id', options.automationId);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  } else {
    query = query.limit(50);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching workflow errors:', error);
    return [];
  }

  return data as WorkflowError[];
}

/**
 * Mark an error as resolved
 */
export async function resolveError(
  errorId: string,
  userId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('workflow_errors')
    .update({
      resolved: true,
      resolved_at: new Date().toISOString(),
      resolved_by: userId,
    })
    .eq('id', errorId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error resolving workflow error:', error);
    return false;
  }

  return true;
}

/**
 * Get error statistics for a user
 */
export async function getErrorStats(userId: string): Promise<{
  total: number;
  unresolved: number;
  byType: Record<WorkflowErrorType, number>;
  last24h: number;
}> {
  const supabase = await createClient();

  // Get all errors
  const { data: allErrors } = await supabase
    .from('workflow_errors')
    .select('error_type, resolved, created_at')
    .eq('user_id', userId);

  if (!allErrors) {
    return {
      total: 0,
      unresolved: 0,
      byType: {} as Record<WorkflowErrorType, number>,
      last24h: 0,
    };
  }

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const stats = {
    total: allErrors.length,
    unresolved: allErrors.filter(e => !e.resolved).length,
    byType: {} as Record<WorkflowErrorType, number>,
    last24h: allErrors.filter(e => new Date(e.created_at) > oneDayAgo).length,
  };

  // Count by type
  for (const error of allErrors) {
    const type = error.error_type as WorkflowErrorType;
    stats.byType[type] = (stats.byType[type] || 0) + 1;
  }

  return stats;
}

/**
 * Create a wrapper for safe execution with error recording
 */
export function createSafeExecutor(userId: string, context: Omit<ErrorContext, 'additionalInfo'>) {
  return async <T>(
    fn: () => Promise<T>,
    errorType: WorkflowErrorType = 'EXECUTION_ERROR'
  ): Promise<{ success: true; data: T } | { success: false; errorId: string | null }> => {
    try {
      const data = await fn();
      return { success: true, data };
    } catch (error) {
      const errorId = await recordWorkflowError(
        userId,
        errorType,
        error instanceof Error ? error.message : String(error),
        context,
        error instanceof Error ? error : undefined
      );
      return { success: false, errorId };
    }
  };
}
