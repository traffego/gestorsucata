import { useState } from "react";
import { CreditCard, Banknote, Zap, Loader2, CheckCircle, FileText, Download, Printer, X, ToggleLeft, ToggleRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/contexts/StoreContext";
import { SalesReport } from "@/components/SalesReport";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ─── Modal de Orçamento ──────────────────────────────────────────────────────
function OrcamentoModal({
    descricao, preco, quantidade, total, lojaNome,
    onClose,
}: {
    descricao: string; preco: number; quantidade: number;
    total: number; lojaNome: string; onClose: () => void;
}) {
    const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const now = new Date().toLocaleString('pt-BR');
    const numero = `ORC-${Date.now().toString(36).toUpperCase()}`;

    const buildPDF = () => {
        const doc = new jsPDF();

        // Fundo do cabeçalho
        doc.setFillColor(18, 18, 18);
        doc.rect(0, 0, 210, 36, 'F');

        // Título
        doc.setTextColor(255, 215, 0);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('ORÇAMENTO', 14, 14);

        // Subtítulo
        doc.setFontSize(9);
        doc.setTextColor(160, 160, 160);
        doc.text(lojaNome, 14, 21);
        doc.text(`Nº ${numero}  |  Emitido em: ${now}`, 14, 27);

        // Linha amarela
        doc.setDrawColor(255, 215, 0);
        doc.setLineWidth(0.5);
        doc.line(14, 33, 196, 33);

        // Tabela de itens
        doc.setTextColor(30, 30, 30);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Itens do Orçamento', 14, 46);

        autoTable(doc, {
            startY: 50,
            head: [['Descrição', 'Qtd', 'Preço Unit.', 'Total']],
            body: [[descricao, quantidade.toString(), fmt(preco), fmt(total)]],
            headStyles: { fillColor: [18, 18, 18], textColor: [255, 215, 0], fontStyle: 'bold' },
            bodyStyles: { textColor: [30, 30, 30] },
            alternateRowStyles: { fillColor: [248, 248, 248] },
            styles: { fontSize: 10, cellPadding: 5 },
            columnStyles: { 0: { cellWidth: 90 }, 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right', fontStyle: 'bold' } },
        });

        // Total destacado
        const afterTable = (doc as any).lastAutoTable.finalY + 6;
        doc.setFillColor(18, 18, 18);
        doc.roundedRect(120, afterTable, 76, 16, 3, 3, 'F');
        doc.setTextColor(160, 160, 160);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('TOTAL DO ORÇAMENTO', 128, afterTable + 6);
        doc.setTextColor(255, 215, 0);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text(fmt(total), 128, afterTable + 13);

        // Validade
        doc.setTextColor(120, 120, 120);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('Este orçamento tem validade de 7 dias a partir da data de emissão.', 14, afterTable + 20);
        doc.text('Para confirmar o pedido, entre em contato com nossa equipe.', 14, afterTable + 26);

        return doc;
    };

    const handleDownload = () => {
        buildPDF().save(`orcamento-${numero}.pdf`);
    };

    const handlePrint = () => {
        const doc = buildPDF();
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        const win = window.open(url);
        win?.addEventListener('load', () => { win.print(); });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-lg bg-[#111] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-gradient-to-r from-brand-yellow/10 to-transparent border-b border-gray-800 p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-brand-yellow/10 border border-brand-yellow/20 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-brand-yellow" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Orçamento gerado</p>
                            <p className="text-white font-black text-lg">{numero}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors p-1">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Preview do orçamento */}
                <div className="p-5 space-y-4">
                    <div className="bg-black/40 border border-gray-800 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between text-xs text-gray-500 uppercase tracking-widest">
                            <span>Emitido em</span>
                            <span className="text-white font-mono">{now}</span>
                        </div>
                        <div className="border-t border-gray-800 pt-3 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">{descricao}</span>
                                <span className="text-white font-mono">{quantidade}x {fmt(preco)}</span>
                            </div>
                        </div>
                        <div className="border-t border-gray-800 pt-3 flex justify-between items-center">
                            <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Total</span>
                            <span className="text-2xl font-black text-brand-yellow">{fmt(total)}</span>
                        </div>
                    </div>

                    <p className="text-[10px] text-gray-600 text-center italic">
                        Validade: 7 dias · Nenhuma venda foi registrada
                    </p>

                    {/* Ações */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={handleDownload}
                            className="flex items-center justify-center gap-2 h-12 rounded-xl bg-brand-yellow/10 border border-brand-yellow/30 text-brand-yellow font-bold text-sm uppercase tracking-widest hover:bg-brand-yellow hover:text-black transition-all duration-200"
                        >
                            <Download className="h-4 w-4" />
                            Baixar PDF
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex items-center justify-center gap-2 h-12 rounded-xl bg-white/5 border border-gray-700 text-gray-300 font-bold text-sm uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all duration-200"
                        >
                            <Printer className="h-4 w-4" />
                            Imprimir
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Nova Venda ──────────────────────────────────────────────────────────────
export default function NovaVenda() {
    const { user } = useAuth();
    const { lojaAtual } = useStore();

    const [descricao, setDescricao] = useState("");
    const [preco, setPreco] = useState("");
    const [quantidade, setQuantidade] = useState("1");
    const [paymentMethod, setPaymentMethod] = useState<'dinheiro' | 'cartao' | 'pix' | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Orçamento
    const [isOrcamento, setIsOrcamento] = useState(false);
    const [showOrcamentoModal, setShowOrcamentoModal] = useState(false);

    const precoNum = parseFloat(preco.replace(',', '.')) || 0;
    const qtdNum = parseFloat(quantidade.replace(',', '.')) || 1;
    const total = precoNum * qtdNum;

    const validate = () => {
        if (!descricao.trim()) { alert("Descreva o produto ou serviço da venda."); return false; }
        if (!preco || precoNum <= 0) { alert("Informe um preço válido."); return false; }
        if (!isOrcamento && !paymentMethod) { alert("Selecione uma forma de pagamento."); return false; }
        return true;
    };

    const handleGerarOrcamento = () => {
        if (!validate()) return;
        setShowOrcamentoModal(true);
    };

    const handleFinalizeSale = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            const sku = `VD-${Date.now().toString(36).toUpperCase()}`;
            const { data: produto, error: prodError } = await supabase
                .from('produtos')
                .insert([{ nome: descricao.trim(), sku, tipo: 'peca', preco_venda: precoNum, estoque_atual: 0, unidade_medida: 'un', loja_id: lojaAtual?.id }])
                .select().single();
            if (prodError) throw prodError;

            const { data: venda, error: vendaError } = await supabase
                .from('vendas')
                .insert([{ valor_total: total, forma_pagamento: paymentMethod, status: 'concluida', vendedor_id: user?.id, loja_id: lojaAtual?.id }])
                .select().single();
            if (vendaError) throw vendaError;

            const { error: itemError } = await supabase
                .from('itens_venda')
                .insert([{ venda_id: venda.id, produto_id: produto.id, quantidade: qtdNum, preco_unitario: precoNum }]);
            if (itemError) throw itemError;

            setSuccess(true);
            setDescricao(""); setPreco(""); setQuantidade("1"); setPaymentMethod(null);
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
        <>
            {showOrcamentoModal && (
                <OrcamentoModal
                    descricao={descricao} preco={precoNum} quantidade={qtdNum}
                    total={total} lojaNome={lojaAtual?.nome || 'GS PRO'}
                    onClose={() => setShowOrcamentoModal(false)}
                />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto items-start">
                {/* PDV (Nova Venda) */}
                <div className="lg:col-span-5 order-1">
                    <Card className="bg-brand-dark border-gray-800 text-white">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-2xl font-black uppercase tracking-tight">
                                        {isOrcamento ? 'Orçamento' : 'Nova Venda'}
                                    </CardTitle>
                                    <p className="text-sm text-gray-500 mt-0.5">
                                        {isOrcamento ? 'Gere um PDF para enviar ao cliente.' : 'Descreva o que está sendo vendido e finalize diretamente.'}
                                    </p>
                                </div>

                                {/* Toggle Orçamento */}
                                <button
                                    onClick={() => setIsOrcamento(v => !v)}
                                    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all duration-200 ${
                                        isOrcamento
                                            ? 'border-brand-yellow/40 bg-brand-yellow/10 text-brand-yellow'
                                            : 'border-gray-700 bg-transparent text-gray-500 hover:text-gray-300'
                                    }`}
                                    title="Alternar modo orçamento"
                                >
                                    {isOrcamento
                                        ? <ToggleRight className="h-6 w-6" />
                                        : <ToggleLeft className="h-6 w-6" />
                                    }
                                    <span className="text-[9px] font-black uppercase tracking-widest leading-none">
                                        Orçamento
                                    </span>
                                </button>
                            </div>

                            {/* Banner modo orçamento */}
                            {isOrcamento && (
                                <div className="mt-3 flex items-center gap-2 text-xs text-brand-yellow bg-brand-yellow/5 border border-brand-yellow/20 rounded-xl px-3 py-2">
                                    <FileText className="h-3.5 w-3.5 shrink-0" />
                                    Modo orçamento ativo — nenhuma venda será registrada.
                                </div>
                            )}
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

                            {/* Forma de Pagamento (só se não for orçamento) */}
                            {!isOrcamento && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                        Forma de Pagamento
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <Button variant="outline"
                                            className={`border-gray-700 gap-2 h-12 ${paymentMethod === 'dinheiro' ? 'bg-brand-yellow text-black border-brand-yellow font-black' : 'bg-transparent hover:bg-white/5 text-gray-400'}`}
                                            onClick={() => setPaymentMethod('dinheiro')}
                                        >
                                            <Banknote className="h-4 w-4" /> Dinheiro
                                        </Button>
                                        <Button variant="outline"
                                            className={`border-gray-700 gap-2 h-12 ${paymentMethod === 'cartao' ? 'bg-brand-yellow text-black border-brand-yellow font-black' : 'bg-transparent hover:bg-white/5 text-gray-400'}`}
                                            onClick={() => setPaymentMethod('cartao')}
                                        >
                                            <CreditCard className="h-4 w-4" /> Cartão
                                        </Button>
                                        <Button variant="outline"
                                            className={`border-gray-700 gap-2 h-12 ${paymentMethod === 'pix' ? 'bg-brand-yellow text-black border-brand-yellow font-black' : 'bg-transparent hover:bg-white/5 text-gray-400'}`}
                                            onClick={() => setPaymentMethod('pix')}
                                        >
                                            <Zap className="h-4 w-4" /> PIX
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Botão de ação */}
                            {isOrcamento ? (
                                <button
                                    onClick={handleGerarOrcamento}
                                    className="w-full h-14 flex items-center justify-center gap-2 rounded-xl bg-brand-yellow text-black font-black text-lg uppercase tracking-widest shadow-lg shadow-brand-yellow/20 hover:bg-brand-yellow/90 transition-all duration-200"
                                >
                                    <FileText className="h-5 w-5" />
                                    Gerar Orçamento
                                </button>
                            ) : success ? (
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
                                        paymentMethod ? `Finalizar — ${paymentLabels[paymentMethod]}` : 'Finalizar Venda'
                                    )}
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Relatório de vendas */}
                <div className="lg:col-span-7 order-2">
                    <SalesReport />
                </div>
            </div>
        </>
    );
}

