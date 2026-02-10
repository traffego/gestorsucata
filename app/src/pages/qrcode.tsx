import { useState, useEffect } from "react";
import { Download, Copy, RefreshCw, Smartphone, Package, Tag, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QRCodeSVG } from 'qrcode.react';
import { cn } from "@/lib/utils";

export default function QRCodeModule() {
    const [qrValue, setQrValue] = useState("GSPRO-SCAN");
    const [type, setType] = useState<'produto' | 'venda' | 'usuario'>('produto');
    const [generationDate, setGenerationDate] = useState("");

    useEffect(() => {
        setGenerationDate(new Date().toLocaleString('pt-BR'));
    }, []);

    const handleRefresh = () => {
        setGenerationDate(new Date().toLocaleString('pt-BR'));
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-extrabold tracking-tight text-white italic">SISTEMA QR CODE</h2>
                <p className="text-gray-400">Gere e gerencie etiquetas inteligentes para rastreamento instantâneo.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-white">
                <Card className="bg-brand-dark border-gray-800 lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Gerador de Código</CardTitle>
                        <CardDescription className="text-gray-500">Insira as informações para gerar o QR Code.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <label className="text-xs font-bold uppercase text-gray-400 tracking-widest">Tipo de Identificador</label>
                            <div className="grid grid-cols-3 gap-2">
                                <Button
                                    variant={type === 'produto' ? 'default' : 'outline'}
                                    className={cn("h-auto py-3 flex-col gap-2 border-gray-800", type === 'produto' && "bg-brand-red")}
                                    onClick={() => setType('produto')}
                                >
                                    <Package className="h-4 w-4" />
                                    <span className="text-[10px]">Produto</span>
                                </Button>
                                <Button
                                    variant={type === 'venda' ? 'default' : 'outline'}
                                    className={cn("h-auto py-3 flex-col gap-2 border-gray-800", type === 'venda' && "bg-brand-red")}
                                    onClick={() => setType('venda')}
                                >
                                    <Tag className="h-4 w-4" />
                                    <span className="text-[10px]">Venda</span>
                                </Button>
                                <Button
                                    variant={type === 'usuario' ? 'default' : 'outline'}
                                    className={cn("h-auto py-3 flex-col gap-2 border-gray-800", type === 'usuario' && "bg-brand-red")}
                                    onClick={() => setType('usuario')}
                                >
                                    <User className="h-4 w-4" />
                                    <span className="text-[10px]">Usuário</span>
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-gray-400 tracking-widest">Valor do Identificador</label>
                            <Input
                                value={qrValue}
                                onChange={(e) => setQrValue(e.target.value)}
                                className="bg-brand-darker border-gray-700 text-brand-yellow font-mono"
                            />
                        </div>

                        <Button
                            onClick={handleRefresh}
                            className="w-full bg-brand-yellow text-brand-dark font-bold hover:bg-brand-yellow/80 gap-2"
                        >
                            <RefreshCw className="h-4 w-4" /> Atualizar Código
                        </Button>
                    </CardContent>
                </Card>

                <Card className="bg-brand-dark border-gray-800 lg:col-span-2 flex flex-col items-center justify-center p-8 relative overflow-hidden text-center">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-red via-brand-yellow to-brand-red"></div>

                    <div className="bg-white p-6 rounded-2xl shadow-2xl shadow-white/5 mb-8 transform hover:scale-105 transition-transform duration-300">
                        <QRCodeSVG
                            value={qrValue}
                            size={220}
                            level="H"
                            includeMargin={false}
                            imageSettings={{
                                src: "/vite.svg",
                                x: undefined,
                                y: undefined,
                                height: 40,
                                width: 40,
                                excavate: true,
                            }}
                        />
                    </div>

                    <div className="space-y-2 mb-8">
                        <h3 className="text-2xl font-bold text-white tracking-widest uppercase">{qrValue}</h3>
                        <p className="text-gray-500 text-sm">Escaneie para acessar os detalhes deste {type}</p>
                    </div>

                    <div className="flex flex-wrap gap-4 justify-center">
                        <Button variant="outline" className="border-gray-700 bg-transparent text-gray-300 hover:text-white gap-2 px-6">
                            <Download className="h-4 w-4" /> Baixar PNG
                        </Button>
                        <Button variant="outline" className="border-gray-700 bg-transparent text-gray-300 hover:text-white gap-2 px-6">
                            <Copy className="h-4 w-4" /> Copiar ID
                        </Button>
                        <Button className="bg-white text-black hover:bg-gray-200 gap-2 px-8">
                            <Smartphone className="h-4 w-4" /> App Mobile
                        </Button>
                    </div>

                    <div className="mt-12 grid grid-cols-1 gap-8 text-center w-full max-w-md mx-auto border-t border-gray-800 pt-8">
                        <div>
                            <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Data Geração</span>
                            <span className="text-sm">{generationDate}</span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}


