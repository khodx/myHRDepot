/**
 * The pre-live compliance release gate, as returned by
 * `mhd_compliance_module_readiness`.
 *
 * This is a PLATFORM concern, not a module one: regulated notice and letter
 * templates are versioned in `compliance_content_registry`, and a module is
 * release-ready only when every registered content item it depends on has been
 * reviewed and explicitly production-enabled. Both Leaves and Reasonable
 * Accommodations read it, and it lives here rather than inside either feature
 * so neither owns the other's gate.
 *
 * `release_ready: false` is the safe state. A missing row means UNKNOWN and
 * must never be rendered as approval.
 */
export interface MhdComplianceReadiness {
  module_key: string;
  release_ready: boolean;
  blocker_count: number;
  blockers: Array<{
    content_key: string;
    version: number;
    review_status: string;
    production_enabled: boolean;
    source_url: string;
  }>;
}
