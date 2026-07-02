import React from 'react';
import { useLanguage } from '@/lib/i18n';
import { useGetFinanceSummary, useGetMonthlyBreakdown, useGetTopServices, getGetFinanceSummaryQueryKey, getGetMonthlyBreakdownQueryKey, getGetTopServicesQueryKey } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function FinancePage() {
  const { t } = useLanguage();
  const [year, setYear] = React.useState(new Date().getFullYear());

  const { data: summary, isLoading: summaryLoading } = useGetFinanceSummary({ period: 'year' }, { query: { queryKey: getGetFinanceSummaryQueryKey({ period: 'year' }) } });
  const { data: monthly, isLoading: monthlyLoading } = useGetMonthlyBreakdown({ year }, { query: { queryKey: getGetMonthlyBreakdownQueryKey({ year }) } });
  const { data: topServices, isLoading: topLoading } = useGetTopServices({ year }, { query: { queryKey: getGetTopServicesQueryKey({ year }) } });

  const chartData = monthly?.map(m => ({
    name: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m.month - 1],
    Income: m.income,
    Expenses: m.expenses,
    Profit: m.profit
  })) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-primary">{t('finance.title')}</h1>
        <select 
          className="bg-card border rounded px-3 py-1.5"
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
        >
          {[0,1,2].map(i => {
            const y = new Date().getFullYear() - i;
            return <option key={y} value={y}>{y}</option>;
          })}
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Yearly Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{summaryLoading ? '...' : formatCurrency(summary?.totalIncome || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Yearly Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{summaryLoading ? '...' : formatCurrency(summary?.totalExpenses || 0)}</div>
          </CardContent>
        </Card>
        <Card className="bg-accent/10 border-accent/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-accent">Yearly Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{summaryLoading ? '...' : formatCurrency(summary?.profit || 0)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{t('finance.income_vs_expenses')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full mt-4">
              {monthlyLoading ? <div className="flex h-full items-center justify-center text-muted-foreground">Loading chart...</div> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }} barGap={0}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dx={-10} tickFormatter={val => `${val/1000}k`} />
                    <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} formatter={(value: number) => formatCurrency(value)} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: 20 }} />
                    <Bar dataKey="Income" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="Expenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('finance.revenue_by_service')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              {topLoading ? <div className="flex h-full items-center justify-center text-muted-foreground">Loading...</div> : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topServices || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="revenue"
                      nameKey="serviceType"
                    >
                      {topServices?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend layout="vertical" verticalAlign="bottom" iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
