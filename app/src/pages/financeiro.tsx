import { useState, useEffect } from "react";
import { ArrowUpRight, ArrowDownRight, DollarSign, Wallet, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export default function Financeiro() {
    const [loading, setLoading] = useState(true);
    const [transacoes, setTransacoes] = useState<any[]>([]);
    const [resumo, setResumo] = useState({
        saldo: 0,
        entradas: 0,
        saidas: 0,
        lucro: 0
    });

    useEffect(() => {
        fetchFinanceiro();
    }, []);

    async function fetchFinanceiro() {
        setLoading(true);
        try {
            // 1. Fetch Transações (Saídas e Entradas extras)
            const { data: trans } = await supabase
                .from('transacoes')
                .select('*')
                .order('data_transacao', { ascending: false });

            // 2. Fetch Vendas (Entradas principais)
            const { data: vendas } = await supabase
                .from('vendas')
                .select('valor_total, data_venda, forma_pagamento');

            let totalEntradas = 0;
            let totalSaidas = 0;

            const mappedTrans = (trans || []).map(t => {
                const valor = Number(t.valor || 0);
                if (t.tipo === 'entrada') totalEntradas += valor;
                else totalSaidas += valor;

                return {
                    id: t.id,
                    desc: t.descricao || t.categoria || 'Transação',
                    valor: t.tipo === 'entrada' ? valor : -valor,
                    tipo: t.tipo,
                    data: new Date(t.data_transacao).toLocaleDateString('pt-BR'),
                    forma: t.forma_pagamento || 'N/A'
                };
            });

            const mappedVendas = (vendas || []).map((v, i) => {
                const valor = Number(v.valor_total || 0);
                totalEntradas += valor;
                return {
                    id: `v-${i}`,
                    desc: 'Venda de Produtos',
                    valor: valor,
                    tipo: 'entrada',
                    data: new Date(v.data_venda).toLocaleDateString('pt-BR'),
                    forma: v.forma_pagamento || 'N/A'
                };
            });

            const allTrans = [...mappedVendas, ...mappedTrans]
                .sort((a, b) => {
                    const dateA = a.data.split('/').reverse().join('-');
                    const dateB = b.data.split('/').reverse().join('-');
                    return dateB.localeCompare(dateA);
                })
                .slice(0, 10);

            setTransacoes(allTrans);
            setResumo({
                saldo: totalEntradas - totalSaidas,
                entradas: totalEntradas,
                saidas: totalSaidas,
                lucro: totalEntradas - totalSaidas
            });

        } catch (error) {
            console.error('Erro ao buscar dados financeiros:', error);
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
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-white mb-2 italic uppercase">FINANCEIRO</h2>
                <p className="text-gray-400 italic">Controle total sobre o fluxo de caixa baseado em dados reais.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-brand-dark border-gray-800 text-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-500">Saldo Atualizado</CardTitle>
                        <Wallet className="h-4 w-4 text-brand-yellow" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{resumo.saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                        <div className="text-[10px] text-gray-500 mt-1 italic">Consolidado Vendas + Transações</div>
                    </CardContent>
                </Card>
                <Card className="bg-brand-dark border-gray-800 text-white border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Entradas</CardTitle>
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">+ {resumo.entradas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                    </CardContent>
                </Card>
                <Card className="bg-brand-dark border-gray-800 text-white border-l-4 border-l-brand-red">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Saídas</CardTitle>
                        <ArrowDownRight className="h-4 w-4 text-brand-red" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-brand-red">- {resumo.saidas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                    </CardContent>
                </Card>
                <Card className="bg-brand-dark border-brand-yellow/30 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                        <DollarSign className="h-24 w-24 text-brand-yellow" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-500">Lucro Líquido</CardTitle>
                        <span className="h-2 w-2 rounded-full bg-brand-yellow animate-pulse"></span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-brand-yellow">{resumo.lucro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="bg-brand-dark border-gray-800 text-white lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-gray-800 mb-4">
                        <CardTitle className="text-lg">Fluxo de Caixa Recente</CardTitle>
                        <Button variant="ghost" size="sm" className="text-xs text-gray-500 hover:text-white">Explorar Histórico</Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {transacoes.length === 0 ? (
                                <p className="text-center text-gray-500 py-12 italic">Nenhuma transação registrada no banco de dados.</p>
                            ) : transacoes.map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "h-10 w-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110",
                                            item.tipo === 'entrada' ? 'bg-green-500/10 text-green-500' : 'bg-brand-red/10 text-brand-red'
                                        )}>
                                            {item.tipo === 'entrada' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium">{item.desc}</h4>
                                            <p className="text-[10px] text-gray-500 font-mono tracking-tighter">{item.data} • {item.forma}</p>
                                        </div>
                                    </div>
                                    <div className={cn("text-sm font-bold font-mono", item.tipo === 'entrada' ? 'text-green-500' : 'text-brand-red')}>
                                        {item.tipo === 'entrada' ? '+' : '-'} {Math.abs(item.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-brand-dark border-gray-800 text-white lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-lg">Status Financeiro</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="p-4 bg-brand-darker border border-gray-800 rounded-xl">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Saúde do Caixa</p>
                                <div className="text-lg font-bold text-white">
                                    {resumo.saldo > 0 ? 'Positivo' : 'Alerta'}
                                </div>
                                <div className="w-full h-1.5 bg-gray-800 rounded-full mt-2 overflow-hidden">
                                    <div
                                        className={cn("h-full rounded-full transition-all duration-1000", resumo.saldo > 0 ? "bg-green-500" : "bg-brand-red")}
                                        style={{ width: `${Math.min(100, (resumo.entradas / (resumo.saidas || 1)) * 10)}%` }}
                                    ></div>
                                </div>
                            </div>

                            <Button className="w-full h-12 bg-brand-yellow text-brand-dark font-black hover:bg-brand-yellow/80 uppercase tracking-tighter italic">
                                Gerar Relatório PDF
                            </Button>
                            <p className="text-[10px] text-gray-600 text-center italic">Relatórios consolidados pelo GS PRO System.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
