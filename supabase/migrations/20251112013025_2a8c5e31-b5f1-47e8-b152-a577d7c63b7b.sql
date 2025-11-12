-- Add new columns to contacts table to match the reference design
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS contract_date date,
ADD COLUMN IF NOT EXISTS closed_date date,
ADD COLUMN IF NOT EXISTS pending_date date,
ADD COLUMN IF NOT EXISTS fee numeric,
ADD COLUMN IF NOT EXISTS price numeric,
ADD COLUMN IF NOT EXISTS paid_income numeric,
ADD COLUMN IF NOT EXISTS estimated_commission numeric,
ADD COLUMN IF NOT EXISTS days_on_market integer;

-- Add comment to explain the columns
COMMENT ON COLUMN public.contacts.contract_date IS 'Date when the contract was signed';
COMMENT ON COLUMN public.contacts.closed_date IS 'Date when the deal was closed';
COMMENT ON COLUMN public.contacts.pending_date IS 'Date when the deal is pending';
COMMENT ON COLUMN public.contacts.fee IS 'Fee charged for the deal';
COMMENT ON COLUMN public.contacts.price IS 'Price of the property';
COMMENT ON COLUMN public.contacts.paid_income IS 'Income received from the deal';
COMMENT ON COLUMN public.contacts.estimated_commission IS 'Estimated commission amount';
COMMENT ON COLUMN public.contacts.days_on_market IS 'Number of days the property has been on market';