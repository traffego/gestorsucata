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

const fluxodeCaixaData = [
    { name: 'Jan', entrada: 2000, saida: 1500 },
    { name: 'Fev', entrada: 3500, saida: 2200 },
    { name: 'Mar', entrada: 2800, saida: 3200 },
    { name: 'Abr', entrada: 2400, saida: 1800 },
    { name: 'Mai', entrada: 3800, saida: 2500 },
    { name: 'Jun', entrada: 3200, saida: 1800 },
];

const despesasData = [
    { name: 'Aluguel', value: 1800 },
    { name: 'Salários', value: 1400 },
    { name: 'Energia', value: 1100 },
    { name: 'Manut.', value: 900 },
    { name: 'Outros', value: 600 },
];

const lucroData = [
    { name: 'Trim 1', value: 150 },
    { name: 'Fev/22', value: 280 },
    { name: 'Trim B', value: 220 },
    { name: 'Abril', value: 450 },
];

const girodeEstoqueData = [
    { name: 'Rápido', value: 70 },
    { name: 'Lento', value: 30 },
];



export default function Dashboard() {
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
                                <LineChart data={fluxodeCaixaData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#2c2c2c" vertical={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Line type="monotone" dataKey="entrada" stroke="#4ade80" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="saida" stroke="#f43f5e" strokeWidth={2} dot={false} />
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
                                <BarChart data={despesasData}>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff' }}
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
                                <AreaChart data={lucroData}>
                                    <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                                    <Area type="monotone" dataKey="value" stroke="#FFD700" fill="#FFD700" fillOpacity={0.2} strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-brand-dark border-gray-800 text-white col-span-1">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Giro de Estoque (Rápido/Lento)</CardTitle>
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
                                    <Tooltip />
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
                        <p className="text-xs text-gray-400">Vendas, Lojas, Vendedor</p>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left border-b border-gray-800 text-gray-400">
                                        <th className="pb-3 font-medium">Loja</th>
                                        <th className="pb-3 font-medium">Vendedor</th>
                                        <th className="pb-3 font-medium">Data/Hora</th>
                                        <th className="pb-3 font-medium">Cotação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {[
                                        { loja: 'Filial 01', vendedor: 'Caieta Rdornor Amato', data: '04/01/2023 18:54:53', cotacao: 'R$ 133.900 deserto' },
                                        { loja: 'Sede Principal', vendedor: 'Sucata Anemior Amato', data: '18/01/2023 19:33:01', cotacao: 'R$ 109.500 v/esperto' },
                                        { loja: 'Filial 02', vendedor: 'Ricardo Oliveira', data: '22/01/2023 10:15:22', cotacao: 'R$ 87.200 pronto' },
                                    ].map((sale, i) => (
                                        <tr key={i} className="text-gray-300">
                                            <td className="py-4">{sale.loja}</td>
                                            <td className="py-4">{sale.vendedor}</td>
                                            <td className="py-4">{sale.data}</td>
                                            <td className="py-4 font-mono text-brand-yellow font-semibold">{sale.cotacao}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-brand-dark border-gray-800 text-white lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">Desempenho por Vendedor/Loja</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <div className="flex items-center gap-1">
                                    <div className="h-3 w-3 bg-brand-red rounded-sm"></div>
                                    <span>Vendedor</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="h-3 w-3 bg-brand-yellow rounded-sm"></div>
                                    <span>Lucro</span>
                                </div>
                            </div>

                            {[
                                { name: 'Admin', value: 90, color: 'bg-brand-red' },
                                { name: 'Loja 01', value: 75, color: 'bg-brand-yellow' },
                                { name: 'Loja 02', value: 60, color: 'bg-brand-red' },
                                { name: 'Vendedor X', value: 45, color: 'bg-brand-yellow' },
                            ].map((item, i) => (
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
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
