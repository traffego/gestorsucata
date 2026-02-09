import { useState } from "react";
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, QrCode } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Product {
    id: string;
    name: string;
    price: number;
    type: 'sucata' | 'peca';
    stock: string;
}

const mockProducts: Product[] = [
    { id: '1', name: 'Sucata Ferro Novo', price: 1.5, type: 'sucata', stock: '500kg' },
    { id: '2', name: 'Sucata Cobre Mel', price: 42.0, type: 'sucata', stock: '45kg' },
    { id: '3', name: 'Sucata Alumínio', price: 8.5, type: 'sucata', stock: '120kg' },
    { id: '4', name: 'Radiador Caminhão', price: 250.0, type: 'peca', stock: '12 un' },
    { id: '5', name: 'Alternador 12V', price: 180.0, type: 'peca', stock: '8 un' },
];

export default function NovaVenda() {
    const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<'dinheiro' | 'cartao' | 'pix' | null>(null);

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

    const handleFinalizeSale = () => {
        if (cart.length === 0) {
            alert('Adicione pelo menos um item ao carrinho.');
            return;
        }
        if (!paymentMethod) {
            alert('Selecione uma forma de pagamento.');
            return;
        }

        const paymentLabels = {
            dinheiro: 'Dinheiro',
            cartao: 'Cartão',
            pix: 'PIX'
        };

        alert(`Venda finalizada!\n\nTotal: R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\nForma de pagamento: ${paymentLabels[paymentMethod]}`);

        setCart([]);
        setPaymentMethod(null);
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {mockProducts.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(product => (
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
                            >
                                Finalizar Venda
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
