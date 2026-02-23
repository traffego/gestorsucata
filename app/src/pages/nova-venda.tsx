import { useState, useEffect } from "react";
import { ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, Zap, Loader2, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";


interface Client {
    id: string;
    nome: string;
}

export default function NovaVenda() {
    const { user } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string>("");
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [quickClientFormData, setQuickClientFormData] = useState({ nome: "", documento: "", telefone: "" });
    const [savingClient, setSavingClient] = useState(false);

    // Novo estado para o item sendo adicionado manualmente
    const [newItem, setNewItem] = useState({ name: "", price: "", quantity: "1" });

    const [cart, setCart] = useState<{ product: any; quantity: number }[]>([]);
    const [paymentMethod, setPaymentMethod] = useState<'dinheiro' | 'cartao' | 'pix' | null>(null);
    const [loading, setLoading] = useState(false);

    async function fetchClients() {
        const { data, error } = await supabase
            .from('clientes')
            .select('id, nome')
            .order('nome');

        if (error) {
            console.error('Erro ao buscar clientes:', error);
        } else if (data) {
            setClients(data);
        }
    }

    useEffect(() => {
        fetchClients();
    }, []);

    const addItemToCart = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.name || !newItem.price || !newItem.quantity) {
            alert("Preencha todos os campos do item.");
            return;
        }

        const price = parseFloat(newItem.price.replace(',', '.'));
        const quantity = parseFloat(newItem.quantity.replace(',', '.'));

        if (isNaN(price) || isNaN(quantity)) {
            alert("Preço ou quantidade inválidos.");
            return;
        }

        const product = {
            id: `temp-${Date.now()}`,
            name: newItem.name,
            price: price,
            type: 'peca' as const
        };

        setCart(prev => [...prev, { product, quantity }]);
        setNewItem({ name: "", price: "", quantity: "1" });
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.product.id !== id));
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.product.id === id) {
                const newQty = Math.max(0.1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const handleQuickClientSave = async () => {
        if (!quickClientFormData.nome) {
            alert("O nome do cliente é obrigatório.");
            return;
        }

        setSavingClient(true);
        try {
            const { data, error } = await supabase
                .from('clientes')
                .insert([quickClientFormData])
                .select()
                .single();

            if (error) throw error;

            // Atualizar lista e selecionar automaticamente
            await fetchClients();
            setSelectedClientId(data.id);
            setIsClientModalOpen(false);
            setQuickClientFormData({ nome: "", documento: "", telefone: "" });
        } catch (error: any) {
            console.error('Erro ao cadastrar cliente rápido:', error);
            alert(`Erro ao cadastrar cliente: ${error.message}`);
        } finally {
            setSavingClient(false);
        }
    };

    const total = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

    const handleFinalizeSale = async () => {
        if (cart.length === 0) {
            alert('Adicione pelo menos um item ao carrinho.');
            return;
        }
        if (!selectedClientId) {
            alert('Selecione um cliente para realizar a venda.');
            return;
        }
        if (!paymentMethod) {
            alert('Selecione uma forma de pagamento.');
            return;
        }

        setLoading(true);

        try {
            // 1. Inserir a venda
            const { data: venda, error: vendaError } = await supabase
                .from('vendas')
                .insert([{
                    valor_total: total,
                    forma_pagamento: paymentMethod,
                    status: 'concluida',
                    vendedor_id: user?.id, // Corrigido para vendedor_id conforme schema
                    cliente_id: selectedClientId
                }])
                .select()
                .single();

            if (vendaError) throw vendaError;

            // 2. Para cada item no carrinho, vamos criar um registro em 'produtos' 
            // e depois em 'itens_venda'.
            for (const item of cart) {
                const sku = `SALE-${venda.id.slice(0, 5)}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

                const { data: produto, error: prodError } = await supabase
                    .from('produtos')
                    .insert([{
                        nome: item.product.name,
                        sku: sku,
                        tipo: item.product.type,
                        preco_venda: item.product.price,
                        estoque_atual: 0, // Venda única, estoque não é o foco aqui mas o sistema exige
                        unidade_medida: 'un'
                    }])
                    .select()
                    .single();

                if (prodError) throw prodError;

                const { error: itemError } = await supabase
                    .from('itens_venda')
                    .insert([{
                        venda_id: venda.id,
                        produto_id: produto.id,
                        quantidade: item.quantity,
                        preco_unitario: item.product.price
                    }]);

                if (itemError) throw itemError;
            }

            const paymentLabels = {
                dinheiro: 'Dinheiro',
                cartao: 'Cartão',
                pix: 'PIX'
            };

            alert(`Venda finalizada com sucesso!\n\nTotal: R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\nForma de pagamento: ${paymentLabels[paymentMethod]}`);

            setCart([]);
            setPaymentMethod(null);
            setSelectedClientId("");
        } catch (error: any) {
            console.error('Erro ao salvar venda:', error);
            alert(`Erro ao finalizar venda: ${error.message || 'Erro desconhecido'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <Card className="bg-brand-dark border-gray-800 text-white">
                    <CardHeader>
                        <CardTitle>Adicionar Itens à Venda</CardTitle>
                        <p className="text-sm text-gray-500">Informe os detalhes do produto para esta venda específica.</p>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={addItemToCart} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Descrição do Produto</label>
                                <Input
                                    placeholder="Ex: Alumínio Batido, Motor de Geladeira, etc."
                                    className="bg-brand-darker border-gray-800 h-12 text-white text-lg focus:border-brand-yellow/50 transition-all font-bold"
                                    value={newItem.name}
                                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Preço Unitário (R$)</label>
                                    <Input
                                        placeholder="0,00"
                                        className="bg-brand-darker border-gray-800 h-12 text-white font-mono focus:border-brand-yellow/50 transition-all"
                                        value={newItem.price}
                                        onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Quantidade</label>
                                    <Input
                                        placeholder="1"
                                        type="text"
                                        className="bg-brand-darker border-gray-800 h-12 text-white font-mono focus:border-brand-yellow/50 transition-all"
                                        value={newItem.quantity}
                                        onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-brand-yellow text-brand-dark font-black hover:bg-brand-yellow/90 h-12 uppercase tracking-widest text-sm"
                            >
                                <Plus className="h-5 w-5 mr-2 stroke-[3px]" /> Adicionar ao Carrinho
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>

            <div className="lg:col-span-1">
                <Card className="bg-brand-dark border-gray-800 text-white sticky top-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5 text-brand-red" /> Carrinho
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Seleção de Cliente */}
                        <div className="space-y-2 border-b border-gray-800 pb-6">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <User className="h-3 w-3" /> Selecionar Cliente
                                </label>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsClientModalOpen(true)}
                                    className="h-6 text-[10px] bg-brand-red/10 text-brand-red hover:bg-brand-red hover:text-white px-2 uppercase font-bold tracking-widest"
                                >
                                    <Plus className="h-3 w-3 mr-1" /> Novo
                                </Button>
                            </div>
                            <select
                                value={selectedClientId}
                                onChange={(e) => setSelectedClientId(e.target.value)}
                                className="w-full bg-brand-darker border border-gray-800 rounded-lg h-11 px-4 text-sm text-gray-300 focus:border-brand-yellow/50 outline-none transition-all appearance-none cursor-pointer"
                            >
                                <option value="">Escolha um cliente...</option>
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>
                                        {client.nome}
                                    </option>
                                ))}
                            </select>
                            {clients.length === 0 && (
                                <p className="text-[10px] text-brand-red italic mt-1 font-medium">Nenhum cliente cadastrado. Cadastre um cliente primeiro.</p>
                            )}
                        </div>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {cart.length === 0 ? (
                                <p className="text-center text-gray-500 py-8 italic text-sm">O carrinho está vazio</p>
                            ) : (
                                cart.map(item => (
                                    <div key={item.product.id} className="flex gap-4 border-b border-gray-800 pb-4 last:border-0">
                                        <div className="flex-1">
                                            <h5 className="text-sm font-medium">{item.product.name}</h5>
                                            <span className="text-xs text-gray-500">R$ {item.product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="flex items-center gap-2 bg-brand-darker border border-gray-800 rounded px-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-gray-400"
                                                    onClick={() => updateQuantity(item.product.id, -1)}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <span className="text-xs font-mono w-4 text-center">{item.quantity}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-gray-400"
                                                    onClick={() => updateQuantity(item.product.id, 1)}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-red-500 hover:bg-red-500/10"
                                                onClick={() => removeFromCart(item.product.id)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="space-y-4 border-t border-gray-800 pt-6">
                            <div className="flex justify-between text-lg font-bold">
                                <span>Total</span>
                                <span className="text-brand-yellow">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    variant="outline"
                                    className={`border-gray-700 gap-2 ${paymentMethod === 'dinheiro' ? 'bg-brand-yellow text-black border-brand-yellow' : 'bg-transparent hover:bg-white/5'}`}
                                    onClick={() => setPaymentMethod('dinheiro')}
                                >
                                    <Banknote className="h-4 w-4" /> Dinheiro
                                </Button>
                                <Button
                                    variant="outline"
                                    className={`border-gray-700 gap-2 ${paymentMethod === 'cartao' ? 'bg-brand-yellow text-black border-brand-yellow' : 'bg-transparent hover:bg-white/5'}`}
                                    onClick={() => setPaymentMethod('cartao')}
                                >
                                    <CreditCard className="h-4 w-4" /> Cartão
                                </Button>
                                <Button
                                    variant="outline"
                                    className={`border-gray-700 gap-2 col-span-2 ${paymentMethod === 'pix' ? 'bg-brand-yellow text-black border-brand-yellow' : 'bg-transparent hover:bg-white/5'}`}
                                    onClick={() => setPaymentMethod('pix')}
                                >
                                    <Zap className="h-4 w-4" /> PIX
                                </Button>
                            </div>

                            <Button
                                className="w-full bg-brand-red hover:bg-brand-red/90 h-12 text-lg font-bold mt-4 shadow-lg shadow-brand-red/20"
                                onClick={handleFinalizeSale}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processando...
                                    </>
                                ) : (
                                    'Finalizar Venda'
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Modal de Cadastro Rápido de Cliente */}
            <Modal
                isOpen={isClientModalOpen}
                onClose={() => setIsClientModalOpen(false)}
                title="Novo Cliente - Cadastro Rápido"
                description="Preencha os dados básicos para identificar o cliente nesta venda."
                footer={
                    <>
                        <Button variant="outline" onClick={() => setIsClientModalOpen(false)} className="border-gray-800">
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleQuickClientSave}
                            disabled={savingClient}
                            className="bg-brand-red text-white hover:bg-brand-red/90"
                        >
                            {savingClient ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Salvar e Selecionar
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Nome Completo</label>
                        <Input
                            value={quickClientFormData.nome}
                            onChange={(e) => setQuickClientFormData({ ...quickClientFormData, nome: e.target.value })}
                            placeholder="Ex: João da Silva"
                            className="bg-brand-darker border-gray-800"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">CPF/CNPJ</label>
                            <Input
                                value={quickClientFormData.documento}
                                onChange={(e) => setQuickClientFormData({ ...quickClientFormData, documento: e.target.value })}
                                placeholder="000.000.000-00"
                                className="bg-brand-darker border-gray-800"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Telefone</label>
                            <Input
                                value={quickClientFormData.telefone}
                                onChange={(e) => setQuickClientFormData({ ...quickClientFormData, telefone: e.target.value })}
                                placeholder="(00) 00000-0000"
                                className="bg-brand-darker border-gray-800"
                            />
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
