import { useState, useEffect } from "react";
import {
    Plus, Loader2, CheckCircle2, Clock, AlertTriangle,
    Wallet, CalendarCheck, Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { useStore } from "@/contexts/StoreContext";

type Conta = {
    id: string;
    descricao: string;
    valor: number;
    vencimento: string;
    status: 'pendente' | 'pago';
    categoria: string | null;
    pago_em: string | null;
    created_at: string;
};

type Filtro = 'todas' | 'pendente' | 'pago';

const CATEGORIAS = [
    "Aluguel", "Energia", "Água", "Internet", "Fornecedor",
    "Frete", "Manutenção", "Salário", "Imposto", "Outro"
];

export default function ContasAPagar() {
    const { lojaAtual } = useStore();
    const [contas, setContas] = useState<Conta[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [pagando, setPagando] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filtro, setFiltro] = useState<Filtro>('todas');
    const [form, setForm] = useState({
        descricao: "",
        valor: "",
        vencimento: "",
        categoria: ""
    });

    useEffect(() => { if (lojaAtual) fetchContas(); }, [lojaAtual]);

    async function fetchContas() {
        setLoading(true);
        const query = supabase
            .from('contas_a_pagar')
            .select('*')
            .order('vencimento', { ascending: true });
        if (lojaAtual) query.eq('loja_id', lojaAtual.id);
        const { data, error } = await query;
        if (!error && data) setContas(data as Conta[]);
        setLoading(false);
    }

    const handleSave = async () => {
        if (!form.descricao || !form.valor || !form.vencimento) {
            alert("Preencha descrição, valor e vencimento.");
            return;
        }
        setSaving(true);
        const { error } = await supabase.from('contas_a_pagar').insert([{
            descricao: form.descricao.trim(),
            valor: parseFloat(form.valor.replace(',', '.')),
            vencimento: form.vencimento,
            categoria: form.categoria || null,
            status: 'pendente',
            loja_id: lojaAtual?.id
        }]);
        if (error) {
            alert(`Erro: ${error.message}`);
        } else {
            setIsModalOpen(false);
            setForm({ descricao: "", valor: "", vencimento: "", categoria: "" });
            await fetchContas();
        }
        setSaving(false);
    };

    const handlePagar = async (id: string) => {
        if (!confirm("Marcar esta conta como PAGA?")) return;
        setPagando(id);
        const { error } = await supabase
            .from('contas_a_pagar')
            .update({ status: 'pago', pago_em: new Date().toISOString() })
            .eq('id', id);
        if (error) alert(`Erro: ${error.message}`);
        else await fetchContas();
        setPagando(null);
    };

    const hoje = new Date().toISOString().split('T')[0];

    const filtradas = contas.filter(c =>
        filtro === 'todas' ? true : c.status === filtro
    );

    const totalPendente = contas
        .filter(c => c.status === 'pendente')
        .reduce((acc, c) => acc + c.valor, 0);

    const totalPagoMes = contas
        .filter(c => c.status === 'pago' && c.pago_em &&
            new Date(c.pago_em).getMonth() === new Date().getMonth())
        .reduce((acc, c) => acc + c.valor, 0);

    const vencidasPendentes = contas.filter(
        c => c.status === 'pendente' && c.vencimento < hoje
    ).length;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">
                        Contas a Pagar
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Gerencie suas obrigações financeiras.</p>
                </div>
                <Button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-brand-yellow text-brand-dark font-black hover:bg-brand-yellow/90 uppercase tracking-widest px-8"
                >
                    <Plus className="h-4 w-4 mr-2 stroke-[3px]" /> Nova Conta
                </Button>
            </div>

            {/* Totalizadores */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-brand-dark border-red-500/20 border-l-4 border-l-red-500 text-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Total Pendente
                        </CardTitle>
                        <Wallet className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-red-400">
                            R$ {totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        {vencidasPendentes > 0 && (
                            <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {vencidasPendentes} vencida{vencidasPendentes > 1 ? 's' : ''}
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-brand-dark border-green-500/20 border-l-4 border-l-green-500 text-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Pago Este Mês
                        </CardTitle>
                        <CalendarCheck className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-green-400">
                            R$ {totalPagoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-brand-dark border-gray-800 text-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Total de Contas
                        </CardTitle>
                        <Filter className="h-4 w-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-white">{contas.length}</div>
                        <p className="text-[10px] text-gray-500 mt-1">
                            {contas.filter(c => c.status === 'pendente').length} pendentes ·{' '}
                            {contas.filter(c => c.status === 'pago').length} pagas
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filtros */}
            <div className="flex gap-2">
                {(['todas', 'pendente', 'pago'] as Filtro[]).map(f => (
                    <button
                        key={f}
                        onClick={() => setFiltro(f)}
                        className={cn(
                            "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all border",
                            filtro === f
                                ? "bg-brand-yellow text-brand-dark border-brand-yellow"
                                : "bg-brand-dark border-gray-800 text-gray-500 hover:text-white"
                        )}
                    >
                        {f === 'todas' ? 'Todas' : f === 'pendente' ? 'Pendentes' : 'Pagas'}
                    </button>
                ))}
            </div>

            {/* Lista */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-brand-yellow" />
                </div>
            ) : filtradas.length === 0 ? (
                <p className="text-center text-gray-500 py-16 italic border border-dashed border-gray-800 rounded-xl">
                    Nenhuma conta encontrada.
                </p>
            ) : (
                <div className="space-y-3">
                    {filtradas.map(conta => {
                        const vencida = conta.status === 'pendente' && conta.vencimento < hoje;
                        const isPago = conta.status === 'pago';
                        return (
                            <Card
                                key={conta.id}
                                className={cn(
                                    "bg-brand-dark border text-white transition-all",
                                    isPago ? "border-gray-800 opacity-60" :
                                        vencida ? "border-red-500/40" : "border-gray-800 hover:border-brand-yellow/30"
                                )}
                            >
                                <CardContent className="p-0">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between p-5 gap-4">
                                        <div className="flex items-center gap-4 flex-1">
                                            {/* Ícone status */}
                                            <div className={cn(
                                                "h-12 w-12 rounded-xl flex items-center justify-center shrink-0",
                                                isPago ? "bg-green-500/10" :
                                                    vencida ? "bg-red-500/10" : "bg-brand-yellow/10"
                                            )}>
                                                {isPago
                                                    ? <CheckCircle2 className="h-6 w-6 text-green-400" />
                                                    : vencida
                                                        ? <AlertTriangle className="h-6 w-6 text-red-400" />
                                                        : <Clock className="h-6 w-6 text-brand-yellow" />
                                                }
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-bold text-white truncate">{conta.descricao}</h3>
                                                    {conta.categoria && (
                                                        <span className="text-[10px] bg-brand-darker border border-gray-700 px-2 py-0.5 rounded font-mono text-gray-400">
                                                            {conta.categoria}
                                                        </span>
                                                    )}
                                                    <span className={cn(
                                                        "text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-widest",
                                                        isPago ? "bg-green-500/10 text-green-400"
                                                            : vencida ? "bg-red-500/10 text-red-400"
                                                                : "bg-brand-yellow/10 text-brand-yellow"
                                                    )}>
                                                        {isPago ? 'Pago' : vencida ? 'Vencida' : 'Pendente'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Vence em {new Date(conta.vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}
                                                    {isPago && conta.pago_em && (
                                                        <> · Pago em {new Date(conta.pago_em).toLocaleDateString('pt-BR')}</>
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <span className={cn(
                                                "text-xl font-black font-mono",
                                                isPago ? "text-gray-400" : "text-white"
                                            )}>
                                                R$ {conta.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                            {!isPago && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handlePagar(conta.id)}
                                                    disabled={pagando === conta.id}
                                                    className="bg-green-600 hover:bg-green-500 text-white font-bold uppercase tracking-widest text-xs gap-2 shrink-0"
                                                >
                                                    {pagando === conta.id
                                                        ? <Loader2 className="h-3 w-3 animate-spin" />
                                                        : <CheckCircle2 className="h-3 w-3" />
                                                    }
                                                    Pagar
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Modal Nova Conta */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Nova Conta a Pagar"
                description="Registre uma nova obrigação financeira."
                footer={
                    <>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)} className="border-gray-800">
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-brand-red text-white hover:bg-brand-red/90 font-bold uppercase tracking-widest"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Salvar Conta
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Descrição *</label>
                        <Input
                            value={form.descricao}
                            onChange={e => setForm({ ...form, descricao: e.target.value })}
                            placeholder="Ex: Aluguel do galpão, Conta de luz..."
                            className="bg-brand-darker border-gray-800 h-12 focus:border-brand-yellow/50"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Valor (R$) *</label>
                            <Input
                                value={form.valor}
                                onChange={e => setForm({ ...form, valor: e.target.value })}
                                placeholder="0,00"
                                className="bg-brand-darker border-gray-800 h-12 font-mono focus:border-brand-yellow/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Vencimento *</label>
                            <Input
                                type="date"
                                value={form.vencimento}
                                onChange={e => setForm({ ...form, vencimento: e.target.value })}
                                className="bg-brand-darker border-gray-800 h-12 font-mono focus:border-brand-yellow/50"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Categoria</label>
                        <select
                            value={form.categoria}
                            onChange={e => setForm({ ...form, categoria: e.target.value })}
                            className="w-full bg-brand-darker border border-gray-800 rounded-lg h-12 px-4 text-sm text-gray-300 focus:border-brand-yellow/50 outline-none appearance-none"
                        >
                            <option value="">Selecione uma categoria...</option>
                            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
