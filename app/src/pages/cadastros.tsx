import { useState } from "react";
import { Plus, Search, Filter, Mail, Phone, MapPin, Building2, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Cliente {
    id: string;
    nome: string;
    documento: string;
    email: string;
    telefone: string;
    endereco: string;
    compras: number;
}

const mockClientes: Cliente[] = [
    { id: '1', nome: 'Indústria Metalúrgica Silva', documento: '12.345.678/0001-90', email: 'contato@silva.com.br', telefone: '(11) 98765-4321', endereco: 'Rua das Fábricas, 123 - SP', compras: 42 },
    { id: '2', nome: 'João da Sucata ME', documento: '98.765.432/0001-10', email: 'joao@sucata.com', telefone: '(11) 91234-5678', endereco: 'Av. Reciclagem, 456 - SP', compras: 18 },
    { id: '3', nome: 'Transportes Rápidos', documento: '45.123.789/0001-55', email: 'vendas@rapidos.com.br', telefone: '(11) 95555-4444', endereco: 'Rua do Frete, 88 - SP', compras: 5 },
];

export default function Cadastros() {
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-white italic tracking-tighter">CADASTRO DE CLIENTES</h2>
                    <p className="text-gray-500">Mantenha sua base de dados atualizada e organizada.</p>
                </div>
                <Button className="bg-brand-yellow text-brand-dark font-bold hover:bg-brand-yellow/90">
                    <Plus className="h-4 w-4 mr-2" /> Novo Cliente
                </Button>
            </div>

            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Buscar por nome, documento ou email..."
                        className="pl-10 bg-brand-dark border-gray-800 text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline" className="border-gray-800 bg-brand-dark text-gray-400">
                    <Filter className="h-4 w-4 mr-2" /> Filtros Avançados
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {mockClientes.filter(c => c.nome.toLowerCase().includes(searchTerm.toLowerCase())).map((cliente) => (
                    <Card key={cliente.id} className="bg-brand-dark border-gray-800 hover:border-brand-yellow/50 transition-all group overflow-hidden">
                        <CardContent className="p-0">
                            <div className="flex flex-col md:flex-row">
                                <div className="p-6 flex-1">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-lg bg-brand-darker border border-gray-700 flex items-center justify-center text-brand-red font-bold text-xl">
                                                {cliente.nome.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-white group-hover:text-brand-yellow transition-colors">{cliente.nome}</h3>
                                                <span className="text-xs text-gray-500 font-mono italic">{cliente.documento}</span>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="text-gray-500">
                                            <MoreHorizontal className="h-5 w-5" />
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8 mt-6">
                                        <div className="flex items-center gap-3 text-sm text-gray-400">
                                            <Mail className="h-4 w-4 text-brand-yellow" /> {cliente.email}
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-gray-400">
                                            <Phone className="h-4 w-4 text-brand-yellow" /> {cliente.telefone}
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-gray-400 lg:col-span-1">
                                            <MapPin className="h-4 w-4 text-brand-yellow" /> {cliente.endereco}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-brand-darker p-6 flex flex-row md:flex-col justify-center items-center gap-4 border-t md:border-t-0 md:border-l border-gray-800 min-w-[200px]">
                                    <div className="text-center">
                                        <div className="text-2xl font-black text-brand-red">{cliente.compras}</div>
                                        <div className="text-[10px] uppercase font-bold text-gray-500">Vendas Totais</div>
                                    </div>
                                    <Button size="sm" variant="outline" className="w-full border-gray-700 text-xs hover:bg-white/5">
                                        Ver Histórico
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
