import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ContactCard from '@/components/contacts/ContactCard';
import { ContactCardSkeleton } from '@/components/contacts/ContactCardSkeleton';
import ContactInteractionDialog from '@/components/contacts/ContactInteractionDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Phone, Mail, MapPin, Calendar, MessageSquare, Search, Filter, Users } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { EmptyState } from '@/components/ui/EmptyState';

type Contact = Tables<'contacts'>;

interface NewContact {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  contact_type: Contact['contact_type'];
  status: Contact['status'];
  lead_source?: Contact['lead_source'];
  notes: string;
  budget_min: string;
  budget_max: string;
  preferred_areas: string;
}

const Contacts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [interactionDialog, setInteractionDialog] = useState<{
    open: boolean;
    contactId: string;
    contactName: string;
  }>({
    open: false,
    contactId: '',
    contactName: ''
  });
  
  const [newContact, setNewContact] = useState<NewContact>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    contact_type: 'buyer',
    status: 'new',
    lead_source: undefined,
    notes: '',
    budget_min: '',
    budget_max: '',
    preferred_areas: '',
  });

  useEffect(() => {
    if (user) {
      loadContacts();
    }
  }, [user]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadContacts = async () => {
    if (!user) return;
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load contacts. Please try again.",
        variant: "destructive",
      });
    } else {
      setContacts(data || []);
    }
    
    setIsLoading(false);
  };

  const handleCreateContact = async () => {
    if (!user) return;
    
    if (!newContact.first_name || !newContact.last_name) {
      toast({
        title: "Error",
        description: "First name and last name are required.",
        variant: "destructive",
      });
      return;
    }

    const contactData = {
      user_id: user.id,
      first_name: newContact.first_name,
      last_name: newContact.last_name,
      email: newContact.email || null,
      phone: newContact.phone || null,
      address: newContact.address || null,
      city: newContact.city || null,
      state: newContact.state || null,
      zip_code: newContact.zip_code || null,
      contact_type: newContact.contact_type,
      status: newContact.status,
      lead_source: newContact.lead_source || null,
      notes: newContact.notes || null,
      budget_min: newContact.budget_min ? parseFloat(newContact.budget_min) : null,
      budget_max: newContact.budget_max ? parseFloat(newContact.budget_max) : null,
      preferred_areas: newContact.preferred_areas ? newContact.preferred_areas.split(',').map(area => area.trim()) : null,
    };

    const { error } = await supabase
      .from('contacts')
      .insert(contactData);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create contact. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Contact created successfully!",
      });
      setIsDialogOpen(false);
      setNewContact({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        contact_type: 'buyer',
        status: 'new',
        lead_source: undefined,
        notes: '',
        budget_min: '',
        budget_max: '',
        preferred_areas: '',
      });
      loadContacts();
    }
  };

  const getStatusColor = (status: Contact['status']) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'qualified': return 'bg-green-100 text-green-800';
      case 'interested': return 'bg-purple-100 text-purple-800';
      case 'not_interested': return 'bg-gray-100 text-gray-800';
      case 'do_not_call': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: Contact['contact_type']) => {
    switch (type) {
      case 'buyer': return 'bg-green-100 text-green-800';
      case 'seller': return 'bg-orange-100 text-orange-800';
      case 'investor': return 'bg-purple-100 text-purple-800';
      case 'referral_partner': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = debouncedSearch === '' || 
      contact.first_name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      contact.last_name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      contact.email?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      contact.phone?.includes(debouncedSearch);
    
    const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;
    const matchesType = typeFilter === 'all' || contact.contact_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleAddInteraction = (contactId: string, contactName: string) => {
    setInteractionDialog({
      open: true,
      contactId,
      contactName
    });
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;

    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contactId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete contact. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Contact deleted successfully!",
      });
      loadContacts();
    }
  };

  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setIsEditDialogOpen(true);
  };

  const handleUpdateContact = async () => {
    if (!editingContact || !user) return;

    const { error } = await supabase
      .from('contacts')
      .update({
        first_name: editingContact.first_name,
        last_name: editingContact.last_name,
        email: editingContact.email,
        phone: editingContact.phone,
        address: editingContact.address,
        city: editingContact.city,
        state: editingContact.state,
        zip_code: editingContact.zip_code,
        contact_type: editingContact.contact_type,
        status: editingContact.status,
        lead_source: editingContact.lead_source,
        notes: editingContact.notes,
        budget_min: editingContact.budget_min,
        budget_max: editingContact.budget_max,
        preferred_areas: editingContact.preferred_areas,
      })
      .eq('id', editingContact.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update contact. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Contact updated successfully!",
      });
      setIsEditDialogOpen(false);
      setEditingContact(null);
      loadContacts();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground">
            Manage your leads and client relationships
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Contact</DialogTitle>
              <DialogDescription>
                Create a new contact record. Fields marked with * are required.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={newContact.first_name}
                    onChange={(e) => setNewContact(prev => ({ ...prev, first_name: e.target.value }))}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={newContact.last_name}
                    onChange={(e) => setNewContact(prev => ({ ...prev, last_name: e.target.value }))}
                    placeholder="Doe"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newContact.email}
                    onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={newContact.phone}
                    onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={newContact.address}
                  onChange={(e) => setNewContact(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="123 Main St"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={newContact.city}
                    onChange={(e) => setNewContact(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="New York"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={newContact.state}
                    onChange={(e) => setNewContact(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="NY"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip_code">ZIP Code</Label>
                  <Input
                    id="zip_code"
                    value={newContact.zip_code}
                    onChange={(e) => setNewContact(prev => ({ ...prev, zip_code: e.target.value }))}
                    placeholder="10001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_type">Contact Type</Label>
                  <Select 
                    value={newContact.contact_type} 
                    onValueChange={(value: Contact['contact_type']) => 
                      setNewContact(prev => ({ ...prev, contact_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buyer">Buyer</SelectItem>
                      <SelectItem value="seller">Seller</SelectItem>
                      <SelectItem value="investor">Investor</SelectItem>
                      <SelectItem value="referral_partner">Referral Partner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={newContact.status} 
                    onValueChange={(value: Contact['status']) => 
                      setNewContact(prev => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="interested">Interested</SelectItem>
                      <SelectItem value="not_interested">Not Interested</SelectItem>
                      <SelectItem value="do_not_call">Do Not Call</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lead_source">Lead Source</Label>
                <Select 
                  value={newContact.lead_source || ''} 
                  onValueChange={(value: Contact['lead_source']) => 
                    setNewContact(prev => ({ ...prev, lead_source: value || undefined }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                    <SelectItem value="cold_call">Cold Call</SelectItem>
                    <SelectItem value="open_house">Open House</SelectItem>
                    <SelectItem value="advertisement">Advertisement</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget_min">Budget Min</Label>
                  <Input
                    id="budget_min"
                    type="number"
                    value={newContact.budget_min}
                    onChange={(e) => setNewContact(prev => ({ ...prev, budget_min: e.target.value }))}
                    placeholder="250000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget_max">Budget Max</Label>
                  <Input
                    id="budget_max"
                    type="number"
                    value={newContact.budget_max}
                    onChange={(e) => setNewContact(prev => ({ ...prev, budget_max: e.target.value }))}
                    placeholder="500000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferred_areas">Preferred Areas</Label>
                <Input
                  id="preferred_areas"
                  value={newContact.preferred_areas}
                  onChange={(e) => setNewContact(prev => ({ ...prev, preferred_areas: e.target.value }))}
                  placeholder="Downtown, Midtown, Upper East Side"
                />
                <p className="text-xs text-muted-foreground">Separate multiple areas with commas</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newContact.notes}
                  onChange={(e) => setNewContact(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about this contact..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateContact}>
                Create Contact
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  className="pl-10"
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="interested">Interested</SelectItem>
                  <SelectItem value="not_interested">Not Interested</SelectItem>
                  <SelectItem value="do_not_call">Do Not Call</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type-filter">Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="buyer">Buyer</SelectItem>
                  <SelectItem value="seller">Seller</SelectItem>
                  <SelectItem value="investor">Investor</SelectItem>
                  <SelectItem value="referral_partner">Referral Partner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setTypeFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contacts Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Contact List ({filteredContacts.length})</CardTitle>
          <CardDescription>
            Manage and track your real estate contacts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <ContactCardSkeleton key={i} />
              ))}
            </div>
          ) : contacts.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No contacts yet"
              description="Start building your network by adding your first contact. Track leads, clients, and referral partners all in one place."
              actionLabel="Add Your First Contact"
              onAction={() => setIsDialogOpen(true)}
            />
          ) : filteredContacts.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No matches found"
              description="Try adjusting your search or filters to find what you're looking for."
              actionLabel="Clear Filters"
              onAction={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setTypeFilter('all');
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredContacts.map((contact) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  onEdit={handleEditContact}
                  onDelete={handleDeleteContact}
                  onAddInteraction={handleAddInteraction}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ContactInteractionDialog
        contactId={interactionDialog.contactId}
        contactName={interactionDialog.contactName}
        open={interactionDialog.open}
        onOpenChange={(open) => setInteractionDialog(prev => ({ ...prev, open }))}
        onSuccess={() => {
          toast({
            title: "Success",
            description: "Interaction added successfully!",
          });
        }}
      />

      {/* Edit Contact Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
            <DialogDescription>
              Update contact information.
            </DialogDescription>
          </DialogHeader>
          {editingContact && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_first_name">First Name *</Label>
                  <Input
                    id="edit_first_name"
                    value={editingContact.first_name}
                    onChange={(e) => setEditingContact(prev => prev ? { ...prev, first_name: e.target.value } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_last_name">Last Name *</Label>
                  <Input
                    id="edit_last_name"
                    value={editingContact.last_name}
                    onChange={(e) => setEditingContact(prev => prev ? { ...prev, last_name: e.target.value } : null)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_email">Email</Label>
                  <Input
                    id="edit_email"
                    type="email"
                    value={editingContact.email || ''}
                    onChange={(e) => setEditingContact(prev => prev ? { ...prev, email: e.target.value } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_phone">Phone</Label>
                  <Input
                    id="edit_phone"
                    value={editingContact.phone || ''}
                    onChange={(e) => setEditingContact(prev => prev ? { ...prev, phone: e.target.value } : null)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_contact_type">Contact Type</Label>
                  <Select 
                    value={editingContact.contact_type} 
                    onValueChange={(value: Contact['contact_type']) => 
                      setEditingContact(prev => prev ? { ...prev, contact_type: value } : null)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buyer">Buyer</SelectItem>
                      <SelectItem value="seller">Seller</SelectItem>
                      <SelectItem value="investor">Investor</SelectItem>
                      <SelectItem value="referral_partner">Referral Partner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_status">Status</Label>
                  <Select 
                    value={editingContact.status} 
                    onValueChange={(value: Contact['status']) => 
                      setEditingContact(prev => prev ? { ...prev, status: value } : null)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="interested">Interested</SelectItem>
                      <SelectItem value="not_interested">Not Interested</SelectItem>
                      <SelectItem value="do_not_call">Do Not Call</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_notes">Notes</Label>
                <Textarea
                  id="edit_notes"
                  value={editingContact.notes || ''}
                  onChange={(e) => setEditingContact(prev => prev ? { ...prev, notes: e.target.value } : null)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              setEditingContact(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateContact}>
              Update Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Contacts;