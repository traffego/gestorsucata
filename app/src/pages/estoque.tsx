import { useState } from "react";
import { Package, Search, Filter, MoreVertical, Plus, ArrowUpRight, ArrowDownRight, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface InventoryItem {
    id: string;
    name: string;
    sku: string;
    category: string;
    quantity: number;
    unit: string;
    location: string;
    lastUpdated: string;
    status: 'ok' | 'baixo' | 'critico';
}

const mockInventory: InventoryItem[] = [
    { id: '1', name: 'Sucata de Alumínio', sku: 'SUC-AL-001', category: 'Sucatas', quantity: 1250, unit: 'kg', location: 'Box 04', lastUpdated: '25/01/2026', status: 'ok' },
    { id: '2', name: 'Cabos de Cobre Mel', sku: 'SUC-CO-002', category: 'Sucatas', quantity: 15, unit: 'kg', location: 'Cofre A', lastUpdated: '27/01/2026', status: 'critico' },
    { id: '3', name: 'Baterias Automotivas', sku: 'BAT-001', category: 'Peças', quantity: 42, unit: 'un', location: 'Estante 02', lastUpdated: '24/01/2026', status: 'baixo' },
    { id: '4', name: 'Motores Elétricos', sku: 'MOT-055', category: 'Peças', quantity: 12, unit: 'un', location: 'Depósito Sul', lastUpdated: '20/01/2026', status: 'ok' },
];

export default function Estoque() {
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white italic">CONTROLE DE ESTOQUE</h2>
                    <p className="text-gray-400">Gerencie seu inventário de sucatas e peças em tempo real.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="border-gray-700 bg-transparent text-gray-400 hover:text-white">
                        <Filter className="h-4 w-4 mr-2" /> Filtrar
                    </Button>
                    <Button className="bg-brand-red hover:bg-brand-red/90 text-white">
                        <Plus className="h-4 w-4 mr-2" /> Novo Item
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-brand-dark border-gray-800 text-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Total de Itens</CardTitle>
                        <Package className="h-4 w-4 text-brand-yellow" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1,452</div>
                        <p className="text-xs text-green-500 flex items-center mt-1">
                            <ArrowUpRight className="h-3 w-3 mr-1" /> +12% desde o mês passado
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-brand-dark border-gray-800 text-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Itens em Alerta</CardTitle>
                        <Tag className="h-4 w-4 text-brand-red" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">08</div>
                        <p className="text-xs text-red-500 flex items-center mt-1">
                            <ArrowDownRight className="h-3 w-3 mr-1" /> Requer atenção imediata
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-brand-dark border-gray-800 text-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Valor em Estoque</CardTitle>
                        <span className="text-brand-yellow font-bold text-sm">R$</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-brand-yellow">R$ 245.890</div>
                        <p className="text-xs text-gray-500 mt-1 italic">Cálculo baseado no preço médio de compra</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-brand-dark border-gray-800 text-white">
                <CardHeader>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Pesquisar estoque..."
                            className="pl-10 bg-brand-darker border-gray-700 text-white max-w-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left border-b border-gray-800 text-gray-400">
                                    <th className="pb-3 font-medium">Item</th>
                                    <th className="pb-3 font-medium">SKU</th>
                                    <th className="pb-3 font-medium">Categoria</th>
                                    <th className="pb-3 font-medium text-right">Quantidade</th>
                                    <th className="pb-3 font-medium">Localização</th>
                                    <th className="pb-3 font-medium">Status</th>
                                    <th className="pb-3 font-medium text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {mockInventory.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase())).map((item) => (
                                    <tr key={item.id} className="text-gray-300 hover:bg-white/5 transition-colors group">
                                        <td className="py-4">
                                            <div className="font-medium text-white">{item.name}</div>
                                            <div className="text-[10px] text-gray-500 italic">Atualizado em: {item.lastUpdated}</div>
                                        </td>
                                        <td className="py-4 font-mono text-xs">{item.sku}</td>
                                        <td className="py-4">
                                            <span className="px-2 py-0.5 rounded text-[10px] bg-gray-800 text-gray-300">
                                                {item.category}
                                            </span>
                                        </td>
                                        <td className="py-4 text-right font-bold text-brand-yellow">
                                            {item.quantity} {item.unit}
                                        </td>
                                        <td className="py-4 text-gray-400">{item.location}</td>
                                        <td className="py-4">
                                            <div className="flex items-center gap-2">
                                                <div className={cn(
                                                    "h-2 w-2 rounded-full",
                                                    item.status === 'ok' ? 'bg-green-500' :
                                                        item.status === 'baixo' ? 'bg-brand-yellow' : 'bg-brand-red'
                                                )} />
                                                <span className="capitalize text-xs">{item.status}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 text-right">
                                            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-white">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
