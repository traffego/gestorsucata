import { useState } from "react";
import {
    Plus, Search, MoreHorizontal,
    Factory, Tag, Package, Users, Truck, UserCheck, MapPin
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

type EntityType = 'sucatas' | 'pecas' | 'categorias' | 'clientes' | 'localizacoes' | 'transportadoras' | 'vendedores' | 'fornecedores';

interface EntityConfig {
    id: EntityType;
    label: string;
    icon: any;
    color: string;
}

const ENTITIES: EntityConfig[] = [
    { id: 'sucatas', label: 'Sucatas', icon: Factory, color: 'text-brand-red' },
    { id: 'pecas', label: 'Peças', icon: Tag, color: 'text-brand-yellow' },
    { id: 'categorias', label: 'Categorias', icon: Package, color: 'text-blue-500' },
    { id: 'clientes', label: 'Clientes', icon: Users, color: 'text-green-500' },
    { id: 'localizacoes', label: 'Localizações', icon: MapPin, color: 'text-purple-500' },
    { id: 'transportadoras', label: 'Transportadoras', icon: Truck, color: 'text-orange-500' },
    { id: 'vendedores', label: 'Vendedores', icon: UserCheck, color: 'text-pink-500' },
    { id: 'fornecedores', label: 'Fornecedores', icon: Factory, color: 'text-cyan-500' },
];

export default function Cadastros() {
    const [activeEntity, setActiveEntity] = useState<EntityType>('clientes');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const currentEntity = ENTITIES.find(e => e.id === activeEntity)!;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">
                        Módulo de Cadastros: <span className={currentEntity.color}>{currentEntity.label}</span>
                    </h2>
                    <p className="text-gray-500 text-sm">Gerencie {currentEntity.label.toLowerCase()} do sistema GS PRO.</p>
                </div>
                <Button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-brand-yellow text-brand-dark font-black hover:bg-brand-yellow/90 uppercase tracking-widest px-8"
                >
                    <Plus className="h-4 w-4 mr-2 stroke-[3px]" /> Novo {currentEntity.label.slice(0, -1)}
                </Button>
            </div>

            {/* Navegação de Entidades */}
            <div className="flex overflow-x-auto pb-4 gap-2 no-scrollbar">
                {ENTITIES.map((entity) => (
                    <button
                        key={entity.id}
                        onClick={() => setActiveEntity(entity.id)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all whitespace-nowrap text-sm font-bold",
                            activeEntity === entity.id
                                ? "bg-brand-dark border-brand-yellow text-brand-yellow shadow-[0_0_15px_rgba(255,215,0,0.1)]"
                                : "bg-brand-dark/50 border-gray-800 text-gray-500 hover:text-gray-300 hover:border-gray-700"
                        )}
                    >
                        <entity.icon className={cn("h-4 w-4", activeEntity === entity.id ? entity.color : "text-gray-600")} />
                        {entity.label}
                    </button>
                ))}
            </div>

            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder={`Buscar em ${currentEntity.label.toLowerCase()}...`}
                        className="pl-10 bg-brand-dark border-gray-800 text-white h-12 focus:border-brand-yellow/50 transition-all font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {/* Renderização condicional mockada para exemplo */}
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="bg-brand-dark border-gray-800 hover:border-brand-yellow/30 transition-all group overflow-hidden">
                        <CardContent className="p-0">
                            <div className="flex flex-col md:flex-row">
                                <div className="p-6 flex-1">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className={cn("h-14 w-14 rounded-2xl bg-brand-darker border border-gray-800 flex items-center justify-center font-black text-2xl shadow-inner", currentEntity.color)}>
                                                <currentEntity.icon className="h-7 w-7" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-white group-hover:text-brand-yellow transition-colors">{currentEntity.label} Exemplo #{i}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] bg-brand-darker px-2 py-0.5 rounded border border-gray-800 text-gray-500 font-mono tracking-tighter">ID: GSPRO-00{i}</span>
                                                    <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded border border-green-500/20 font-bold uppercase tracking-widest">Ativo</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-white bg-brand-darker border border-gray-800">
                                                <MoreHorizontal className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Informação Principal</span>
                                            <p className="text-sm text-gray-300">Dado Relevante #{i}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Contato / Ref</span>
                                            <p className="text-sm text-gray-300">contato@exemplo.com</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Data Cadastro</span>
                                            <p className="text-sm text-gray-300">27/01/2026</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-brand-darker/50 p-6 flex flex-row md:flex-col justify-center items-center gap-4 border-t md:border-t-0 md:border-l border-gray-800 min-w-[180px]">
                                    <Button variant="outline" className="w-full border-gray-800 bg-brand-dark h-11 text-xs font-bold uppercase hover:bg-brand-yellow hover:text-brand-dark transition-all">
                                        Detalhes
                                    </Button>
                                    <Button variant="outline" className="w-full border-gray-800 bg-brand-dark h-11 text-xs font-bold uppercase hover:bg-brand-red hover:text-white transition-all">
                                        Editar
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Modal Genérico de Cadastro */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`Novo Cadastro - ${currentEntity.label}`}
                description={`Informe os dados abaixo para registrar um novo ${currentEntity.label.toLowerCase()} no GS PRO.`}
                footer={
                    <>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)} className="border-gray-800 px-8 text-gray-400">
                            Cancelar
                        </Button>
                        <Button className="bg-brand-red text-white px-10 font-bold hover:bg-brand-red/90 uppercase tracking-widest">
                            Salvar Registro
                        </Button>
                    </>
                }
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nome Completo / Razão</label>
                        <Input className="bg-brand-darker border-gray-800 h-12 focus:border-brand-yellow/50 transition-all font-medium" placeholder="Ex: Metalúrgica Central" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Documento (CPF/CNPJ)</label>
                        <Input className="bg-brand-darker border-gray-800 h-12 focus:border-brand-yellow/50 transition-all font-medium font-mono" placeholder="00.000.000/0000-00" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email de Contato</label>
                        <Input className="bg-brand-darker border-gray-800 h-12 focus:border-brand-yellow/50 transition-all font-medium" placeholder="nome@empresa.com" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Telefone / WhatsApp</label>
                        <Input className="bg-brand-darker border-gray-800 h-12 focus:border-brand-yellow/50 transition-all font-medium" placeholder="(00) 00000-0000" />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Endereço Completo</label>
                        <Input className="bg-brand-darker border-gray-800 h-12 focus:border-brand-yellow/50 transition-all font-medium" placeholder="Rua, Número, Bairro, Cidade - UF" />
                    </div>
                    {currentEntity.id === 'sucatas' || currentEntity.id === 'pecas' ? (
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Preço Sugerido (R$)</label>
                            <Input className="bg-brand-darker border-gray-800 h-12 focus:border-brand-yellow/50 transition-all font-medium font-mono" placeholder="0,00" />
                        </div>
                    ) : null}
                    {currentEntity.id === 'vendedores' ? (
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Comissão (%)</label>
                            <Input className="bg-brand-darker border-gray-800 h-12 focus:border-brand-yellow/50 transition-all font-medium font-mono" placeholder="5" />
                        </div>
                    ) : null}
                </div>
            </Modal>
        </div>
    );
}
