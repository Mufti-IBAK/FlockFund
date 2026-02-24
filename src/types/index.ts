/* ------------------------------------------------------------------ */
/*  FlockFund  —  Shared TypeScript Types                             */
/* ------------------------------------------------------------------ */

// ----- database row types (mirror schema) -----

export type UserRole = "admin" | "farm_manager" | "keeper" | "investor";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  created_at: string;
}

export interface CostBreakdown {
  feed: number;
  drugs: number;
  maintenance: number;
  mortality_buffer: number;
  operational: number;
  services: number;
  [key: string]: number; // allow admin to add custom items
}

export interface Settings {
  id: number;
  cost_per_bird: number;
  cost_breakdown: CostBreakdown;
  market_floor_price: number;
  market_cost: number;
  investor_share_percentage: number;
  flockfund_share_percentage: number;
  reinvest_percentage: number;
  rounds_before_withdrawal: number;
  payment_gateway: "flutterwave" | "paystack" | "paypal";
  payment_gateway_config: Record<string, unknown>;
  blockchain_enabled: boolean;
  blockchain_network: string | null;
  blockchain_contract_address: string | null;
  data_monetization_enabled: boolean;
  updated_at: string;
}

export interface Flock {
  id: string;
  name: string;
  start_date: string;
  expected_end_date: string;
  total_birds: number;
  status: "active" | "completed" | "cancelled";
  created_at: string;
}

export interface Investment {
  id: string;
  investor_id: string;
  flock_id: string;
  birds_owned: number;
  cost_paid: number;
  round_count: number;
  payment_gateway_used: string;
  payment_transaction_id: string;
  blockchain_tx_hash: string | null;
  created_at: string;
}

export interface FarmReport {
  id: string;
  flock_id: string;
  reporter_id: string;
  report_date: string;
  mortality_count: number;
  clinical_signs: string;
  temperature: number;
  feed_brand: string | null;
  litter_status: string | null;
  ventilation_status: string | null;
  handover_notes: string | null;
  diagnosis_category: string | null;
  status: "pending" | "approved" | "rejected";
  approved_by: string | null;
  vet_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WeightSample {
  bird_id: string;
  weight_kg: number;
}

export interface MarketUpdate {
  id: string;
  field: string;
  old_value: number;
  new_value: number;
  changed_by: string;
  created_at: string;
}

export interface ProfitCycle {
  id: string;
  flock_id: string;
  total_revenue: number;
  total_cost: number;
  total_profit: number;
  investor_pool: number;
  flockfund_share: number;
  calculated_at: string;
}

export interface InvestorPayout {
  id: string;
  investment_id: string;
  cycle_id: string;
  gross_profit_share: number;
  reinvested_amount: number;
  withdrawable_amount: number;
  round_number: number;
  blockchain_tx_hash: string | null;
  created_at: string;
}

export interface FeedLog {
  id: string;
  flock_id: string;
  report_date: string;
  feed_type: string;
  quantity_kg: number;
  cost_per_kg: number;
  created_at: string;
}

export interface WeightRecord {
  id: string;
  flock_id: string;
  sample_date: string;
  bird_identifier: string;
  weight_kg: number;
  age_days: number;
  created_at: string;
}

export interface FcrCalculation {
  id: string;
  flock_id: string;
  period_start: string;
  period_end: string;
  total_feed_kg: number;
  total_weight_gain_kg: number;
  fcr: number;
  created_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  criteria: Record<string, unknown>;
}

export interface InvestorBadge {
  id: string;
  investor_id: string;
  badge_id: string;
  earned_at: string;
}

export interface CommunityPost {
  id: string;
  author_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
}
export interface FundRequest {
  id: string;
  requester_id: string;
  flock_id: string;
  amount: number;
  category: "feed" | "drugs" | "water" | "maintenance" | "other";
  description: string;
  admin_approved: boolean;
  approved_by: string | null;
  accountant_processed: boolean;
  processed_by: string | null;
  receipt_url: string | null;
  status: "pending" | "approved" | "processed" | "rejected";
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  flocks?: Flock;
}

export interface Vaccination {
  id: string;
  flock_id: string;
  vaccine_name: string;
  scheduled_date: string;
  administered_date: string | null;
  notes: string | null;
  created_at: string;
}
