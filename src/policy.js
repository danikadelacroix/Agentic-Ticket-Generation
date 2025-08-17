// SLA-aware policy engine (ticketless-first)
// Inputs: { intent, confidence, customerTier, businessHours, history }
// Outputs: { branch: 'selfServe' | 'autoTicket' | 'human', priority, queue, slaMins, reason }

const PRI = { P1: 'P1', P2: 'P2', P3: 'P3' };

function baseRouting(intent) {
  // map intents to default queue/priority
  switch (intent) {
    case 'auth_reset':     return { queue: 'ServiceDesk', priority: PRI.P3 };
    case 'access':         return { queue: 'AccessMgmt', priority: PRI.P2 };
    case 'billing':        return { queue: 'Billing',     priority: PRI.P2 };
    case 'order':          return { queue: 'Logistics',   priority: PRI.P2 };
    case 'bug':            return { queue: 'Engineering', priority: PRI.P2 };
    default:               return { queue: 'General',     priority: PRI.P3 };
  }
}

function slaMinutes(priority, customerTier) {
  const boost = customerTier === 'gold' ? 0.7 : customerTier === 'silver' ? 0.85 : 1.0;
  const base = { P1: 30, P2: 240, P3: 720 }[priority] ?? 720;
  return Math.round(base * boost);
}

function policyDecision({ intent, confidence, customerTier = 'standard', businessHours = true, history = {} }) {
  const { queue, priority } = baseRouting(intent);

  // Ticketless-first: allow self-serve for high-confidence password/auth flows
  if (intent === 'auth_reset' && confidence >= 0.5) {
    return {
      branch: 'selfServe',
      priority,
      queue,
      slaMins: slaMinutes(priority, customerTier),
      reason: 'auth_reset self-serve path'
    };
  }

  // Auto-ticket if we’re confident and within policy
  if (confidence >= 0.5) {
    return {
      branch: 'autoTicket',
      priority,
      queue,
      slaMins: slaMinutes(priority, customerTier),
      reason: `auto-ticket: confidence ${confidence.toFixed(2)}`
    };
  }

  // Otherwise, send to human
  return {
    branch: 'human',
    priority,
    queue,
    slaMins: slaMinutes(priority, customerTier),
    reason: `low confidence ${confidence.toFixed(2)}`
  };
}

module.exports = { policyDecision };
