export type SegmentOperator = 'equals' | 'contains' | 'gt' | 'lt' | 'starts_with';
export type SegmentLogic = 'AND' | 'OR';

export interface SegmentCondition {
  field: 'email' | 'tags' | 'confidence_score' | 'position' | 'company_name';
  operator: SegmentOperator;
  value: any;
}

export interface SegmentRule {
  logic: SegmentLogic;
  conditions: SegmentCondition[];
}

import { createClient } from '@/lib/supabase/server';

export async function evaluateSegment(segmentId: string): Promise<string[]> {
  const supabase = await createClient();
  
  // 1. Get Segment Rules
  const { data: segment } = await supabase
    .from('segments')
    .select('rules')
    .eq('id', segmentId)
    .single();

  if (!segment) throw new Error('Segment not found');
  
  const rules = segment.rules as SegmentRule;
  
  // 2. Build Query
  // Note: For complex nested JSON rules, we might need dynamic SQL or fetch-then-filter.
  // Implementing fetch-then-filter for flexibility (not efficient for 1M+ contacts, but OK for now).
  
  const { data: contacts } = await supabase
    .from('contacts')
    .select('*');
    
  if (!contacts) return [];

  return contacts.filter(contact => {
    // Check all conditions
    const results = rules.conditions.map(condition => {
      const val = contact[condition.field];
      
      switch (condition.operator) {
        case 'equals': return val == condition.value;
        case 'contains': 
          if (Array.isArray(val)) return val.includes(condition.value);
          return String(val).includes(condition.value);
        case 'gt': return Number(val) > Number(condition.value);
        case 'lt': return Number(val) < Number(condition.value);
        default: return false;
      }
    });

    if (rules.logic === 'AND') return results.every(r => r);
    return results.some(r => r);
  }).map(c => c.id);
}
