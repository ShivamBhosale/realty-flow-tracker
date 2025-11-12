import React, { useState } from 'react';
import Papa from 'papaparse';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

export const CSVImportDialog: React.FC<CSVImportDialogProps> = ({ 
  open, 
  onOpenChange,
  onImportComplete 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsImporting(true);
    setError(null);
    setImportResult(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        let successCount = 0;
        let failedCount = 0;

        for (const row of results.data as any[]) {
          try {
            const contactData = {
              user_id: user.id,
              first_name: row.first_name || row['First Name'] || '',
              last_name: row.last_name || row['Last Name'] || '',
              email: row.email || row['Email'] || null,
              phone: row.phone || row['Phone'] || null,
              address: row.address || row['Address'] || null,
              city: row.city || row['City'] || null,
              state: row.state || row['State'] || null,
              zip_code: row.zip_code || row['ZIP Code'] || null,
              contact_type: row.contact_type || row['Type'] || 'buyer',
              status: row.status || row['Status'] || 'new',
              lead_source: row.lead_source || row['Lead Source'] || null,
              notes: row.notes || row['Notes'] || null,
              budget_min: row.budget_min || row['Budget Min'] ? parseFloat(row.budget_min || row['Budget Min']) : null,
              budget_max: row.budget_max || row['Budget Max'] ? parseFloat(row.budget_max || row['Budget Max']) : null,
              preferred_areas: row.preferred_areas || row['Preferred Areas'] ? 
                (row.preferred_areas || row['Preferred Areas']).split(',').map((a: string) => a.trim()) : null,
              contract_date: row.contract_date || row['Contract Date'] || null,
              closed_date: row.closed_date || row['Closed Date'] || null,
              pending_date: row.pending_date || row['Pending Date'] || null,
              fee: row.fee || row['Fee'] ? parseFloat(row.fee || row['Fee']) : null,
              price: row.price || row['Price'] ? parseFloat(row.price || row['Price']) : null,
              paid_income: row.paid_income || row['Paid Income'] ? parseFloat(row.paid_income || row['Paid Income']) : null,
              estimated_commission: row.estimated_commission || row['Estimated Commission'] ? 
                parseFloat(row.estimated_commission || row['Estimated Commission']) : null,
              days_on_market: row.days_on_market || row['Days on Market'] ? 
                parseInt(row.days_on_market || row['Days on Market']) : null,
            };

            const { error } = await supabase
              .from('contacts')
              .insert(contactData);

            if (error) {
              console.error('Error importing row:', error);
              failedCount++;
            } else {
              successCount++;
              
              // Auto-update daily metrics if contract_date or closed_date is present
              if (contactData.contract_date || contactData.closed_date) {
                await updateDailyMetrics(contactData);
              }
            }
          } catch (err) {
            console.error('Error processing row:', err);
            failedCount++;
          }
        }

        setImportResult({ success: successCount, failed: failedCount });
        setIsImporting(false);

        if (successCount > 0) {
          toast({
            title: "Import Complete",
            description: `Successfully imported ${successCount} contacts${failedCount > 0 ? `, ${failedCount} failed` : ''}.`,
          });
          onImportComplete();
        }
      },
      error: (error) => {
        setError(error.message);
        setIsImporting(false);
      }
    });
  };

  const updateDailyMetrics = async (contactData: any) => {
    if (!user) return;

    // Determine which date to use for metrics update
    const metricsDate = contactData.closed_date || contactData.contract_date;
    if (!metricsDate) return;

    try {
      // Fetch existing metrics for that date
      const { data: existingMetrics } = await supabase
        .from('daily_metrics')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', metricsDate)
        .maybeSingle();

      if (existingMetrics) {
        // Update existing metrics
        const updates: any = {};
        
        if (contactData.closed_date) {
          updates.closed_deals = (existingMetrics.closed_deals || 0) + 1;
          if (contactData.paid_income) {
            updates.volume_closed = (existingMetrics.volume_closed || 0) + contactData.paid_income;
          }
        }
        
        if (contactData.contract_date) {
          if (contactData.contact_type === 'buyer') {
            updates.buyers_signed = (existingMetrics.buyers_signed || 0) + 1;
          } else if (contactData.contact_type === 'seller') {
            updates.listings_taken = (existingMetrics.listings_taken || 0) + 1;
          }
        }

        await supabase
          .from('daily_metrics')
          .update(updates)
          .eq('id', existingMetrics.id);
      } else {
        // Create new metrics entry
        const newMetrics: any = {
          user_id: user.id,
          date: metricsDate,
        };

        if (contactData.closed_date) {
          newMetrics.closed_deals = 1;
          newMetrics.volume_closed = contactData.paid_income || 0;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Contacts from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import multiple contacts at once. The CSV should include columns like:
            first_name, last_name, email, phone, address, city, state, status, type, contract_date, closed_date, price, etc.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label htmlFor="csv-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">CSV files only</p>
              </div>
              <input 
                id="csv-upload" 
                type="file" 
                accept=".csv" 
                className="hidden" 
                onChange={handleFileUpload}
                disabled={isImporting}
              />
            </label>
          </div>

          {isImporting && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Importing contacts... Please wait.
              </AlertDescription>
            </Alert>
          )}

          {importResult && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Import complete! {importResult.success} contacts imported successfully
                {importResult.failed > 0 && `, ${importResult.failed} failed`}.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isImporting}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
