-- Add new values to lead_source enum
ALTER TYPE public.lead_source ADD VALUE IF NOT EXISTS 'past_client';
ALTER TYPE public.lead_source ADD VALUE IF NOT EXISTS 'expired_listing';
ALTER TYPE public.lead_source ADD VALUE IF NOT EXISTS 'for_sale_by_owner';
ALTER TYPE public.lead_source ADD VALUE IF NOT EXISTS 'center_of_influence';
ALTER TYPE public.lead_source ADD VALUE IF NOT EXISTS 'just_listed';
ALTER TYPE public.lead_source ADD VALUE IF NOT EXISTS 'just_sold';
ALTER TYPE public.lead_source ADD VALUE IF NOT EXISTS 'sign_call';
ALTER TYPE public.lead_source ADD VALUE IF NOT EXISTS 'advertisement_call';
ALTER TYPE public.lead_source ADD VALUE IF NOT EXISTS 'paid_lead_source';
ALTER TYPE public.lead_source ADD VALUE IF NOT EXISTS 'door_knocking';
ALTER TYPE public.lead_source ADD VALUE IF NOT EXISTS 'frbo';
ALTER TYPE public.lead_source ADD VALUE IF NOT EXISTS 'probate';
ALTER TYPE public.lead_source ADD VALUE IF NOT EXISTS 'absentee_owner';
ALTER TYPE public.lead_source ADD VALUE IF NOT EXISTS 'attorney_referral';
ALTER TYPE public.lead_source ADD VALUE IF NOT EXISTS 'agent_2_agent_calls';

COMMENT ON TYPE public.lead_source IS 'Comprehensive list of lead sources for real estate contacts';