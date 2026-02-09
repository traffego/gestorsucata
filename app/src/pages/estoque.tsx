import { useState, useEffect } from "react";
import {
    Package,
    Search,
    Plus,
    ArrowUpRight,
    ArrowDownRight,
    Trash2,
    Pencil,
    Loader2,
    AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { Modal } from "@/components/ui/modal";

interface Product {
    id: string;
    nome: string;
    sku: string;
    categoria: string;
    tipo: 'sucata' | 'peca';
    preco_venda: number;
    unidade_medida: string;
    estoque_atual: number;
    estoque_minimo: number;
    localizacao: string;
    data_cadastro: string;
}

export default function Estoque() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("Todas");

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState<Partial<Product>>({
        nome: '',
        sku: '',
        categoria: 'Geral',
        tipo: 'peca',
        preco_venda: 0,
        unidade_medida: 'un',
        estoque_atual: 0,
        estoque_minimo: 5,
        localizacao: ''
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    async function fetchProducts() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('produtos')
                .select('*')
                .order('nome');

            if (error) throw error;
            setProducts(data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    }

    const handleOpenModal = (product?: Product) => {
        if (product) {
            setEditingProduct(product);
            setFormData(product);
        } else {
            setEditingProduct(null);
            setFormData({
                nome: '',
                sku: `SKU-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
                categoria: 'Geral',
                tipo: 'peca',
                preco_venda: 0,
                unidade_medida: 'un',
                estoque_atual: 0,
                estoque_minimo: 5,
                localizacao: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
    };

    // Helper functions for masks
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Remove everything but numbers
        const value = e.target.value.replace(/\D/g, "");
        // Convert to cents
        const cents = Number(value) / 100;
        setFormData({ ...formData, preco_venda: cents });
    };

    const handleSKUChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, sku: e.target.value.toUpperCase() });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (!formData.nome || !formData.sku) {
            alert('Nome e SKU são obrigatórios.');
            return;
        }

        setLoading(true);
        try {
            if (editingProduct) {
                const { error } = await supabase
                    .from('produtos')
                    .update(formData)
                    .eq('id', editingProduct.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('produtos')
                    .insert([formData]);
                if (error) throw error;
            }
            await fetchProducts();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Erro ao salvar produto. Verifique se o SKU é único.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este produto?')) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('produtos')
                .delete()
                .eq('id', id);
            if (error) throw error;
            await fetchProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Erro ao excluir produto. Ele pode estar sendo usado em vendas.');
        } finally {
            setLoading(false);
        }
    };

    const handleQuickStock = async (id: string, delta: number) => {
        const product = products.find(p => p.id === id);
        if (!product) return;

        const newStock = Math.max(0, Number(product.estoque_atual) + delta);

        try {
            const { error } = await supabase
                .from('produtos')
                .update({ estoque_atual: newStock })
                .eq('id', id);
            if (error) throw error;

            setProducts(products.map(p => p.id === id ? { ...p, estoque_atual: newStock } : p));
        } catch (error) {
            console.error('Error updating stock:', error);
        }
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === "Todas" || p.categoria === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const categories = ["Todas", ...new Set(products.map(p => p.categoria || "Geral"))];

    const getStatus = (product: Product) => {
        if (product.estoque_atual <= 0) return 'critico';
        if (product.estoque_atual <= (product.estoque_minimo || 0)) return 'baixo';
        return 'ok';
    };

    const totalValue = products.reduce((acc, p) => acc + (Number(p.estoque_atual) * Number(p.preco_venda || 0)), 0);
    const alertItems = products.filter(p => getStatus(p) !== 'ok').length;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white italic">CONTROLE DE ESTOQUE</h2>
                    <p className="text-gray-400">Gerencie seu inventário de sucatas e peças em tempo real.</p>
                </div>
                <div className="flex gap-3">
                    <select
                        className="bg-brand-dark border border-gray-700 text-gray-400 text-sm rounded-lg focus:ring-brand-yellow focus:border-brand-yellow p-2.5"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <Button onClick={() => handleOpenModal()} className="bg-brand-red hover:bg-brand-red/90 text-white shadow-[0_0_15px_rgba(227,30,36,0.3)]">
                        <Plus className="h-4 w-4 mr-2" /> Novo Item
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-brand-dark border-gray-800 text-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Total de Itens Unique</CardTitle>
                        <Package className="h-4 w-4 text-brand-yellow" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{products.length}</div>
                        <p className="text-xs text-gray-500 mt-1 italic">Diferentes modelos em estoque</p>
                    </CardContent>
                </Card>
                <Card className="bg-brand-dark border-gray-800 text-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Itens em Alerta</CardTitle>
                        <AlertTriangle className={cn("h-4 w-4", alertItems > 0 ? "text-brand-red animate-pulse" : "text-gray-600")} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{alertItems}</div>
                        <p className="text-xs text-red-500 flex items-center mt-1">
                            {alertItems > 0 ? "Requer atenção imediata" : "Tudo sob controle"}
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-brand-dark border-gray-800 text-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Valor Estimado</CardTitle>
                        <span className="text-brand-yellow font-bold text-sm">R$</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-brand-yellow">
                            {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>
                        <p className="text-xs text-gray-500 mt-1 italic">Baseado no preço de venda atual</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-brand-dark border-gray-800 text-white">
                <CardHeader>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Pesquisar por nome ou SKU..."
                            className="pl-10 bg-brand-darker border-gray-700 text-white max-w-sm focus:border-brand-yellow"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {loading && products.length === 0 ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-brand-yellow" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left border-b border-gray-800 text-gray-400">
                                        <th className="pb-3 font-medium">Item</th>
                                        <th className="pb-3 font-medium">SKU</th>
                                        <th className="pb-3 font-medium">Categoria</th>
                                        <th className="pb-3 font-medium text-right">Estoque</th>
                                        <th className="pb-3 font-medium text-center">Ajuste Rápido</th>
                                        <th className="pb-3 font-medium">Status</th>
                                        <th className="pb-3 font-medium text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {filteredProducts.map((item) => {
                                        const status = getStatus(item);
                                        return (
                                            <tr key={item.id} className="text-gray-300 hover:bg-white/5 transition-colors group">
                                                <td className="py-4">
                                                    <div className="font-medium text-white">{item.nome}</div>
                                                    <div className="text-[10px] text-gray-500 italic">{item.localizacao || 'Sem local'}</div>
                                                </td>
                                                <td className="py-4 font-mono text-xs text-gray-400">{item.sku}</td>
                                                <td className="py-4">
                                                    <span className="px-2 py-0.5 rounded text-[10px] bg-gray-800 text-gray-400 group-hover:bg-brand-yellow/10 group-hover:text-brand-yellow transition-colors">
                                                        {item.categoria}
                                                    </span>
                                                </td>
                                                <td className="py-4 text-right font-bold text-white">
                                                    {item.estoque_atual} <span className="text-[10px] text-gray-500 font-normal">{item.unidade_medida}</span>
                                                </td>
                                                <td className="py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleQuickStock(item.id, -1)}
                                                            className="p-1 rounded bg-gray-800 hover:bg-red-500/20 text-red-500 transition-colors"
                                                        >
                                                            <ArrowDownRight className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleQuickStock(item.id, 1)}
                                                            className="p-1 rounded bg-gray-800 hover:bg-green-500/20 text-green-500 transition-colors"
                                                        >
                                                            <ArrowUpRight className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn(
                                                            "h-1.5 w-1.5 rounded-full",
                                                            status === 'ok' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' :
                                                                status === 'baixo' ? 'bg-brand-yellow shadow-[0_0_8px_rgba(255,215,0,0.5)]' :
                                                                    'bg-brand-red shadow-[0_0_8px_rgba(227,30,36,0.5)]'
                                                        )} />
                                                        <span className={cn(
                                                            "capitalize text-[10px] font-bold tracking-wider",
                                                            status === 'ok' ? 'text-green-500' :
                                                                status === 'baixo' ? 'text-brand-yellow' : 'text-brand-red'
                                                        )}>
                                                            {status}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-4 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-gray-500 hover:text-brand-yellow hover:bg-brand-yellow/10"
                                                            onClick={() => handleOpenModal(item)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-gray-500 hover:text-brand-red hover:bg-brand-red/10"
                                                            onClick={() => handleDelete(item.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredProducts.length === 0 && !loading && (
                                        <tr>
                                            <td colSpan={7} className="py-12 text-center text-gray-500 italic">
                                                Nenhum produto encontrado.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal de Cadastro/Edição */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingProduct ? "Editar Produto" : "Novo Produto"}
                description={editingProduct ? "Atualize as informações do item selecionado." : "Cadastre um novo item no seu inventário."}
                footer={
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={handleCloseModal} className="border-gray-700 text-gray-400">
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="bg-brand-red hover:bg-brand-red/90 text-white font-bold"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {editingProduct ? "Salvar Alterações" : "Cadastrar Produto"}
                        </Button>
                    </div>
                }
            >
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nome do Produto</label>
                        <Input
                            value={formData.nome || ""}
                            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                            className="bg-brand-darker border-gray-800 text-white focus:border-brand-yellow"
                            placeholder="Ex: Alumínio Batido"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">SKU / Código</label>
                        <Input
                            value={formData.sku || ""}
                            onChange={handleSKUChange}
                            className="bg-brand-darker border-gray-800 text-white focus:border-brand-yellow uppercase"
                            placeholder="GS-001"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Categoria</label>
                        <Input
                            value={formData.categoria || ""}
                            onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                            className="bg-brand-darker border-gray-800 text-white focus:border-brand-yellow"
                            placeholder="Ex: Sucatas"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Preço de Venda (R$)</label>
                        <Input
                            value={formatCurrency(formData.preco_venda || 0)}
                            onChange={handlePriceChange}
                            className="bg-brand-darker border-gray-800 text-white focus:border-brand-yellow font-bold text-brand-yellow"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Unidade</label>
                        <select
                            className="w-full bg-brand-darker border border-gray-800 text-white text-sm rounded-lg focus:ring-brand-yellow focus:border-brand-yellow p-2"
                            value={formData.unidade_medida}
                            onChange={(e) => setFormData({ ...formData, unidade_medida: e.target.value })}
                        >
                            <option value="kg">Quilograma (kg)</option>
                            <option value="un">Unidade (un)</option>
                            <option value="mt">Metro (mt)</option>
                            <option value="ton">Tonelada (ton)</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Estoque Atual</label>
                        <Input
                            type="number"
                            min="0"
                            value={formData.estoque_atual}
                            onChange={(e) => setFormData({ ...formData, estoque_atual: Math.max(0, Number(e.target.value)) })}
                            className="bg-brand-darker border-gray-800 text-white focus:border-brand-yellow"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Estoque Mínimo</label>
                        <Input
                            type="number"
                            min="0"
                            value={formData.estoque_minimo}
                            onChange={(e) => setFormData({ ...formData, estoque_minimo: Math.max(0, Number(e.target.value)) })}
                            className="bg-brand-darker border-gray-800 text-white focus:border-brand-yellow"
                        />
                    </div>
                    <div className="space-y-2 col-span-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Localização</label>
                        <Input
                            value={formData.localizacao || ""}
                            onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
                            className="bg-brand-darker border-gray-800 text-white focus:border-brand-yellow"
                            placeholder="Ex: Galpão A - Prateleira 2"
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
}
