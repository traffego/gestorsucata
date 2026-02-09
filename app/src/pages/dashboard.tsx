import { useEffect, useState } from 'react';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    AreaChart,
    Area,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function Dashboard() {
    const [recentSales, setRecentSales] = useState<any[]>([]);
    const [fluxoCaixa, setFluxoCaixa] = useState<any[]>([]);
    const [despesasPorCategoria, setDespesasPorCategoria] = useState<any[]>([]);
    const [lucroMensal, setLucroMensal] = useState<any[]>([]);
    const [girodeEstoqueData, setGirodeEstoqueData] = useState<any[]>([]);
    const [performanceVendedor, setPerformanceVendedor] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    async function fetchDashboardData() {
        setLoading(true);
        try {
            // 0. Fetch Users for mapping
            const { data: userData } = await supabase.from('usuarios').select('id, nome');
            const userMap: Record<string, string> = {};
            if (userData) {
                userData.forEach(u => userMap[u.id] = u.nome);
            }

            // 1. Fetch Recent Sales with better error handling
            const { data: vendas, error: salesError } = await supabase
                .from('vendas')
                .select(`
                    id,
                    valor_total,
                    data_venda,
                    forma_pagamento,
                    cliente:clientes(nome),
                    usuario_id
                `)
                .order('data_venda', { ascending: false })
                .limit(5);

            if (salesError) {
                console.error('Erro ao buscar vendas recentes:', salesError);
            }

            if (vendas) {
                setRecentSales(vendas.map((v: any) => {
                    const vendedorNome = v.usuario_id ? userMap[v.usuario_id] : 'Sistema';
                    return {
                        loja: 'Principal',
                        vendedor: vendedorNome || 'Sistema',
                        data: v.data_venda ? new Date(v.data_venda).toLocaleString('pt-BR') : 'Sem data',
                        cotacao: (v.valor_total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    };
                }));
            }

            // 2. Fetch Performance by Seller (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data: sellerSales, error: performanceError } = await supabase
                .from('vendas')
                .select('valor_total, usuario_id')
                .gte('data_venda', thirtyDaysAgo.toISOString());

            if (performanceError) {
                console.error('Erro ao buscar performance de vendedores:', performanceError);
            }

            if (sellerSales) {
                const salesBySeller: Record<string, { total: number, name: string }> = {};
                let maxTotal = 0;

                sellerSales.forEach((s: any) => {
                    const id = s.usuario_id || 'unknown';
                    const name = userMap[id] || 'Outros';
                    if (!salesBySeller[id]) salesBySeller[id] = { total: 0, name };
                    salesBySeller[id].total += Number(s.valor_total || 0);
                    if (salesBySeller[id].total > maxTotal) maxTotal = salesBySeller[id].total;
                });

                const performance = Object.entries(salesBySeller).map(([_, data]) => ({
                    name: data.name,
                    value: maxTotal > 0 ? Math.round((data.total / maxTotal) * 100) : 0,
                    color: Math.random() > 0.5 ? 'bg-brand-red' : 'bg-brand-yellow'
                })).sort((a, b) => b.value - a.value).slice(0, 4);

                setPerformanceVendedor(performance);
            }

            // 3. Fetch Stock Stats (Giro de Estoque)
            const { data: products } = await supabase
                .from('produtos')
                .select('estoque_atual, estoque_minimo, preco_venda');

            if (products) {
                const emAlerta = products.filter(p => (p.estoque_atual || 0) <= (p.estoque_minimo || 0)).length;
                const ok = products.length - emAlerta;

                setGirodeEstoqueData([
                    { name: 'Em Estoque', value: ok },
                    { name: 'Reposição', value: emAlerta },
                ]);
            }

            // 4. Fetch Financial Data (Current Year)
            const currentYearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();

            const { data: allSales } = await supabase
                .from('vendas')
                .select('data_venda, valor_total')
                .gte('data_venda', currentYearStart);

            const { data: allExpenses } = await supabase
                .from('transacoes')
                .select('data_transacao, valor, categoria, tipo')
                .gte('data_transacao', currentYearStart);

            const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            const currentMonthIndex = new Date().getMonth();

            const salesByMonth: Record<string, number> = {};
            const expensesByMonth: Record<string, number> = {};
            const expensesByCategory: Record<string, number> = {};

            if (allSales) {
                allSales.forEach(v => {
                    const month = new Date(v.data_venda).getMonth();
                    salesByMonth[month] = (salesByMonth[month] || 0) + Number(v.valor_total || 0);
                });
            }

            if (allExpenses) {
                allExpenses.forEach(t => {
                    const month = new Date(t.data_transacao).getMonth();
                    if (t.tipo === 'saida') {
                        expensesByMonth[month] = (expensesByMonth[month] || 0) + Number(t.valor || 0);
                        expensesByCategory[t.categoria || 'Outros'] = (expensesByCategory[t.categoria || 'Outros'] || 0) + Number(t.valor || 0);
                    } else if (t.tipo === 'entrada') {
                        salesByMonth[month] = (salesByMonth[month] || 0) + Number(t.valor || 0);
                    }
                });
            }

            const chartData = months.map((m, index) => ({
                name: m,
                entrada: salesByMonth[index] || 0,
                saida: expensesByMonth[index] || 0
            }));

            setFluxoCaixa(chartData.slice(0, currentMonthIndex + 1));
            setLucroMensal(chartData.slice(0, currentMonthIndex + 1).map(d => ({
                name: d.name,
                value: d.entrada - d.saida
            })));

            const categoryData = Object.entries(expensesByCategory)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 5);

            setDespesasPorCategoria(categoryData.length > 0 ? categoryData : [{ name: 'Sem dados', value: 0 }]);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-brand-yellow" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
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

                {/* Keeping other chards static/mocked for now as requested focus was on general 'database reality' */}
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
                                    <Pie
                                        data={girodeEstoqueData}
                                        cx="50%"
                                        cy="80%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        startAngle={180}
                                        endAngle={0}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        <Cell fill="#FFFFFF" />
                                        <Cell fill="#E31E24" />
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

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
