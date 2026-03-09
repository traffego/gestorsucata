import { useState } from "react";
import { CreditCard, Banknote, Zap, Loader2, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/contexts/StoreContext";
import { SalesReport } from "@/components/SalesReport";

export default function NovaVenda() {
    const { user } = useAuth();
    const { lojaAtual } = useStore();

    const [descricao, setDescricao] = useState("");
    const [preco, setPreco] = useState("");
    const [quantidade, setQuantidade] = useState("1");
    const [paymentMethod, setPaymentMethod] = useState<'dinheiro' | 'cartao' | 'pix' | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const precoNum = parseFloat(preco.replace(',', '.')) || 0;
    const qtdNum = parseFloat(quantidade.replace(',', '.')) || 1;
    const total = precoNum * qtdNum;

    const handleFinalizeSale = async () => {
        if (!descricao.trim()) {
            alert("Descreva o produto ou serviço da venda.");
            return;
        }
        if (!preco || precoNum <= 0) {
            alert("Informe um preço válido.");
            return;
        }
        if (!paymentMethod) {
            alert("Selecione uma forma de pagamento.");
            return;
        }

        setLoading(true);

        try {
            // 1. Cadastrar o produto automaticamente
            const sku = `VD-${Date.now().toString(36).toUpperCase()}`;
            const { data: produto, error: prodError } = await supabase
                .from('produtos')
                .insert([{
                    nome: descricao.trim(),
                    sku,
                    tipo: 'peca',
                    preco_venda: precoNum,
                    estoque_atual: 0,
                    unidade_medida: 'un',
                    loja_id: lojaAtual?.id
                }])
                .select()
                .single();

            if (prodError) throw prodError;

            // 2. Registrar a venda
            const { data: venda, error: vendaError } = await supabase
                .from('vendas')
                .insert([{
                    valor_total: total,
                    forma_pagamento: paymentMethod,
                    status: 'concluida',
                    vendedor_id: user?.id,
                    loja_id: lojaAtual?.id
                }])
                .select()
                .single();

            if (vendaError) throw vendaError;

            // 3. Registrar o item da venda
            const { error: itemError } = await supabase
                .from('itens_venda')
                .insert([{
                    venda_id: venda.id,
                    produto_id: produto.id,
                    quantidade: qtdNum,
                    preco_unitario: precoNum
                }]);

            if (itemError) throw itemError;

            // Sucesso — limpar form
            setSuccess(true);
            setDescricao("");
            setPreco("");
            setQuantidade("1");
            setPaymentMethod(null);

            setTimeout(() => setSuccess(false), 3000);
        } catch (error: any) {
            console.error('Erro ao salvar venda:', error);
            alert(`Erro ao finalizar venda: ${error.message || 'Erro desconhecido'}`);
        } finally {
            setLoading(false);
        }
    };

    const paymentLabels = { dinheiro: 'Dinheiro', cartao: 'Cartão', pix: 'PIX' };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto items-start">
            {/* PDV (Nova Venda) */}
            <div className="lg:col-span-5 order-1">
                <Card className="bg-brand-dark border-gray-800 text-white">
                    <CardHeader>
                    <CardTitle className="text-2xl font-black uppercase tracking-tight">
                        Nova Venda
                    </CardTitle>
                    <p className="text-sm text-gray-500">
                        Descreva o que está sendo vendido e finalize diretamente.
                    </p>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* Descrição */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                            Descrição do Produto / Serviço
                        </label>
                        <Input
                            placeholder="Ex: Alumínio batido, Motor de geladeira, Radiador..."
                            className="bg-brand-darker border-gray-800 h-12 text-white text-base focus:border-brand-yellow/50 transition-all font-semibold"
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                        />
                    </div>

                    {/* Preço e Quantidade */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                Preço Unitário (R$)
                            </label>
                            <Input
                                placeholder="0,00"
                                className="bg-brand-darker border-gray-800 h-12 text-white font-mono focus:border-brand-yellow/50 transition-all"
                                value={preco}
                                onChange={(e) => setPreco(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                Quantidade
                            </label>
                            <Input
                                placeholder="1"
                                className="bg-brand-darker border-gray-800 h-12 text-white font-mono focus:border-brand-yellow/50 transition-all"
                                value={quantidade}
                                onChange={(e) => setQuantidade(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Total */}
                    {precoNum > 0 && (
                        <div className="flex justify-between items-center bg-brand-darker border border-gray-800 rounded-xl px-5 py-4">
                            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Total</span>
                            <span className="text-2xl font-black text-brand-yellow">
                                R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    )}

                    {/* Forma de Pagamento */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                            Forma de Pagamento
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            <Button
                                variant="outline"
                                className={`border-gray-700 gap-2 h-12 ${paymentMethod === 'dinheiro' ? 'bg-brand-yellow text-black border-brand-yellow font-black' : 'bg-transparent hover:bg-white/5 text-gray-400'}`}
                                onClick={() => setPaymentMethod('dinheiro')}
                            >
                                <Banknote className="h-4 w-4" /> Dinheiro
                            </Button>
                            <Button
                                variant="outline"
                                className={`border-gray-700 gap-2 h-12 ${paymentMethod === 'cartao' ? 'bg-brand-yellow text-black border-brand-yellow font-black' : 'bg-transparent hover:bg-white/5 text-gray-400'}`}
                                onClick={() => setPaymentMethod('cartao')}
                            >
                                <CreditCard className="h-4 w-4" /> Cartão
                            </Button>
                            <Button
                                variant="outline"
                                className={`border-gray-700 gap-2 h-12 ${paymentMethod === 'pix' ? 'bg-brand-yellow text-black border-brand-yellow font-black' : 'bg-transparent hover:bg-white/5 text-gray-400'}`}
                                onClick={() => setPaymentMethod('pix')}
                            >
                                <Zap className="h-4 w-4" /> PIX
                            </Button>
                        </div>
                    </div>

                    {/* Botão Finalizar */}
                    {success ? (
                        <div className="w-full h-14 flex items-center justify-center gap-2 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 font-bold text-sm uppercase tracking-widest">
                            <CheckCircle className="h-5 w-5" /> Venda registrada com sucesso!
                        </div>
                    ) : (
                        <Button
                            className="w-full bg-brand-red hover:bg-brand-red/90 h-14 text-lg font-black uppercase tracking-widest shadow-lg shadow-brand-red/20"
                            onClick={handleFinalizeSale}
                            disabled={loading}
                        >
                            {loading ? (
                                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processando...</>
                            ) : (
                                paymentMethod
                                    ? `Finalizar — ${paymentLabels[paymentMethod]}`
                                    : 'Finalizar Venda'
                            )}
                        </Button>
                    )}

                </CardContent>
            </Card>
            </div>

            {/* Relatório de vendas (Card de filtros) */}
            <div className="lg:col-span-7 order-2">
                <SalesReport />
            </div>
        </div>
    );
}
