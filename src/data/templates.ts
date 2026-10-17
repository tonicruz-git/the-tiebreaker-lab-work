export interface DecisionTemplate {
  id: string;
  category: string;
  title: string;
  dilemma: string;
  options: string[];
  context: string;
  criteria: string;
}

export const DECISION_TEMPLATES: DecisionTemplate[] = [
  {
    id: 'career-startup-vs-corp',
    category: 'Career',
    title: 'Startup Lead vs Big Tech Senior Role',
    dilemma: 'Should I join an early-stage Series A startup as Founding Engineer with equity, or take a senior role at an established Big Tech company with higher guaranteed compensation?',
    options: ['Founding Engineer at Series A Startup', 'Senior Engineer at Established Big Tech Company'],
    context: 'Current situation: 5 years experience, no dependents, $40k emergency fund. Seeking both career acceleration and financial upside, but wary of burnout.',
    criteria: 'Long-term equity upside, work-life balance, learning curve & skill growth, psychological stress, resume brand strength',
  },
  {
    id: 'tech-build-vs-buy',
    category: 'Product & Tech',
    title: 'Build In-House Auth & Billing vs Buy SaaS',
    dilemma: 'Should our engineering team build a custom authentication and billing infrastructure in-house or subscribe to managed solutions (Clerk + Stripe Customer Portal)?',
    options: ['Build In-House Custom Auth & Billing', 'Integrate Managed SaaS (Clerk & Stripe)'],
    context: 'Pre-launch B2B SaaS startup with 3 engineers. Target launch is in 8 weeks.',
    criteria: 'Time-to-market, initial engineering cost, long-term vendor lock-in, compliance (SOC2/GDPR), maintenance overhead',
  },
  {
    id: 'team-work-model',
    category: 'Team & Work',
    title: 'Remote-First vs Hybrid Office Policy',
    dilemma: 'Should our 25-person company adopt a 100% remote-first policy or require 2-3 mandatory in-person collaboration days per week at the office?',
    options: ['100% Remote-First with Quarterly Offsites', 'Hybrid 3 Days In-Office / 2 Days Remote'],
    context: 'Team is spread across 3 time zones. Half the team wants zero commute, while leadership feels junior mentorship and spontaneous innovation are dropping.',
    criteria: 'Team morale & retention, talent recruitment pool size, mentorship quality, office overhead cost, deep focus productivity',
  },
  {
    id: 'personal-buy-rent',
    category: 'Personal Finance',
    title: 'Buy Suburban Starter Home vs Keep Renting in City',
    dilemma: 'Should we buy a $550k suburban starter home at 6.8% mortgage interest, or continue renting an apartment in the city center while investing our savings in index funds?',
    options: ['Buy Suburban Starter Home', 'Continue Renting City Apartment & Invest Delta'],
    context: 'Combined income $170k, savings $110k. Planning to have a child in 2-3 years.',
    criteria: 'Total wealth after 7 years, quality of life & commute, maintenance stress, geographic mobility, space and stability for family',
  },
];
