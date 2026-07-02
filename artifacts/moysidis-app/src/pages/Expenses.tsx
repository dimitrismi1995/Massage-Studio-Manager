import React from 'react';
import { useLanguage } from '@/lib/i18n';
import { useListExpenses, getListExpensesQueryKey, useCreateExpense, useDeleteExpense, useUpdateExpense } from '@workspace/api-client-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDateFormatter, formatCurrency } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';

const CATEGORIES = ['Oils & Products', 'Equipment', 'Transport', 'Marketing', 'Training', 'Insurance', 'Office', 'Other'];

export default function ExpensesPage() {
  const { t } = useLanguage();
  const { formatDate } = useDateFormatter();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const { data: expenses, isLoading } = useListExpenses(undefined, { query: { queryKey: getListExpensesQueryKey() } });
  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();
  const updateExpense = useUpdateExpense();

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      category: formData.get('category') as string,
      description: formData.get('description') as string,
      amount: parseFloat(formData.get('amount') as string),
      date: formData.get('date') as string,
    };
    
    createExpense.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListExpensesQueryKey() });
        setIsDialogOpen(false);
      }
    });
  };

  const handleDelete = (id: number) => {
    if(confirm('Delete this expense?')) {
      deleteExpense.mutate({ expenseId: id }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getListExpensesQueryKey() })
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-primary">{t('expenses.title')}</h1>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>{t('expenses.create')}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('expenses.create')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>{t('expenses.date')}</Label>
                <Input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="space-y-2">
                <Label>{t('expenses.category')}</Label>
                <Select name="category" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('expenses.description')}</Label>
                <Input name="description" required />
              </div>
              <div className="space-y-2">
                <Label>{t('expenses.amount')}</Label>
                <Input type="number" step="0.01" name="amount" required />
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{t('action.cancel')}</Button>
                <Button type="submit" disabled={createExpense.isPending}>{t('action.save')}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>{t('expenses.category')}</TableHead>
              <TableHead>{t('expenses.description')}</TableHead>
              <TableHead className="text-right">{t('expenses.amount')}</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center p-8">Loading...</TableCell></TableRow>
            ) : expenses?.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center p-8">No expenses logged.</TableCell></TableRow>
            ) : (
              expenses?.map((exp) => (
                <TableRow key={exp.id}>
                  <TableCell>{formatDate(exp.date)}</TableCell>
                  <TableCell><span className="bg-muted px-2 py-1 rounded-md text-xs font-medium">{exp.category}</span></TableCell>
                  <TableCell>{exp.description}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(exp.amount)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(exp.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
