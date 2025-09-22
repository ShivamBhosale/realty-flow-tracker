-- Create enum for contact status
CREATE TYPE contact_status AS ENUM ('new', 'contacted', 'qualified', 'interested', 'not_interested', 'do_not_call');

-- Create enum for lead source
CREATE TYPE lead_source AS ENUM ('referral', 'website', 'social_media', 'cold_call', 'open_house', 'advertisement', 'other');

-- Create enum for contact type
CREATE TYPE contact_type AS ENUM ('buyer', 'seller', 'investor', 'referral_partner');

-- Create contacts table
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  contact_type contact_type NOT NULL DEFAULT 'buyer',
  status contact_status NOT NULL DEFAULT 'new',
  lead_source lead_source,
  notes TEXT,
  budget_min NUMERIC,
  budget_max NUMERIC,
  preferred_areas TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for contacts
CREATE POLICY "Users can view their own contacts" 
ON public.contacts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own contacts" 
ON public.contacts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts" 
ON public.contacts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts" 
ON public.contacts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_contacts_updated_at
BEFORE UPDATE ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create contact interactions table
CREATE TABLE public.contact_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL, -- 'call', 'email', 'meeting', 'text', 'showing', 'other'
  subject TEXT,
  notes TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  follow_up_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for contact_interactions
ALTER TABLE public.contact_interactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for contact_interactions
CREATE POLICY "Users can view their own contact interactions" 
ON public.contact_interactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own contact interactions" 
ON public.contact_interactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contact interactions" 
ON public.contact_interactions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contact interactions" 
ON public.contact_interactions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for contact_interactions timestamps
CREATE TRIGGER update_contact_interactions_updated_at
BEFORE UPDATE ON public.contact_interactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX idx_contacts_status ON public.contacts(status);
CREATE INDEX idx_contacts_type ON public.contacts(contact_type);
CREATE INDEX idx_contact_interactions_user_id ON public.contact_interactions(user_id);
CREATE INDEX idx_contact_interactions_contact_id ON public.contact_interactions(contact_id);
CREATE INDEX idx_contact_interactions_follow_up ON public.contact_interactions(follow_up_date) WHERE follow_up_date IS NOT NULL;