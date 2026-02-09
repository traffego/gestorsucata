import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Store,
    Users,
    BarChart3,
    Settings,
    LogOut,
    QrCode,
    Tag,
    Truck,
    UserCheck,
    Factory,
    MapPin,
    History
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Sidebar({ className }: SidebarProps) {
    const location = useLocation();

    const menuItems = [
        { icon: LayoutDashboard, label: "Painel", to: "/" },
        { icon: QrCode, label: "QR Code", to: "/qrcode" },
        { icon: ShoppingCart, label: "Nova Venda", to: "/nova-venda" },
        { icon: History, label: "Minhas Vendas", to: "/vendas" },
        {
            icon: History,
            label: "Cadastros",
            to: "/cadastros", // Rota principal ou wrapper
            submenu: [
                { icon: Factory, label: "Cadastro de Sucatas", to: "/cadastros/sucatas" },
                { icon: Tag, label: "Cadastro de Peças", to: "/cadastros/pecas" },
                { icon: Package, label: "Categorias de Peças", to: "/cadastros/categorias" },
                { icon: Users, label: "Clientes", to: "/cadastros/clientes" },
                { icon: MapPin, label: "Localizações", to: "/cadastros/localizacoes" },
                { icon: Truck, label: "Transportadoras", to: "/cadastros/transportadoras" },
                { icon: UserCheck, label: "Vendedores", to: "/cadastros/vendedores" },
                { icon: Factory, label: "Fornecedores", to: "/cadastros/fornecedores" },
            ]
        },
        { icon: Package, label: "Estoque de peças", to: "/estoque" },
        { icon: Factory, label: "Sucatas", to: "/sucatas" }, // Ajustar rota se necessário
        { icon: Tag, label: "Etiquetas", to: "/etiquetas" }, // Ajustar rota se necessário
        { icon: Store, label: "Lojas", to: "/lojas" }, // Ajustar rota se necessário
        { icon: Users, label: "Usuários", to: "/usuarios" }, // Ajustar rota se necessário
        { icon: BarChart3, label: "Relatórios", to: "/relatorios" }, // Ajustar rota se necessário
        { icon: Settings, label: "Configurações", to: "/configuracoes" }, // Ajustar rota se necessário
        { icon: ShoppingCart, label: "Financeiro", to: "/financeiro" },
    ];

    return (
        <div className={cn("pb-12 h-screen border-r bg-brand-dark overflow-y-auto", className)}>
            <div className="space-y-4 py-4">
                <div className="px-6 py-2 flex items-center gap-2">
                    <div className="flex flex-col items-center">
                        <img
                            src="/gs-logo.png"
                            alt="GS PRO"
                            className="h-32 w-auto mb-2 drop-shadow-2xl hover:scale-105 transition-transform duration-300"
                        />
                        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-widest text-center">
                            Quem não controla, quebra.
                        </span>
                    </div>
                </div>
                <div className="px-3 py-2">
                    <div className="space-y-1">
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');

                            return (
                                <div key={item.label}>
                                    <Link to={item.to}>
                                        <Button
                                            variant={isActive ? "secondary" : "ghost"}
                                            className={cn(
                                                "w-full justify-start gap-3",
                                                isActive ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
                                            )}
                                        >
                                            <item.icon className="h-4 w-4" />
                                            {item.label}
                                        </Button>
                                    </Link>
                                    {item.submenu && (
                                        <div className="ml-4 mt-1 space-y-1 border-l border-gray-800 pl-4">
                                            {item.submenu.map((sub) => (
                                                <Button
                                                    key={sub.label}
                                                    variant="ghost"
                                                    className="w-full justify-start text-xs text-gray-500 hover:text-white hover:bg-white/5 h-8"
                                                    disabled // Desativado até implementar rotas de submenu
                                                >
                                                    {sub.label}
                                                </Button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
            <div className="absolute bottom-4 w-full px-3">
                <Button variant="ghost" className="w-full justify-start gap-3 text-gray-400 hover:text-white hover:bg-white/5">
                    <LogOut className="h-4 w-4" />
                    Sair
                </Button>
            </div>
        </div>
    );
}
