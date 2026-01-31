export const mockAgencyStats = {
  totalPipeline: 37,
  needsAttention: 8,
  avgRating: 4.4,
  avgRatingChange: 0.2,
  churnWatch: 2,
}

export const mockPresence = [
  { platform: 'Google Business Profile', status: 'synced' as const },
  { platform: 'Yelp', status: 'needsUpdate' as const },
  { platform: 'Facebook', status: 'notConnected' as const },
]

export const mockProspects = [
  { id: 'p1', name: "Joe's HVAC", industry: 'HVAC', city: 'Austin', phone: '(555) 987-6543', createdAt: '2025-01-20', updatedAt: '2025-01-22', stage: 'Diagnostic Ready' as const, diagnosticId: 'd1', estMonthlyValue: 420 },
  { id: 'p2', name: "Bella Salon", industry: 'Salon', city: 'Dallas', phone: '(555) 234-5678', createdAt: '2025-01-18', updatedAt: '2025-01-21', stage: 'Invited' as const, diagnosticId: 'd2', estMonthlyValue: 380 },
  { id: 'p3', name: 'Peak Dental', industry: 'Dental', city: 'Houston', phone: '(555) 111-2233', createdAt: '2025-01-15', updatedAt: '2025-01-19', stage: 'Prospect' as const, estMonthlyValue: 500 },
]

export const mockDiagnostics = [
  {
    id: 'd1',
    prospectId: 'p1',
    createdAt: '2025-01-21',
    presenceScore: 72,
    reviewsScore: 68,
    speedToLeadScore: 55,
    shareToken: 'demo',
    openCount: 3,
    findings: {
      presence: [
        { platform: 'Google Business Profile', status: 'Consistent' as const },
        { platform: 'Yelp', status: 'Needs fix' as const, issues: ['Hours'] },
        { platform: 'Facebook', status: 'Needs fix' as const },
      ],
      reviews: { currentRating: 4.2, benchmark: 4.5, last30: 12, goal: 4.7 },
      speedToLead: { avgReplyMs: 22 * 60 * 1000, recommendedMs: 5 * 60 * 1000 },
    },
  },
  {
    id: 'd2',
    prospectId: 'p2',
    createdAt: '2025-01-20',
    presenceScore: 78,
    reviewsScore: 82,
    speedToLeadScore: 70,
    shareToken: 'def456',
    openCount: 1,
    findings: {
      presence: [
        { platform: 'Google Business Profile', status: 'Consistent' as const },
        { platform: 'Yelp', status: 'Consistent' as const },
        { platform: 'Facebook', status: 'Needs fix' as const },
      ],
      reviews: { currentRating: 4.5, benchmark: 4.6, last30: 8, goal: 4.8 },
      speedToLead: { avgReplyMs: 12 * 60 * 1000, recommendedMs: 5 * 60 * 1000 },
    },
  },
]

export const mockBusinesses = [
  {
    id: 'biz-1',
    name: "Joe's HVAC",
    industry: 'HVAC',
    city: 'Austin',
    phone: '(555) 987-6543',
    rating: 4.2,
    ratingChange: 0.2,
    newLeads: 4,
    bookedJobs: 9,
    closedRevenue: 3200,
    avgTicket: 225,
    avgReplyTime: 11,
    totalLeads: 14,
  },
  {
    id: 'biz-2',
    name: "Bella Salon",
    industry: 'Salon',
    city: 'Dallas',
    phone: '(555) 234-5678',
    rating: 4.7,
    ratingChange: 0.1,
    newLeads: 12,
    bookedJobs: 18,
    closedRevenue: 5400,
    avgTicket: 300,
    avgReplyTime: 8,
    totalLeads: 25,
  },
]
