import { ArrowUpRight, ArrowDownRight, DollarSign, Wallet, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Financeiro() {
    const transacoes = [
        { id: 1, desc: 'Venda de Sucata Cobre', valor: 4200.00, tipo: 'entrada', data: '27/01/2026', forma: 'PIX' },
        { id: 2, desc: 'Pagamento Aluguel Depósito', valor: -1800.00, tipo: 'saida', data: '25/01/2026', forma: 'Boleto' },
        { id: 3, desc: 'Compra de Lote Baterias', valor: -3500.00, tipo: 'saida', data: '24/01/2026', forma: 'Transferência' },
        { id: 4, desc: 'Venda de Motor Elétrico', valor: 250.00, tipo: 'entrada', data: '24/01/2026', forma: 'Dinheiro' },
        { id: 5, desc: 'Pagamento Energia Elétrica', valor: -450.00, tipo: 'saida', data: '23/01/2026', forma: 'PIX' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-white mb-2">FINANCEIRO</h2>
                <p className="text-gray-400 italic">Controle total sobre o fluxo de caixa e lucros da GS PRO.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-brand-dark border-gray-800 text-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-500">Saldo Total</CardTitle>
                        <Wallet className="h-4 w-4 text-brand-yellow" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">R$ 45.230,00</div>
                        <div className="text-[10px] text-gray-500 mt-1">Conta Principal</div>
                    </CardContent>
                </Card>
                <Card className="bg-brand-dark border-gray-800 text-white border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-500">Entradas (Mês)</CardTitle>
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">+ R$ 12.890</div>
                    </CardContent>
                </Card>
                <Card className="bg-brand-dark border-gray-800 text-white border-l-4 border-l-brand-red">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-500">Saídas (Mês)</CardTitle>
                        <ArrowDownRight className="h-4 w-4 text-brand-red" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-brand-red">- R$ 5.420</div>
                    </CardContent>
                </Card>
                <Card className="bg-brand-dark border-brand-yellow/30 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                        <DollarSign className="h-24 w-24 text-brand-yellow" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-500">Lucro Estimado</CardTitle>
                        <span className="h-2 w-2 rounded-full bg-brand-yellow animate-pulse"></span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-brand-yellow">R$ 7.470,00</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="bg-brand-dark border-gray-800 text-white lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-gray-800 mb-4">
                        <CardTitle className="text-lg">Últimas Transações</CardTitle>
                        <Button variant="ghost" size="sm" className="text-xs text-gray-500 hover:text-white">Ver tudo</Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {transacoes.map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "h-10 w-10 rounded-full flex items-center justify-center",
                                            item.tipo === 'entrada' ? 'bg-green-500/10 text-green-500' : 'bg-brand-red/10 text-brand-red'
                                        )}>
                                            {item.tipo === 'entrada' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium">{item.desc}</h4>
                                            <p className="text-[10px] text-gray-500 font-mono tracking-tighter">{item.data} • {item.forma}</p>
                                        </div>
                                    </div>
                                    <div className={cn("text-sm font-bold", item.tipo === 'entrada' ? 'text-green-500' : 'text-brand-red')}>
                                        {item.tipo === 'entrada' ? '+' : '-'} R$ {Math.abs(item.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-brand-dark border-gray-800 text-white lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-lg">Contas a Vencer</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[
                                { desc: 'Internet Fibra', valor: 150.00, data: '30/01', status: 'pendente' },
                                { desc: 'Fornecedor Cobre', valor: 1200.00, data: '02/02', status: 'pendente' },
                                { desc: 'Manutenção Balança', valor: 450.00, data: '05/02', status: 'urgente' },
                            ].map((conta, i) => (
                                <div key={i} className="flex flex-col gap-2 p-3 border border-gray-800 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <span className="text-sm font-medium">{conta.desc}</span>
                                        <span className={cn(
                                            "text-[10px] px-1.5 py-0.5 rounded font-bold uppercase",
                                            conta.status === 'urgente' ? 'bg-brand-red text-white' : 'bg-gray-800 text-gray-400'
                                        )}>
                                            {conta.status}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-gray-500 flex items-center gap-1">
                                            <Calendar className="h-3 w-3" /> Vence em {conta.data}
                                        </span>
                                        <span className="font-bold text-white">R$ {conta.valor.toFixed(2)}</span>
                                    </div>
                                </div>
                            ))}
                            <Button className="w-full mt-4 bg-brand-yellow text-brand-dark font-bold hover:bg-brand-yellow/80">
                                Pagar Contas
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
