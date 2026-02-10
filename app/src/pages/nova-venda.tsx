import { useState, useEffect } from "react";
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, QrCode, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface Product {
    id: string;
    name: string;
    price: number;
    type: 'sucata' | 'peca';
    stock: string;
}

interface Client {
    id: string;
    nome: string;
}

export default function NovaVenda() {
    const { user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string>("");
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<'dinheiro' | 'cartao' | 'pix' | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function fetchProducts() {
            setLoadingProducts(true);
            const { data, error } = await supabase
                .from('produtos')
                .select('id, nome, preco_venda, tipo, estoque_atual, unidade_medida');

            if (error) {
                console.error('Erro ao buscar produtos:', error);
            } else if (data) {
                const mapped: Product[] = data.map((p: any) => ({
                    id: p.id,
                    name: p.nome,
                    price: p.preco_venda || 0,
                    type: p.tipo as 'sucata' | 'peca',
                    stock: `${p.estoque_atual || 0} ${p.unidade_medida || 'un'}`
                }));
                setProducts(mapped);
            }
            setLoadingProducts(false);
        }

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

        fetchProducts();
        fetchClients();
    }, []);

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prev, { product, quantity: 1 }];
        });
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.product.id !== id));
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.product.id === id) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
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
                    usuario_id: user?.id, // Registrar o vendedor
                    cliente_id: selectedClientId
                }])
                .select()
                .single();

            if (vendaError) throw vendaError;

            // 2. Inserir os itens da venda
            const itensParaInserir = cart.map(item => ({
                venda_id: venda.id,
                produto_id: item.product.id,
                quantidade: item.quantity,
                preco_unitario: item.product.price
            }));

            const { error: itensError } = await supabase
                .from('itens_venda')
                .insert(itensParaInserir);

            if (itensError) throw itensError;

            const paymentLabels = {
                dinheiro: 'Dinheiro',
                cartao: 'Cartão',
                pix: 'PIX'
            };

            alert(`Venda finalizada e salva com sucesso!\n\nTotal: R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\nForma de pagamento: ${paymentLabels[paymentMethod]}`);

            setCart([]);
            setPaymentMethod(null);
            setSelectedClientId("");
        } catch (error: any) {
            console.error('Erro ao salvar venda:', error);
            alert(`Erro ao finalizar venda: ${error.message || 'Erro desconhecido'}\n\nVerifique se o Supabase está configurado corretamente.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <Card className="bg-brand-dark border-gray-800 text-white">
                    <CardHeader>
                        <CardTitle>Produtos Disponíveis</CardTitle>
                        <div className="relative mt-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Buscar por nome ou código..."
                                className="pl-10 bg-brand-darker border-gray-700 text-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loadingProducts ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-brand-yellow" />
                                <span className="ml-2 text-gray-400">Carregando produtos...</span>
                            </div>
                        ) : products.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">Nenhum produto cadastrado no banco de dados.</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(product => (
                                    <div
                                        key={product.id}
                                        className="p-4 border border-gray-800 rounded-lg hover:border-brand-yellow transition-colors bg-brand-darker/50 group"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-semibold text-gray-200">{product.name}</h4>
                                                <span className="text-[10px] uppercase font-bold text-brand-yellow px-1.5 py-0.5 border border-brand-yellow/30 rounded">
                                                    {product.type}
                                                </span>
                                            </div>
                                            <span className="text-lg font-bold text-white">
                                                R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center mt-4">
                                            <span className="text-xs text-gray-500 italic">Estoque: {product.stock}</span>
                                            <Button
                                                size="sm"
                                                className="bg-brand-red hover:bg-brand-red/90 text-white gap-2"
                                                onClick={() => addToCart(product)}
                                            >
                                                <Plus className="h-4 w-4" /> Adicionar
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
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
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <User className="h-3 w-3" /> Selecionar Cliente
                            </label>
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
                                    <QrCode className="h-4 w-4" /> PIX
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
        </div>
    );
}
