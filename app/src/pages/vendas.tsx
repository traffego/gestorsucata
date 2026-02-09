import { useState, useEffect } from "react";
import { Search, Loader2, Calendar, DollarSign, User, ShoppingBag, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

interface SaleItem {
    id: string;
    produto_id: string;
    quantidade: number;
    preco_unitario: number;
    produto?: {
        nome: string;
    };
}

interface Sale {
    id: string;
    cliente_id?: string;
    valor_total: number;
    forma_pagamento: string;
    status: string;
    data_venda: string;
    itens_venda?: SaleItem[];
    cliente?: {
        nome: string;
    };
}

export default function Vendas() {
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);

    useEffect(() => {
        fetchSales();
    }, []);

    async function fetchSales() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('vendas')
                .select(`
                    *,
                    itens_venda (
                        *,
                        produto:produtos (nome)
                    ),
                    cliente:clientes (nome)
                `)
                .order('data_venda', { ascending: false });

            if (error) {
                console.error('Erro ao buscar vendas:', error);
            } else if (data) {
                setSales(data);
            }
        } catch (err) {
            console.error('Erro geral ao buscar vendas:', err);
        } finally {
            setLoading(false);
        }
    }

    const toggleExpand = (id: string) => {
        setExpandedSaleId(prev => prev === id ? null : id);
    };

    const formatDate = (dateString: string) => {
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(dateString));
    };

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const filteredSales = sales.filter(sale =>
        sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sale.cliente?.nome && sale.cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const paymentLabels: Record<string, string> = {
        dinheiro: 'Dinheiro',
        cartao: 'Cartão',
        pix: 'PIX'
    };

    return (
        <div className="space-y-6">
            <Card className="bg-brand-dark border-gray-800 text-white">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5 text-brand-red" />
                        Histórico de Vendas
                    </CardTitle>
                    <div className="relative mt-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Buscar por ID da venda ou nome do cliente..."
                            className="pl-10 bg-brand-darker border-gray-700 text-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-brand-yellow" />
                            <span className="ml-2 text-gray-400">Carregando vendas...</span>
                        </div>
                    ) : filteredSales.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">Nenhuma venda encontrada.</p>
                    ) : (
                        <div className="space-y-4">
                            {filteredSales.map(sale => (
                                <div key={sale.id} className="border border-gray-800 rounded-lg bg-brand-darker/30 overflow-hidden">
                                    <div
                                        className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-white/5 transition-colors"
                                        onClick={() => toggleExpand(sale.id)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="bg-gray-800 p-2 rounded-full">
                                                <DollarSign className="h-5 w-5 text-brand-yellow" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-400">Venda #{sale.id.slice(0, 8)}</p>
                                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {formatDate(sale.data_venda)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                                            {sale.cliente && (
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-gray-500" />
                                                    <span className="text-sm">{sale.cliente.nome}</span>
                                                </div>
                                            )}

                                            <div className="text-right">
                                                <p className="text-lg font-bold text-white">{formatCurrency(sale.valor_total)}</p>
                                                <p className="text-xs text-gray-500 uppercase">{paymentLabels[sale.forma_pagamento] || sale.forma_pagamento}</p>
                                            </div>

                                            <div className="text-gray-500">
                                                {expandedSaleId === sale.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                            </div>
                                        </div>
                                    </div>

                                    {expandedSaleId === sale.id && (
                                        <div className="bg-brand-darker p-4 border-t border-gray-800 animate-in slide-in-from-top-2 duration-200">
                                            <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Itens da Venda</h4>
                                            <div className="space-y-2">
                                                {sale.itens_venda && sale.itens_venda.length > 0 ? (
                                                    sale.itens_venda.map(item => (
                                                        <div key={item.id} className="flex justify-between items-center text-sm border-b border-gray-800/50 pb-2 last:border-0 last:pb-0">
                                                            <div>
                                                                <span className="text-white font-medium">{item.produto?.nome || 'Produto desconhecido'}</span>
                                                                <div className="text-xs text-gray-500">
                                                                    {item.quantidade} x {formatCurrency(item.preco_unitario)}
                                                                </div>
                                                            </div>
                                                            <span className="text-gray-300 font-medium">
                                                                {formatCurrency(item.quantidade * item.preco_unitario)}
                                                            </span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-sm text-gray-500 italic">Nenhum item registrado para esta venda.</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
