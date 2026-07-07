import { supabaseClient } from '@/lib/supabase/client'
import { Task, WorkflowTransition } from '@/types'

interface SLAStatus {
  status: 'ON_TRACK' | 'AT_RISK' | 'OVERDUE'
  daysUntilDue: number
  dueDateFormatted: string
}

export const mhdWorkflowService = {
  async isTransitionAllowed(
    taskId: string,
    fromStatusId: string,
    toStatusId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabaseClient.rpc('check_workflow_transition_allowed', {
        p_task_id: taskId,
        p_from_status: fromStatusId,
        p_to_status: toStatusId,
        p_user_id: userId,
      })
      if (error) throw error
      return data === true
    } catch (error) {
      console.error('Error checking transition:', error)
      return false
    }
  },
}
