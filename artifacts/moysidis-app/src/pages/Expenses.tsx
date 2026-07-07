import React from 'react';
import { useLanguage } from '@/lib/i18n';
import { useListExpenses, getListExpensesQueryKey, useCreateExpense, useDeleteExpense } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDateFormatter, formatCurrency } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import { Trash2, ReceiptText } from 'lucide-react';

const CATEGORIES = ['Oils & Products', 'Equipment', 'Transport', 'Marketing', 'Training', 'Insurance', 'Office', 'Other'];

export default function ExpensesPage() {
  const { t } = useLanguage();
  const { formatDate } = useDateFormatter();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const { data: expenses, isLoading } = useListExpenses(undefined, { query: { queryKey: getListExpensesQueryKey() } });
  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();

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
    if (confirm('Delete this expense?')) {
      deleteExpense.mutate({ expenseId: id }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getListExpensesQueryKey() })
      });
    }
  };

  const empty = !isLoading && (!expenses || expenses.length === 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-primary">{t('expenses.title')}</h1>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">{t('expenses.create')}</Button>
          </DialogTrigger>
          <DialogContent className="w-[calc(100vw-2rem)] max-w-md mx-auto">
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
              <DialogFooter className="pt-4 flex-col sm:flex-row gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">{t('action.cancel')}</Button>
                <Button type="submit" disabled={createExpense.isPending} className="w-full sm:w-auto">{t('action.save')}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Loading */}
      {isLoading && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">Loading...</CardContent>
        </Card>
      )}

      {/* Empty state */}
      {empty && (
        <Card>
          <CardContent className="p-10 flex flex-col items-center gap-3 text-center">
            <ReceiptText className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">No expenses logged yet.</p>
            <p className="text-xs text-muted-foreground/60">Tap "Add Expense" to record oils, equipment, transport and more.</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !empty && (
        <>
          {/* Mobile card list */}
          <div className="flex flex-col gap-3 md:hidden">
            {expenses?.map((exp) => (
              <Card key={exp.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-muted px-2 py-0.5 rounded-md text-xs font-medium">{exp.category}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(exp.date)}</span>
                      </div>
                      <p className="text-sm text-foreground truncate">{exp.description}</p>
                      <p className="text-sm font-semibold text-primary">{formatCurrency(exp.amount)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(exp.id)}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop table */}
          <Card className="hidden md:block">
            <div className="w-full overflow-x-auto">
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
                  {expenses?.map((exp) => (
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
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
