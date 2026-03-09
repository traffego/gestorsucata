import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/contexts/StoreContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Calendar, DollarSign, Loader2, CreditCard, Banknote, Zap } from 'lucide-react';

interface SalesReportProps {
    onDateRangeChange?: (startDate: string, endDate: string) => void;
}

export function SalesReport({ onDateRangeChange }: SalesReportProps) {
    const { lojaAtual } = useStore();
    const { user } = useAuth();

    // Default to today
    const [startDate, setStartDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });
    
    const [endDate, setEndDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });

    const [loading, setLoading] = useState(false);
    
    // Totais fixos do dia, semana, mês atuais
    const [totais, setTotais] = useState({ dia: 0, semana: 0, mes: 0 });
    
    // Resumo baseado no filtro
    const [resumoFormas, setResumoFormas] = useState({ pix: 0, cartao: 0, dinheiro: 0, outros: 0 });

    useEffect(() => {
        if (lojaAtual && user) {
            fetchReportData();
        }
        if (onDateRangeChange) {
            onDateRangeChange(startDate, endDate);
        }
    }, [lojaAtual, user, startDate, endDate]);

    async function fetchReportData() {
        setLoading(true);
        try {
            // Data de hoje para os totais fixos
            const now = new Date();
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay()); // Domingo como primeiro dia
            startOfWeek.setHours(0, 0, 0, 0);

            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            // Fetch vendas do mês atual para calcular dia, semana, mês
            // e vendas do intervalo para as formas de pagamento
            
            // As Date filters for Supabase
            const startFilter = new Date(startDate);
            startFilter.setHours(0, 0, 0, 0);
            
            const endFilter = new Date(endDate);
            endFilter.setHours(23, 59, 59, 999);

            // Precisamos do mínimo entre startOfMonth e startFilter para pegar tudo em uma query, ou fazemos duas queries.
            // Farei duas queries para manter a lógica simples:
            // 1. Query do Mês (Para totais)
            let monthQuery = supabase
                .from('vendas')
                .select('valor_total, data_venda')
                .eq('vendedor_id', user!.id)
                .gte('data_venda', startOfMonth.toISOString());
            
            if (lojaAtual) monthQuery = monthQuery.eq('loja_id', lojaAtual.id);

            // 2. Query do Filtro (Para formas de pgto do período)
            let filterQuery = supabase
                .from('vendas')
                .select('valor_total, forma_pagamento, data_venda')
                .eq('vendedor_id', user!.id)
                .gte('data_venda', startFilter.toISOString())
                .lte('data_venda', endFilter.toISOString());
                
            if (lojaAtual) filterQuery = filterQuery.eq('loja_id', lojaAtual.id);

            const [monthRes, filterRes] = await Promise.all([monthQuery, filterQuery]);

            if (monthRes.data) {
                let d = 0, s = 0, m = 0;
                monthRes.data.forEach(v => {
                    const vd = new Date(v.data_venda);
                    const val = Number(v.valor_total || 0);
                    m += val;
                    if (vd >= startOfWeek) s += val;
                    if (vd >= startOfToday) d += val;
                });
                setTotais({ dia: d, semana: s, mes: m });
            }

            if (filterRes.data) {
                let pix = 0, cartao = 0, din = 0, outros = 0;
                filterRes.data.forEach(v => {
                    const val = Number(v.valor_total || 0);
                    const fp = (v.forma_pagamento || '').toLowerCase();
                    if (fp === 'pix') pix += val;
                    else if (fp === 'cartao' || fp === 'cartão') cartao += val;
                    else if (fp === 'dinheiro') din += val;
                    else outros += val;
                });
                setResumoFormas({ pix, cartao, dinheiro: din, outros });
            }

        } catch (error) {
            console.error("Erro ao buscar dados do relatório:", error);
        } finally {
            setLoading(false);
        }
    }

    const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <Card className="bg-brand-dark border-gray-800 text-white mb-6">
            <CardHeader className="pb-4 border-b border-gray-800/50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <DollarSign className="h-5 w-5 text-brand-yellow" />
                        Resumo de Vendas
                    </CardTitle>
                    
                    <div className="flex items-center gap-2 bg-brand-darker/50 p-1.5 rounded-lg border border-gray-800">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500 ml-2" />
                            <Input 
                                type="date" 
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-transparent border-0 h-8 text-xs text-brand-yellow focus-visible:ring-0 px-2 w-[120px]"
                            />
                        </div>
                        <span className="text-gray-600 text-xs">até</span>
                        <div className="flex items-center gap-2">
                            <Input 
                                type="date" 
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-transparent border-0 h-8 text-xs text-brand-yellow focus-visible:ring-0 px-2 w-[120px]"
                            />
                        </div>
                        {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-500 mr-2" />}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Totais Fixos */}
                    <div className="space-y-4">
                        <div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Hoje</p>
                            <p className="text-xl font-bold text-white">{fmt(totais.dia)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Nesta Semana</p>
                            <p className="text-lg font-bold text-gray-300">{fmt(totais.semana)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Neste Mês</p>
                            <p className="text-lg font-bold text-gray-300">{fmt(totais.mes)}</p>
                        </div>
                    </div>

                    {/* Resumo por Formas de Pagamento (Filtro) */}
                    <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-brand-darker/30 border border-gray-800 rounded-xl p-4 flex flex-col justify-center">
                            <div className="flex items-center justify-between mb-2">
                                <Zap className="h-5 w-5 text-brand-yellow" />
                                <span className="text-[10px] font-black text-brand-yellow uppercase tracking-widest bg-brand-yellow/10 px-2 py-1 rounded">PIX</span>
                            </div>
                            <p className="text-2xl font-black text-white">{fmt(resumoFormas.pix)}</p>
                            <p className="text-[10px] text-gray-500 mt-1">no período filtrado</p>
                        </div>
                        
                        <div className="bg-brand-darker/30 border border-gray-800 rounded-xl p-4 flex flex-col justify-center">
                            <div className="flex items-center justify-between mb-2">
                                <CreditCard className="h-5 w-5 text-brand-red" />
                                <span className="text-[10px] font-black text-brand-red uppercase tracking-widest bg-brand-red/10 px-2 py-1 rounded">Cartão</span>
                            </div>
                            <p className="text-2xl font-black text-white">{fmt(resumoFormas.cartao)}</p>
                            <p className="text-[10px] text-gray-500 mt-1">no período filtrado</p>
                        </div>
                        
                        <div className="bg-brand-darker/30 border border-gray-800 rounded-xl p-4 flex flex-col justify-center">
                            <div className="flex items-center justify-between mb-2">
                                <Banknote className="h-5 w-5 text-green-500" />
                                <span className="text-[10px] font-black text-green-500 uppercase tracking-widest bg-green-500/10 px-2 py-1 rounded">Dinheiro</span>
                            </div>
                            <p className="text-2xl font-black text-white">{fmt(resumoFormas.dinheiro)}</p>
                            <p className="text-[10px] text-gray-500 mt-1">no período filtrado</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
