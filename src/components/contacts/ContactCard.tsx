import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Phone, 
  MapPin, 
  MessageSquare, 
  DollarSign,
  User,
  Edit,
  Trash2
} from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type Contact = Tables<'contacts'>;

interface ContactCardProps {
  contact: Contact;
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
  onAddInteraction: (contactId: string, contactName: string) => void;
}

const ContactCard: React.FC<ContactCardProps> = ({ 
  contact, 
  onEdit, 
  onDelete, 
  onAddInteraction 
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'contacted': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'qualified': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'interested': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'not_interested': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'do_not_call': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'buyer': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'seller': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'investor': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'referral_partner': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatBudget = (min?: number | null, max?: number | null) => {
    if (!min && !max) return null;
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `$${min.toLocaleString()}+`;
    if (max) return `Up to $${max.toLocaleString()}`;
    return null;
  };

  const fullName = `${contact.first_name} ${contact.last_name}`;
  const budget = formatBudget(contact.budget_min, contact.budget_max);

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{fullName}</CardTitle>
              <div className="flex gap-2 mt-1">
                <Badge className={getStatusColor(contact.status)}>
                  {contact.status.replace('_', ' ')}
                </Badge>
                <Badge className={getTypeColor(contact.contact_type)}>
                  {contact.contact_type.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(contact)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(contact.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {contact.email && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>{contact.email}</span>
          </div>
        )}

        {contact.phone && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{contact.phone}</span>
          </div>
        )}

        {(contact.city || contact.state) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>
              {[contact.city, contact.state].filter(Boolean).join(', ')}
            </span>
          </div>
        )}

        {budget && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span>{budget}</span>
          </div>
        )}

        {contact.lead_source && (
          <div className="text-xs text-muted-foreground">
            Source: {contact.lead_source.replace('_', ' ')}
          </div>
        )}

        {contact.notes && (
          <div className="text-sm text-muted-foreground bg-muted/50 rounded p-2">
            {contact.notes}
          </div>
        )}

        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onAddInteraction(contact.id, fullName)}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Add Interaction
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContactCard;