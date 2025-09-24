-- Create daily_targets table for storing editable daily metric targets
CREATE TABLE public.daily_targets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  calls_made_target INTEGER DEFAULT 25,
  contacts_reached_target INTEGER DEFAULT 8,
  appointments_set_target INTEGER DEFAULT 4,
  appointments_attended_target INTEGER DEFAULT 3,
  listing_presentations_target INTEGER DEFAULT 2,
  listings_taken_target INTEGER DEFAULT 1,
  buyers_signed_target INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.daily_targets ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own targets" 
ON public.daily_targets 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own targets" 
ON public.daily_targets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own targets" 
ON public.daily_targets 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own targets" 
ON public.daily_targets 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_daily_targets_updated_at
BEFORE UPDATE ON public.daily_targets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();