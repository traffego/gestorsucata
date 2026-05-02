import { useCallback, useEffect, useState } from 'react';
import {
    LineChart, Line, BarChart, Bar, AreaChart, Area,
    CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/contexts/StoreContext';
import { Loader2, Store, ArrowUpRight, ArrowDownRight, DollarSign, Wallet, TrendingUp, Calendar, CreditCard, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type PeriodoPreset = 'hoje' | '7d' | '30d' | 'mes' | 'ano' | 'custom';
const FORMAS_PAGAMENTO = ['Todos', 'dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'fiado'];
const FORMA_LABEL: Record<string, string> = {
    Todos: 'Todos', dinheiro: 'Dinheiro', pix: 'Pix',
    cartao_credito: 'Crédito', cartao_debito: 'Débito', fiado: 'Fiado'
};
function getPeriodoDates(preset: PeriodoPreset, customStart: string, customEnd: string): { start: string; end: string } {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const toISO = (d: Date) => d.toISOString();
    const startOfDay = (d: Date) => { d.setHours(0,0,0,0); return d; };
    const endOfDay   = (d: Date) => { d.setHours(23,59,59,999); return d; };
    if (preset === 'hoje') return { start: toISO(startOfDay(new Date(now))), end: toISO(endOfDay(new Date(now))) };
    if (preset === '7d') { const s = new Date(now); s.setDate(s.getDate()-6); return { start: toISO(startOfDay(s)), end: toISO(endOfDay(new Date(now))) }; }
    if (preset === '30d') { const s = new Date(now); s.setDate(s.getDate()-29); return { start: toISO(startOfDay(s)), end: toISO(endOfDay(new Date(now))) }; }
    if (preset === 'mes') { const s = new Date(now.getFullYear(), now.getMonth(), 1); return { start: toISO(s), end: toISO(endOfDay(new Date(now))) }; }
    if (preset === 'ano') { const s = new Date(now.getFullYear(), 0, 1); return { start: toISO(s), end: toISO(endOfDay(new Date(now))) }; }
    // custom
    return { start: customStart ? new Date(customStart).toISOString() : toISO(startOfDay(new Date(now))), end: customEnd ? endOfDay(new Date(customEnd)).toISOString() : toISO(endOfDay(new Date(now))) };
    void pad; // suppress unused
}

type Loja = { id: string; nome: string; is_matriz: boolean };

type StoreFinancials = {
    loja_id: string;
    loja_nome: string;
    is_matriz: boolean;
    entradas: number;
    saidas: number;
    lucro: number;
};

export default function Dashboard() {
    const { lojaAtual, isSuperAdmin, loadingStore } = useStore();

    // Store filter (superadmin only)
    const [allLojas, setAllLojas] = useState<Loja[]>([]);
    const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

    // Period filter
    const [periodo, setPeriodo] = useState<PeriodoPreset>('30d');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd]   = useState('');

    // Payment filter
    const [formaPagamento, setFormaPagamento] = useState('Todos');

    // Financial summary
    const [resumo, setResumo] = useState({ saldo: 0, entradas: 0, saidas: 0, lucro: 0 });
    const [storeFinancials, setStoreFinancials] = useState<StoreFinancials[]>([]);

    // Charts
    const [recentSales, setRecentSales] = useState<any[]>([]);
    const [fluxoCaixa, setFluxoCaixa] = useState<any[]>([]);
    const [despesasPorCategoria, setDespesasPorCategoria] = useState<any[]>([]);
    const [lucroMensal, setLucroMensal] = useState<any[]>([]);
    const [girodeEstoqueData, setGirodeEstoqueData] = useState<any[]>([]);
    const [performanceVendedor, setPerformanceVendedor] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const exportToPDF = () => {
        const doc = new jsPDF();
        const periodoLabel: Record<string, string> = {
            hoje: 'Hoje', '7d': 'Últimos 7 dias', '30d': 'Últimos 30 dias',
            mes: 'Este mês', ano: 'Este ano', custom: `${customStart} → ${customEnd}`
        };
        const lojaLabel = selectedFilter
            ? allLojas.find(l => l.id === selectedFilter)?.nome || 'Loja'
            : 'Todas as lojas';
        const formaLabel: Record<string, string> = {
            Todos: 'Todos', dinheiro: 'Dinheiro', pix: 'Pix',
            cartao_credito: 'Crédito', cartao_debito: 'Débito', fiado: 'Fiado'
        };
        const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const now = new Date().toLocaleString('pt-BR');

        // Header
        doc.setFillColor(18, 18, 18);
        doc.rect(0, 0, 210, 30, 'F');
        doc.setTextColor(255, 215, 0);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('GS PRO — Relatório do Painel', 14, 12);
        doc.setFontSize(8);
        doc.setTextColor(160, 160, 160);
        doc.text(`Gerado em: ${now}`, 14, 19);
        doc.text(`Período: ${periodoLabel[periodo]}  |  Loja: ${lojaLabel}  |  Pagamento: ${formaLabel[formaPagamento]}`, 14, 24);

        // Resumo Financeiro
        doc.setTextColor(30, 30, 30);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Resumo Financeiro', 14, 38);
        autoTable(doc, {
            startY: 42,
            head: [['Saldo', 'Entradas', 'Saídas', 'Lucro']],
            body: [[fmt(resumo.saldo), fmt(resumo.entradas), fmt(resumo.saidas), fmt(resumo.lucro)]],
            headStyles: { fillColor: [30, 30, 30], textColor: [255, 215, 0], fontStyle: 'bold' },
            bodyStyles: { textColor: [30, 30, 30] },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            styles: { fontSize: 9 },
        });

        // Vendas Recentes
        const afterSummary = (doc as any).lastAutoTable.finalY + 8;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Vendas Recentes', 14, afterSummary);
        autoTable(doc, {
            startY: afterSummary + 4,
            head: [['Loja', 'Vendedor', 'Data/Hora', 'Valor']],
            body: recentSales.map(s => [s.loja, s.vendedor, s.data, s.cotacao]),
            headStyles: { fillColor: [30, 30, 30], textColor: [255, 215, 0], fontStyle: 'bold' },
            bodyStyles: { textColor: [30, 30, 30] },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            styles: { fontSize: 9 },
        });

        // Top Vendedores
        if (performanceVendedor.length > 0) {
            const afterRecent = (doc as any).lastAutoTable.finalY + 8;
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('Top Vendedores', 14, afterRecent);
            autoTable(doc, {
                startY: afterRecent + 4,
                head: [['Vendedor', 'Desempenho Relativo (%)']],
                body: performanceVendedor.map(v => [v.name, `${v.value}%`]),
                headStyles: { fillColor: [30, 30, 30], textColor: [255, 215, 0], fontStyle: 'bold' },
                bodyStyles: { textColor: [30, 30, 30] },
                alternateRowStyles: { fillColor: [245, 245, 245] },
                styles: { fontSize: 9 },
            });
        }

        // Comparativo por loja (superadmin)
        if (storeFinancials.length > 0) {
            const afterTop = (doc as any).lastAutoTable.finalY + 8;
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('Comparativo por Loja', 14, afterTop);
            autoTable(doc, {
                startY: afterTop + 4,
                head: [['Loja', 'Entradas', 'Saídas', 'Lucro']],
                body: storeFinancials.map(sf => [sf.loja_nome, fmt(sf.entradas), fmt(sf.saidas), fmt(sf.lucro)]),
                headStyles: { fillColor: [30, 30, 30], textColor: [255, 215, 0], fontStyle: 'bold' },
                bodyStyles: { textColor: [30, 30, 30] },
                alternateRowStyles: { fillColor: [245, 245, 245] },
                styles: { fontSize: 9 },
            });
        }

        doc.save(`gs-painel-${new Date().toISOString().slice(0,10)}.pdf`);
    };

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        const filterLojaId = !isSuperAdmin ? (lojaAtual?.id || null) : selectedFilter;
        const { start: dateStart, end: dateEnd } = getPeriodoDates(periodo, customStart, customEnd);
        try {
            // Build queries upfront
            let vendasQuery = supabase
                .from('vendas')
                .select('id, valor_total, data_venda, loja_id, forma_pagamento, usuario_id, cliente:clientes(nome)')
                .gte('data_venda', dateStart).lte('data_venda', dateEnd);
            if (filterLojaId) vendasQuery = vendasQuery.eq('loja_id', filterLojaId);
            if (formaPagamento !== 'Todos') vendasQuery = vendasQuery.eq('forma_pagamento', formaPagamento);

            let contasQuery = supabase.from('contas_a_pagar').select('valor, loja_id, categoria')
                .eq('status', 'pago').gte('created_at', dateStart).lte('created_at', dateEnd);
            if (filterLojaId) contasQuery = contasQuery.eq('loja_id', filterLojaId);

            const needsStoreBreakdown = isSuperAdmin && !filterLojaId && allLojas.length > 0;

            // Dispara TODAS as queries em paralelo (de 7-10 round-trips → 5 ou 7)
            const results = await Promise.all([
                supabase.from('usuarios').select('id, nome'),                          // [0]
                vendasQuery,                                                           // [1]
                supabase.from('transacoes')
                    .select('valor, tipo, data_transacao, categoria')
                    .gte('data_transacao', dateStart).lte('data_transacao', dateEnd), // [2]
                contasQuery,                                                           // [3]
                supabase.from('produtos').select('estoque_atual, estoque_minimo'),     // [4]
                ...(needsStoreBreakdown ? [
                    (() => {
                        let q = supabase.from('vendas').select('valor_total, loja_id')
                            .gte('data_venda', dateStart).lte('data_venda', dateEnd);
                        if (formaPagamento !== 'Todos') q = q.eq('forma_pagamento', formaPagamento);
                        return q;
                    })(),                                                              // [5]
                    supabase.from('contas_a_pagar')
                        .select('valor, loja_id')
                        .eq('status', 'pago')
                        .gte('created_at', dateStart).lte('created_at', dateEnd),    // [6]
                ] : []),
            ]);

            const userData      = results[0].data;
            const allVendas     = results[1].data as any[];
            const allTransacoes = results[2].data as any[];
            const allContas     = results[3].data as any[];
            const products      = results[4].data;

            // Users map
            const userMap: Record<string, string> = {};
            if (userData) (userData as any[]).forEach(u => userMap[u.id] = u.nome);

            // === FINANCIAL SUMMARY ===
            let totalEntradas = 0;
            let totalSaidas = 0;
            (allVendas || []).forEach(v => { totalEntradas += Number(v.valor_total || 0); });
            (allTransacoes || []).forEach(t => {
                if (t.tipo === 'entrada') totalEntradas += Number(t.valor || 0);
                else if (t.tipo === 'saida') totalSaidas += Number(t.valor || 0);
            });
            (allContas || []).forEach(c => { totalSaidas += Number(c.valor || 0); });
            setResumo({ saldo: totalEntradas - totalSaidas, entradas: totalEntradas, saidas: totalSaidas, lucro: totalEntradas - totalSaidas });

            // === PER-STORE BREAKDOWN (superadmin + "Todas") ===
            if (needsStoreBreakdown) {
                const allVendasUnfiltered = (results[5]?.data || []) as any[];
                const allContasUnfiltered = (results[6]?.data || []) as any[];
                const storeMap: Record<string, StoreFinancials> = {};
                allLojas.forEach(l => {
                    storeMap[l.id] = { loja_id: l.id, loja_nome: l.nome, is_matriz: l.is_matriz, entradas: 0, saidas: 0, lucro: 0 };
                });
                allVendasUnfiltered.forEach(v => { if (storeMap[v.loja_id]) storeMap[v.loja_id].entradas += Number(v.valor_total || 0); });
                allContasUnfiltered.forEach(c => { if (storeMap[c.loja_id]) storeMap[c.loja_id].saidas += Number(c.valor || 0); });
                Object.values(storeMap).forEach(s => { s.lucro = s.entradas - s.saidas; });
                setStoreFinancials(Object.values(storeMap).sort((a, b) => b.lucro - a.lucro));
            } else {
                setStoreFinancials([]);
            }

            // === RECENT SALES (reutiliza allVendas, sem query extra) ===
            const recentVendas = [...(allVendas || [])]
                .sort((a, b) => new Date(b.data_venda).getTime() - new Date(a.data_venda).getTime())
                .slice(0, 5);
            setRecentSales(recentVendas.map(v => {
                const loja = allLojas.find(l => l.id === v.loja_id);
                return {
                    loja: loja?.nome || lojaAtual?.nome || 'Principal',
                    vendedor: v.usuario_id ? (userMap[v.usuario_id] || 'Sistema') : 'Sistema',
                    data: v.data_venda ? new Date(v.data_venda).toLocaleString('pt-BR') : 'Sem data',
                    cotacao: (v.valor_total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                };
            }));

            // === SELLER PERFORMANCE (reutiliza allVendas, sem query extra) ===
            const salesBySeller: Record<string, { total: number; name: string }> = {};
            let maxTotal = 0;
            (allVendas || []).forEach(s => {
                const id = s.usuario_id || 'unknown';
                const name = userMap[id] || 'Outros';
                if (!salesBySeller[id]) salesBySeller[id] = { total: 0, name };
                salesBySeller[id].total += Number(s.valor_total || 0);
                if (salesBySeller[id].total > maxTotal) maxTotal = salesBySeller[id].total;
            });
            setPerformanceVendedor(
                Object.entries(salesBySeller).map(([_, data]) => ({
                    name: data.name,
                    value: maxTotal > 0 ? Math.round((data.total / maxTotal) * 100) : 0,
                    color: Math.random() > 0.5 ? 'bg-brand-red' : 'bg-brand-yellow'
                })).sort((a, b) => b.value - a.value).slice(0, 4)
            );

            // === STOCK ===
            if (products) {
                const emAlerta = (products as any[]).filter(p => (p.estoque_atual || 0) <= (p.estoque_minimo || 0)).length;
                setGirodeEstoqueData([
                    { name: 'Em Estoque', value: products.length - emAlerta },
                    { name: 'Reposição', value: emAlerta },
                ]);
            }

            // === MONTHLY CHARTS (reutiliza allVendas + allTransacoes, sem queries extras) ===
            const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            const currentMonthIndex = new Date().getMonth();
            const salesByMonth: Record<string, number> = {};
            const expensesByMonth: Record<string, number> = {};
            const expensesByCategory: Record<string, number> = {};

            (allVendas || []).forEach(v => {
                const month = new Date(v.data_venda).getMonth();
                salesByMonth[month] = (salesByMonth[month] || 0) + Number(v.valor_total || 0);
            });
            (allTransacoes || []).forEach(t => {
                const month = new Date(t.data_transacao).getMonth();
                if (t.tipo === 'saida') {
                    expensesByMonth[month] = (expensesByMonth[month] || 0) + Number(t.valor || 0);
                    expensesByCategory[t.categoria || 'Outros'] = (expensesByCategory[t.categoria || 'Outros'] || 0) + Number(t.valor || 0);
                } else if (t.tipo === 'entrada') {
                    salesByMonth[month] = (salesByMonth[month] || 0) + Number(t.valor || 0);
                }
            });

            const chartData = months.map((m, i) => ({ name: m, entrada: salesByMonth[i] || 0, saida: expensesByMonth[i] || 0 }));
            setFluxoCaixa(chartData.slice(0, currentMonthIndex + 1));
            setLucroMensal(chartData.slice(0, currentMonthIndex + 1).map(d => ({ name: d.name, value: d.entrada - d.saida })));

            const categoryData = Object.entries(expensesByCategory)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value).slice(0, 5);
            setDespesasPorCategoria(categoryData.length > 0 ? categoryData : [{ name: 'Sem dados', value: 0 }]);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    // allLojas via closure — intencionalmente fora das deps para não causar loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lojaAtual, isSuperAdmin, selectedFilter, periodo, customStart, customEnd, formaPagamento]);

    // Fetch lojas for superadmin filter
    useEffect(() => {
        if (isSuperAdmin) {
            supabase.from('lojas').select('id, nome, is_matriz').order('created_at')
                .then(({ data }) => setAllLojas(data || []));
        }
    }, [isSuperAdmin]);

    // Fetch data when any filter changes
    useEffect(() => {
        if (loadingStore) return;
        if (isSuperAdmin || lojaAtual) {
            fetchDashboardData();
        }
    }, [loadingStore, isSuperAdmin, lojaAtual, selectedFilter, periodo, customStart, customEnd, formaPagamento, fetchDashboardData]);



    const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-brand-yellow" />
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* ===== FILTER BAR ===== */}
            <div className="bg-brand-dark border border-gray-800 rounded-2xl p-4 space-y-4">

                {/* Período */}
                <div className="space-y-2">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" /> Período
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {(['hoje', '7d', '30d', 'mes', 'ano', 'custom'] as PeriodoPreset[]).map(p => (
                            <button key={p}
                                onClick={() => setPeriodo(p)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest border transition-all",
                                    periodo === p
                                        ? "bg-brand-yellow text-brand-dark border-brand-yellow"
                                        : "bg-transparent border-gray-800 text-gray-500 hover:text-white hover:border-gray-600"
                                )}
                            >
                                {{ hoje: 'Hoje', '7d': '7 dias', '30d': '30 dias', mes: 'Este mês', ano: 'Este ano', custom: 'Personalizado' }[p]}
                            </button>
                        ))}
                    </div>
                    {periodo === 'custom' && (
                        <div className="flex flex-wrap gap-3 mt-2">
                            <div className="flex items-center gap-2">
                                <label className="text-[10px] text-gray-500 uppercase">De</label>
                                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                                    className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-yellow" />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-[10px] text-gray-500 uppercase">Até</label>
                                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                                    className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-yellow" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Forma de Pagamento */}
                <div className="space-y-2">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                        <CreditCard className="h-3 w-3" /> Forma de Pagamento
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {FORMAS_PAGAMENTO.map(f => (
                            <button key={f}
                                onClick={() => setFormaPagamento(f)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest border transition-all",
                                    formaPagamento === f
                                        ? "bg-brand-red text-white border-brand-red"
                                        : "bg-transparent border-gray-800 text-gray-500 hover:text-white hover:border-gray-600"
                                )}
                            >{FORMA_LABEL[f]}</button>
                        ))}
                    </div>
                </div>

                {/* Lojas (superadmin) */}
                {isSuperAdmin && allLojas.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                            <Store className="h-3 w-3" /> Loja
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setSelectedFilter(null)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest border transition-all flex items-center gap-2",
                                    selectedFilter === null
                                        ? "bg-brand-yellow text-brand-dark border-brand-yellow"
                                        : "bg-transparent border-gray-800 text-gray-500 hover:text-white hover:border-gray-600"
                                )}
                            >
                                <TrendingUp className="h-3.5 w-3.5" /> Todas
                            </button>
                            {allLojas.map(l => (
                                <button key={l.id}
                                    onClick={() => setSelectedFilter(l.id)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest border transition-all flex items-center gap-2",
                                        selectedFilter === l.id
                                            ? "bg-brand-red text-white border-brand-red"
                                            : "bg-transparent border-gray-800 text-gray-500 hover:text-white hover:border-gray-600"
                                    )}
                                >
                                    <Store className="h-3 w-3" />
                                    {l.nome}
                                    {l.is_matriz && <span className="text-[8px] opacity-60">⭐</span>}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            {/* Botão Exportar PDF */}
            <div className="flex justify-end pt-2 border-t border-gray-800">
                <button
                    onClick={exportToPDF}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-yellow/10 border border-brand-yellow/30 text-brand-yellow text-xs font-bold uppercase tracking-widest hover:bg-brand-yellow hover:text-brand-dark transition-all duration-200"
                >
                    <FileDown className="h-3.5 w-3.5" />
                    Exportar PDF
                </button>
            </div>
            </div>

            {/* ===== FINANCIAL SUMMARY CARDS ===== */}
            {isSuperAdmin && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-brand-dark border-gray-800 text-white">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-500">Saldo</CardTitle>
                            <Wallet className="h-4 w-4 text-brand-yellow" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{fmt(resumo.saldo)}</div>
                            <div className="text-[10px] text-gray-500 mt-1 italic">
                                {selectedFilter === null ? 'Consolidado todas as lojas' : 'Filtrado por loja'}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-brand-dark border-gray-800 text-white border-l-4 border-l-green-500">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-500">Entradas</CardTitle>
                            <ArrowUpRight className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-500">+ {fmt(resumo.entradas)}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-brand-dark border-gray-800 text-white border-l-4 border-l-brand-red">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-500">Saídas</CardTitle>
                            <ArrowDownRight className="h-4 w-4 text-brand-red" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-brand-red">- {fmt(resumo.saidas)}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-brand-dark border-brand-yellow/30 text-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-2 opacity-10">
                            <DollarSign className="h-24 w-24 text-brand-yellow" />
                        </div>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-500">Lucro</CardTitle>
                            <span className="h-2 w-2 rounded-full bg-brand-yellow animate-pulse"></span>
                        </CardHeader>
                        <CardContent>
                            <div className={cn("text-2xl font-bold", resumo.lucro >= 0 ? "text-brand-yellow" : "text-brand-red")}>{fmt(resumo.lucro)}</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ===== PER-STORE COMPARISON TABLE (superadmin + "Todas") ===== */}
            {isSuperAdmin && selectedFilter === null && storeFinancials.length > 0 && (
                <Card className="bg-brand-dark border-gray-800 text-white">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Store className="h-5 w-5 text-brand-yellow" />
                            Comparativo por Loja
                        </CardTitle>
                        <p className="text-xs text-gray-400">Desempenho financeiro individual de cada loja</p>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left border-b border-gray-800 text-gray-400">
                                        <th className="pb-3 font-medium">Loja</th>
                                        <th className="pb-3 font-medium text-right">Entradas</th>
                                        <th className="pb-3 font-medium text-right">Saídas</th>
                                        <th className="pb-3 font-medium text-right">Lucro</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {storeFinancials.map(sf => (
                                        <tr
                                            key={sf.loja_id}
                                            className="text-gray-300 hover:bg-white/5 transition-colors cursor-pointer"
                                            onClick={() => setSelectedFilter(sf.loja_id)}
                                        >
                                            <td className="py-4 font-bold flex items-center gap-2">
                                                <Store className={cn("h-4 w-4", sf.is_matriz ? "text-brand-yellow" : "text-gray-500")} />
                                                {sf.loja_nome}
                                                {sf.is_matriz && <span className="text-[8px] text-brand-yellow">⭐</span>}
                                            </td>
                                            <td className="py-4 text-right font-mono text-green-400">+ {fmt(sf.entradas)}</td>
                                            <td className="py-4 text-right font-mono text-brand-red">- {fmt(sf.saidas)}</td>
                                            <td className={cn("py-4 text-right font-mono font-bold", sf.lucro >= 0 ? "text-brand-yellow" : "text-brand-red")}>
                                                {fmt(sf.lucro)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ===== EXISTING CHARTS ===== */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-brand-dark border-gray-800 text-white col-span-1 min-w-0">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Fluxo de Caixa (Mensal)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={fluxoCaixa}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#2c2c2c" vertical={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                        formatter={(value: any) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    />
                                    <Line type="monotone" dataKey="entrada" stroke="#4ade80" strokeWidth={2} dot={false} name="Entradas" />
                                    <Line type="monotone" dataKey="saida" stroke="#f43f5e" strokeWidth={2} dot={false} name="Saídas" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-brand-dark border-gray-800 text-white col-span-1 min-w-0">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Despesas (Categorias)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={despesasPorCategoria}>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff' }}
                                        formatter={(value: any) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    />
                                    <Bar dataKey="value" fill="#E31E24" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-brand-dark border-gray-800 text-white col-span-1 min-w-0">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Lucro Líquido (Trimestral)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={lucroMensal}>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                                        formatter={(value: any) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    />
                                    <Area type="monotone" dataKey="value" stroke="#FFD700" fill="#FFD700" fillOpacity={0.2} strokeWidth={2} name="Lucro" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-brand-dark border-gray-800 text-white col-span-1 min-w-0">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Distribuição de Estoque</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center">
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={girodeEstoqueData} cx="50%" cy="80%" innerRadius={60} outerRadius={80}
                                        startAngle={180} endAngle={0} paddingAngle={5} dataKey="value">
                                        <Cell fill="#FFFFFF" />
                                        <Cell fill="#E31E24" />
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ===== RECENT SALES + TOP SELLERS ===== */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="bg-brand-dark border-gray-800 text-white lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">Vendas Recentes</CardTitle>
                        <p className="text-xs text-gray-400">Últimas 5 vendas registradas</p>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left border-b border-gray-800 text-gray-400">
                                        <th className="pb-3 font-medium">Loja</th>
                                        <th className="pb-3 font-medium">Vendedor</th>
                                        <th className="pb-3 font-medium">Data/Hora</th>
                                        <th className="pb-3 font-medium">Valor</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {recentSales.map((sale, i) => (
                                        <tr key={i} className="text-gray-300">
                                            <td className="py-4">{sale.loja}</td>
                                            <td className="py-4">{sale.vendedor}</td>
                                            <td className="py-4">{sale.data}</td>
                                            <td className="py-4 font-mono text-brand-yellow font-semibold">{sale.cotacao}</td>
                                        </tr>
                                    ))}
                                    {recentSales.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="py-8 text-center text-gray-500">
                                                Nenhuma venda registrada ainda.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-brand-dark border-gray-800 text-white lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">Top Vendedores (30 dias)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <div className="flex items-center gap-1">
                                    <div className="h-3 w-3 bg-brand-red rounded-sm"></div>
                                    <span>Volume</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="h-3 w-3 bg-brand-yellow rounded-sm"></div>
                                    <span>Relativo</span>
                                </div>
                            </div>

                            {performanceVendedor.map((item, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span>{item.name}</span>
                                        <span className="text-gray-400">{item.value}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                                        <div className={cn("h-full rounded-full", item.color)} style={{ width: `${item.value}%` }}></div>
                                    </div>
                                </div>
                            ))}

                            {performanceVendedor.length === 0 && (
                                <p className="text-center text-gray-500 py-8 italic text-sm">Sem dados de venda no período.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
