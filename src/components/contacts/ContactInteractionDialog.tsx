import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ContactInteractionDialogProps {
  contactId: string;
  contactName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const INTERACTION_TYPES = [
  'call',
  'email',
  'text',
  'meeting',
  'showing',
  'listing_presentation',
  'follow_up',
  'contract_discussion',
  'closing'
];

const ContactInteractionDialog: React.FC<ContactInteractionDialogProps> = ({
  contactId,
  contactName,
  open,
  onOpenChange,
  onSuccess
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    interaction_type: '',
    subject: '',
    notes: '',
    scheduled_at: '',
    follow_up_date: null as Date | null,
    completed_at: new Date()
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);

    const interactionData = {
      user_id: user.id,
      contact_id: contactId,
      interaction_type: formData.interaction_type,
      subject: formData.subject || null,
      notes: formData.notes || null,
      scheduled_at: formData.scheduled_at || null,
      follow_up_date: formData.follow_up_date ? format(formData.follow_up_date, 'yyyy-MM-dd') : null,
      completed_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('contact_interactions')
      .insert(interactionData);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add interaction. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Contact interaction added successfully!",
      });
      
      // Reset form
      setFormData({
        interaction_type: '',
        subject: '',
        notes: '',
        scheduled_at: '',
        follow_up_date: null,
        completed_at: new Date()
      });
      
      onSuccess();
      onOpenChange(false);
    }

    setIsLoading(false);
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Interaction</DialogTitle>
          <DialogDescription>
            Record an interaction with {contactName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="interaction_type">Interaction Type</Label>
            <Select
              value={formData.interaction_type}
              onValueChange={(value) => updateFormData('interaction_type', value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select interaction type" />
              </SelectTrigger>
              <SelectContent>
                {INTERACTION_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Brief subject of the interaction"
              value={formData.subject}
              onChange={(e) => updateFormData('subject', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Detailed notes about the interaction..."
              rows={3}
              value={formData.notes}
              onChange={(e) => updateFormData('notes', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Follow-up Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.follow_up_date && "text-muted-foreground"
                  )}
                  type="button"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.follow_up_date ? (
                    format(formData.follow_up_date, "PPP")
                  ) : (
                    <span>Set follow-up date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.follow_up_date}
                  onSelect={(date) => updateFormData('follow_up_date', date)}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.interaction_type}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Interaction
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContactInteractionDialog;