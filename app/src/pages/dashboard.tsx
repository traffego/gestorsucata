import { useCallback, useEffect, useState } from 'react';
import {
    LineChart, Line, BarChart, Bar, AreaChart, Area,
    CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/contexts/StoreContext';
import { Loader2, Store, ArrowUpRight, ArrowDownRight, DollarSign, Wallet, TrendingUp } from 'lucide-react';

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
    const [selectedFilter, setSelectedFilter] = useState<string | null>(null); // null = todas

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

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        const filterLojaId = !isSuperAdmin ? (lojaAtual?.id || null) : selectedFilter;
        try {

            // 0. Users map
            const { data: userData } = await supabase.from('usuarios').select('id, nome');
            const userMap: Record<string, string> = {};
            if (userData) userData.forEach(u => userMap[u.id] = u.nome);

            // === FINANCIAL SUMMARY (vendas + transacoes + contas_a_pagar) ===
            // Vendas
            const vendasQuery = supabase.from('vendas').select('valor_total, data_venda, loja_id');
            if (filterLojaId) vendasQuery.eq('loja_id', filterLojaId);
            const { data: allVendas } = await vendasQuery;

            // Transacoes
            const { data: allTransacoes } = await supabase
                .from('transacoes')
                .select('valor, tipo, data_transacao, categoria');

            // Contas a Pagar (pagas)
            const contasQuery = supabase.from('contas_a_pagar').select('valor, loja_id, categoria').eq('status', 'pago');
            if (filterLojaId) contasQuery.eq('loja_id', filterLojaId);
            const { data: allContas } = await contasQuery;

            let totalEntradas = 0;
            let totalSaidas = 0;

            (allVendas || []).forEach(v => { totalEntradas += Number(v.valor_total || 0); });
            (allTransacoes || []).forEach(t => {
                if (t.tipo === 'entrada') totalEntradas += Number(t.valor || 0);
                else if (t.tipo === 'saida') totalSaidas += Number(t.valor || 0);
            });
            (allContas || []).forEach(c => { totalSaidas += Number(c.valor || 0); });

            setResumo({
                saldo: totalEntradas - totalSaidas,
                entradas: totalEntradas,
                saidas: totalSaidas,
                lucro: totalEntradas - totalSaidas
            });

            // === PER-STORE BREAKDOWN (superadmin + "Todas") ===
            if (isSuperAdmin && !filterLojaId && allLojas.length > 0) {
                const { data: allVendasUnfiltered } = await supabase.from('vendas').select('valor_total, loja_id');
                const { data: allContasUnfiltered } = await supabase.from('contas_a_pagar').select('valor, loja_id').eq('status', 'pago');

                const storeMap: Record<string, StoreFinancials> = {};
                allLojas.forEach(l => {
                    storeMap[l.id] = {
                        loja_id: l.id, loja_nome: l.nome, is_matriz: l.is_matriz,
                        entradas: 0, saidas: 0, lucro: 0
                    };
                });

                (allVendasUnfiltered || []).forEach(v => {
                    if (storeMap[v.loja_id]) storeMap[v.loja_id].entradas += Number(v.valor_total || 0);
                });
                (allContasUnfiltered || []).forEach(c => {
                    if (storeMap[c.loja_id]) storeMap[c.loja_id].saidas += Number(c.valor || 0);
                });

                Object.values(storeMap).forEach(s => { s.lucro = s.entradas - s.saidas; });
                setStoreFinancials(Object.values(storeMap).sort((a, b) => b.lucro - a.lucro));
            } else {
                setStoreFinancials([]);
            }

            // === RECENT SALES ===
            const recentQuery = supabase
                .from('vendas')
                .select('id, valor_total, data_venda, forma_pagamento, cliente:clientes(nome), usuario_id, loja_id')
                .order('data_venda', { ascending: false })
                .limit(5);
            if (filterLojaId) recentQuery.eq('loja_id', filterLojaId);
            const { data: vendas } = await recentQuery;

            if (vendas) {
                setRecentSales(vendas.map((v: any) => {
                    const loja = allLojas.find(l => l.id === v.loja_id);
                    return {
                        loja: loja?.nome || lojaAtual?.nome || 'Principal',
                        vendedor: v.usuario_id ? (userMap[v.usuario_id] || 'Sistema') : 'Sistema',
                        data: v.data_venda ? new Date(v.data_venda).toLocaleString('pt-BR') : 'Sem data',
                        cotacao: (v.valor_total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    };
                }));
            }

            // === SELLER PERFORMANCE (30 days) ===
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const sellerQuery = supabase.from('vendas').select('valor_total, usuario_id').gte('data_venda', thirtyDaysAgo.toISOString());
            if (filterLojaId) sellerQuery.eq('loja_id', filterLojaId);
            const { data: sellerSales } = await sellerQuery;

            if (sellerSales) {
                const salesBySeller: Record<string, { total: number; name: string }> = {};
                let maxTotal = 0;
                sellerSales.forEach((s: any) => {
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
            }

            // === STOCK ===
            const { data: products } = await supabase.from('produtos').select('estoque_atual, estoque_minimo');
            if (products) {
                const emAlerta = products.filter(p => (p.estoque_atual || 0) <= (p.estoque_minimo || 0)).length;
                setGirodeEstoqueData([
                    { name: 'Em Estoque', value: products.length - emAlerta },
                    { name: 'Reposição', value: emAlerta },
                ]);
            }

            // === MONTHLY CHARTS (current year) ===
            const currentYearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();
            const yearSalesQuery = supabase.from('vendas').select('data_venda, valor_total').gte('data_venda', currentYearStart);
            if (filterLojaId) yearSalesQuery.eq('loja_id', filterLojaId);
            const { data: yearSales } = await yearSalesQuery;

            const { data: yearExpenses } = await supabase
                .from('transacoes')
                .select('data_transacao, valor, categoria, tipo')
                .gte('data_transacao', currentYearStart);

            const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            const currentMonthIndex = new Date().getMonth();
            const salesByMonth: Record<string, number> = {};
            const expensesByMonth: Record<string, number> = {};
            const expensesByCategory: Record<string, number> = {};

            (yearSales || []).forEach(v => {
                const month = new Date(v.data_venda).getMonth();
                salesByMonth[month] = (salesByMonth[month] || 0) + Number(v.valor_total || 0);
            });
            (yearExpenses || []).forEach(t => {
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
    }, [lojaAtual, isSuperAdmin, selectedFilter]);

    // Fetch lojas for superadmin filter
    useEffect(() => {
        if (isSuperAdmin) {
            supabase.from('lojas').select('id, nome, is_matriz').order('created_at')
                .then(({ data }) => setAllLojas(data || []));
        }
    }, [isSuperAdmin]);

    // Fetch data when filter or lojaAtual changes
    useEffect(() => {
        if (loadingStore) return;
        if (isSuperAdmin || lojaAtual) {
            fetchDashboardData();
        }
    }, [loadingStore, isSuperAdmin, lojaAtual, selectedFilter, fetchDashboardData]);



    const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-brand-yellow" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* ===== SUPERADMIN: Store Filter ===== */}
            {isSuperAdmin && allLojas.length > 0 && (
                <div className="space-y-2">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Contabilidade por Loja</p>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setSelectedFilter(null)}
                            className={cn(
                                "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all flex items-center gap-2",
                                selectedFilter === null
                                    ? "bg-brand-yellow text-brand-dark border-brand-yellow shadow-lg shadow-brand-yellow/10"
                                    : "bg-brand-dark border-gray-800 text-gray-500 hover:text-white hover:border-gray-600"
                            )}
                        >
                            <TrendingUp className="h-3.5 w-3.5" /> Todas
                        </button>
                        {allLojas.map(l => (
                            <button
                                key={l.id}
                                onClick={() => setSelectedFilter(l.id)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all flex items-center gap-2",
                                    selectedFilter === l.id
                                        ? "bg-brand-red text-white border-brand-red shadow-lg shadow-brand-red/10"
                                        : "bg-brand-dark border-gray-800 text-gray-500 hover:text-white hover:border-gray-600"
                                )}
                            >
                                <Store className="h-3.5 w-3.5" />
                                {l.nome}
                                {l.is_matriz && <span className="text-[8px] opacity-60">⭐</span>}
                            </button>
                        ))}
                    </div>
                </div>
            )}

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
                <Card className="bg-brand-dark border-gray-800 text-white col-span-1">
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

                <Card className="bg-brand-dark border-gray-800 text-white col-span-1">
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

                <Card className="bg-brand-dark border-gray-800 text-white col-span-1">
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

                <Card className="bg-brand-dark border-gray-800 text-white col-span-1">
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
