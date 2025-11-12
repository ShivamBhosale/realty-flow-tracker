import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CSVImportDialog } from '@/components/contacts/CSVImportDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Upload, Edit, Trash2, Search } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { format } from 'date-fns';

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
  contract_date: string;
  closed_date: string;
  pending_date: string;
  fee: string;
  price: string;
  paid_income: string;
  estimated_commission: string;
  days_on_market: string;
}

const Contacts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
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
    contract_date: '',
    closed_date: '',
    pending_date: '',
    fee: '',
    price: '',
    paid_income: '',
    estimated_commission: '',
    days_on_market: '',
  });

  useEffect(() => {
    if (user) {
      loadContacts();
    }
  }, [user]);

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

  const updateDailyMetrics = async (contactData: any, isDelete: boolean = false) => {
    if (!user) return;

    const metricsDate = contactData.closed_date || contactData.contract_date;
    if (!metricsDate) return;

    try {
      const { data: existingMetrics } = await supabase
        .from('daily_metrics')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', metricsDate)
        .maybeSingle();

      if (existingMetrics) {
        const updates: any = {};
        const multiplier = isDelete ? -1 : 1;
        
        if (contactData.closed_date) {
          updates.closed_deals = Math.max(0, (existingMetrics.closed_deals || 0) + (multiplier * 1));
          if (contactData.paid_income) {
            updates.volume_closed = Math.max(0, (existingMetrics.volume_closed || 0) + (multiplier * parseFloat(contactData.paid_income)));
          }
        }
        
        if (contactData.contract_date) {
          if (contactData.contact_type === 'buyer') {
            updates.buyers_signed = Math.max(0, (existingMetrics.buyers_signed || 0) + (multiplier * 1));
          } else if (contactData.contact_type === 'seller') {
            updates.listings_taken = Math.max(0, (existingMetrics.listings_taken || 0) + (multiplier * 1));
          }
        }

        await supabase
          .from('daily_metrics')
          .update(updates)
          .eq('id', existingMetrics.id);
      } else if (!isDelete) {
        const newMetrics: any = {
          user_id: user.id,
          date: metricsDate,
        };

        if (contactData.closed_date) {
          newMetrics.closed_deals = 1;
          newMetrics.volume_closed = contactData.paid_income ? parseFloat(contactData.paid_income) : 0;
        }
        
        if (contactData.contract_date) {
          if (contactData.contact_type === 'buyer') {
            newMetrics.buyers_signed = 1;
          } else if (contactData.contact_type === 'seller') {
            newMetrics.listings_taken = 1;
          }
        }

        await supabase
          .from('daily_metrics')
          .insert(newMetrics);
      }
    } catch (err) {
      console.error('Error updating daily metrics:', err);
    }
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
      contract_date: newContact.contract_date || null,
      closed_date: newContact.closed_date || null,
      pending_date: newContact.pending_date || null,
      fee: newContact.fee ? parseFloat(newContact.fee) : null,
      price: newContact.price ? parseFloat(newContact.price) : null,
      paid_income: newContact.paid_income ? parseFloat(newContact.paid_income) : null,
      estimated_commission: newContact.estimated_commission ? parseFloat(newContact.estimated_commission) : null,
      days_on_market: newContact.days_on_market ? parseInt(newContact.days_on_market) : null,
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
      // Update daily metrics if dates are present
      await updateDailyMetrics(contactData);
      
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
        contract_date: '',
        closed_date: '',
        pending_date: '',
        fee: '',
        price: '',
        paid_income: '',
        estimated_commission: '',
        days_on_market: '',
      });
      loadContacts();
    }
  };

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
        contract_date: editingContact.contract_date,
        closed_date: editingContact.closed_date,
        pending_date: editingContact.pending_date,
        fee: editingContact.fee,
        price: editingContact.price,
        paid_income: editingContact.paid_income,
        estimated_commission: editingContact.estimated_commission,
        days_on_market: editingContact.days_on_market,
      })
      .eq('id', editingContact.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update contact. Please try again.",
        variant: "destructive",
      });
    } else {
      await updateDailyMetrics(editingContact);
      
      toast({
        title: "Success",
        description: "Contact updated successfully!",
      });
      setIsEditDialogOpen(false);
      setEditingContact(null);
      loadContacts();
    }
  };

  const handleDeleteContact = async (contact: Contact) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;

    await updateDailyMetrics(contact, true);

    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contact.id);

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

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = debouncedSearch === '' || 
      contact.first_name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      contact.last_name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      contact.email?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      contact.phone?.includes(debouncedSearch);
    
    return matchesSearch;
  });

  const formatCurrency = (value: number | null) => {
    if (!value) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return format(new Date(date), 'MM/dd/yyyy');
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
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
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
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      value={newContact.last_name}
                      onChange={(e) => setNewContact(prev => ({ ...prev, last_name: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={newContact.email}
                      onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={newContact.phone}
                      onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input
                    value={newContact.address}
                    onChange={(e) => setNewContact(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      value={newContact.city}
                      onChange={(e) => setNewContact(prev => ({ ...prev, city: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Input
                      value={newContact.state}
                      onChange={(e) => setNewContact(prev => ({ ...prev, state: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>ZIP Code</Label>
                    <Input
                      value={newContact.zip_code}
                      onChange={(e) => setNewContact(prev => ({ ...prev, zip_code: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Contact Type</Label>
                    <Select 
                      value={newContact.contact_type} 
                      onValueChange={(value: Contact['contact_type']) => 
                        setNewContact(prev => ({ ...prev, contact_type: value }))
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
                    <Label>Status</Label>
                    <Select 
                      value={newContact.status} 
                      onValueChange={(value: Contact['status']) => 
                        setNewContact(prev => ({ ...prev, status: value }))
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
                  <Label>Source Type</Label>
                  <Select 
                    value={newContact.lead_source || ''} 
                    onValueChange={(value: Contact['lead_source']) => 
                      setNewContact(prev => ({ ...prev, lead_source: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select source type" />
                    </SelectTrigger>
                    <SelectContent className="bg-background">
                      <SelectItem value="past_client">Past Client</SelectItem>
                      <SelectItem value="expired_listing">Expired Listing</SelectItem>
                      <SelectItem value="for_sale_by_owner">For Sale by Owner</SelectItem>
                      <SelectItem value="center_of_influence">Center of Influence</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="just_listed">Just Listed</SelectItem>
                      <SelectItem value="just_sold">Just Sold</SelectItem>
                      <SelectItem value="sign_call">Sign Call</SelectItem>
                      <SelectItem value="advertisement_call">Advertisement Call</SelectItem>
                      <SelectItem value="paid_lead_source">Paid Lead Source</SelectItem>
                      <SelectItem value="social_media">Social Media</SelectItem>
                      <SelectItem value="cold_call">Cold Call</SelectItem>
                      <SelectItem value="open_house">Open House</SelectItem>
                      <SelectItem value="door_knocking">Door Knocking</SelectItem>
                      <SelectItem value="frbo">Frbo</SelectItem>
                      <SelectItem value="probate">Probate</SelectItem>
                      <SelectItem value="absentee_owner">Absentee Owner</SelectItem>
                      <SelectItem value="attorney_referral">Attorney Referral</SelectItem>
                      <SelectItem value="agent_2_agent_calls">Agent 2 Agent Calls</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="advertisement">Advertisement</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Contract Date</Label>
                    <Input
                      type="date"
                      value={newContact.contract_date}
                      onChange={(e) => setNewContact(prev => ({ ...prev, contract_date: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Closed Date</Label>
                    <Input
                      type="date"
                      value={newContact.closed_date}
                      onChange={(e) => setNewContact(prev => ({ ...prev, closed_date: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pending Date</Label>
                    <Input
                      type="date"
                      value={newContact.pending_date}
                      onChange={(e) => setNewContact(prev => ({ ...prev, pending_date: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Price</Label>
                    <Input
                      type="number"
                      value={newContact.price}
                      onChange={(e) => setNewContact(prev => ({ ...prev, price: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fee</Label>
                    <Input
                      type="number"
                      value={newContact.fee}
                      onChange={(e) => setNewContact(prev => ({ ...prev, fee: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Paid Income</Label>
                    <Input
                      type="number"
                      value={newContact.paid_income}
                      onChange={(e) => setNewContact(prev => ({ ...prev, paid_income: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Estimated Commission</Label>
                    <Input
                      type="number"
                      value={newContact.estimated_commission}
                      onChange={(e) => setNewContact(prev => ({ ...prev, estimated_commission: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Days on Market</Label>
                  <Input
                    type="number"
                    value={newContact.days_on_market}
                    onChange={(e) => setNewContact(prev => ({ ...prev, days_on_market: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateContact}>Create Contact</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Loading contacts...</div>
          ) : filteredContacts.length === 0 ? (
            <EmptyState
              icon={Plus}
              title="No contacts found"
              description="Get started by adding your first contact or importing from CSV."
              actionLabel="Add Contact"
              onAction={() => setIsDialogOpen(true)}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary">
                    <TableHead className="text-primary-foreground">ACTION</TableHead>
                    <TableHead className="text-primary-foreground">CLIENT NAME</TableHead>
                    <TableHead className="text-primary-foreground">ADDRESS</TableHead>
                    <TableHead className="text-primary-foreground">TYPE</TableHead>
                    <TableHead className="text-primary-foreground">STATUS</TableHead>
                    <TableHead className="text-primary-foreground">SOURCE TYPE</TableHead>
                    <TableHead className="text-primary-foreground">CONTRACT DATE</TableHead>
                    <TableHead className="text-primary-foreground">CLOSED DATE</TableHead>
                    <TableHead className="text-primary-foreground">PENDING DATE</TableHead>
                    <TableHead className="text-primary-foreground">FEE</TableHead>
                    <TableHead className="text-primary-foreground">PRICE</TableHead>
                    <TableHead className="text-primary-foreground">PAID INCOME</TableHead>
                    <TableHead className="text-primary-foreground">ESTIMATED COMMISSION</TableHead>
                    <TableHead className="text-primary-foreground">CITY</TableHead>
                    <TableHead className="text-primary-foreground">DAYS ON MARKET</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditContact(contact)}
                            className="h-8 w-8 p-0 bg-green-500 hover:bg-green-600 text-white"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteContact(contact)}
                            className="h-8 w-8 p-0 bg-red-500 hover:bg-red-600 text-white"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {contact.first_name} {contact.last_name}
                      </TableCell>
                      <TableCell>{contact.address || '-'}</TableCell>
                      <TableCell className="capitalize">{contact.contact_type}</TableCell>
                      <TableCell className="capitalize">{contact.status.replace('_', ' ')}</TableCell>
                      <TableCell className="capitalize">{contact.lead_source?.replace(/_/g, ' ') || '-'}</TableCell>
                      <TableCell>{formatDate(contact.contract_date)}</TableCell>
                      <TableCell>{formatDate(contact.closed_date)}</TableCell>
                      <TableCell>{formatDate(contact.pending_date)}</TableCell>
                      <TableCell>{formatCurrency(contact.fee)}</TableCell>
                      <TableCell>{formatCurrency(contact.price)}</TableCell>
                      <TableCell>{formatCurrency(contact.paid_income)}</TableCell>
                      <TableCell>{formatCurrency(contact.estimated_commission)}</TableCell>
                      <TableCell>{contact.city || '-'}</TableCell>
                      <TableCell>{contact.days_on_market || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CSVImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImportComplete={loadContacts}
      />

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
          </DialogHeader>
          {editingContact && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input
                    value={editingContact.first_name}
                    onChange={(e) => setEditingContact(prev => prev ? { ...prev, first_name: e.target.value } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input
                    value={editingContact.last_name}
                    onChange={(e) => setEditingContact(prev => prev ? { ...prev, last_name: e.target.value } : null)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Contract Date</Label>
                  <Input
                    type="date"
                    value={editingContact.contract_date || ''}
                    onChange={(e) => setEditingContact(prev => prev ? { ...prev, contract_date: e.target.value } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Closed Date</Label>
                  <Input
                    type="date"
                    value={editingContact.closed_date || ''}
                    onChange={(e) => setEditingContact(prev => prev ? { ...prev, closed_date: e.target.value } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pending Date</Label>
                  <Input
                    type="date"
                    value={editingContact.pending_date || ''}
                    onChange={(e) => setEditingContact(prev => prev ? { ...prev, pending_date: e.target.value } : null)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price</Label>
                  <Input
                    type="number"
                    value={editingContact.price || ''}
                    onChange={(e) => setEditingContact(prev => prev ? { ...prev, price: parseFloat(e.target.value) } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Paid Income</Label>
                  <Input
                    type="number"
                    value={editingContact.paid_income || ''}
                    onChange={(e) => setEditingContact(prev => prev ? { ...prev, paid_income: parseFloat(e.target.value) } : null)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact Type</Label>
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
                  <Label>Status</Label>
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
                <Label>Source Type</Label>
                <Select 
                  value={editingContact.lead_source || ''} 
                  onValueChange={(value: Contact['lead_source']) => 
                    setEditingContact(prev => prev ? { ...prev, lead_source: value } : null)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source type" />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    <SelectItem value="past_client">Past Client</SelectItem>
                    <SelectItem value="expired_listing">Expired Listing</SelectItem>
                    <SelectItem value="for_sale_by_owner">For Sale by Owner</SelectItem>
                    <SelectItem value="center_of_influence">Center of Influence</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="just_listed">Just Listed</SelectItem>
                    <SelectItem value="just_sold">Just Sold</SelectItem>
                    <SelectItem value="sign_call">Sign Call</SelectItem>
                    <SelectItem value="advertisement_call">Advertisement Call</SelectItem>
                    <SelectItem value="paid_lead_source">Paid Lead Source</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                    <SelectItem value="cold_call">Cold Call</SelectItem>
                    <SelectItem value="open_house">Open House</SelectItem>
                    <SelectItem value="door_knocking">Door Knocking</SelectItem>
                    <SelectItem value="frbo">Frbo</SelectItem>
                    <SelectItem value="probate">Probate</SelectItem>
                    <SelectItem value="absentee_owner">Absentee Owner</SelectItem>
                    <SelectItem value="attorney_referral">Attorney Referral</SelectItem>
                    <SelectItem value="agent_2_agent_calls">Agent 2 Agent Calls</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="advertisement">Advertisement</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateContact}>Update Contact</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Contacts;
