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

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Sidebar({ className }: SidebarProps) {
    const menuItems = [
        { icon: LayoutDashboard, label: "Painel", active: true },
        { icon: QrCode, label: "QR Code" },
        {
            icon: History,
            label: "Cadastros",
            submenu: [
                { icon: Factory, label: "Cadastro de Sucatas" },
                { icon: Tag, label: "Cadastro de Peças" },
                { icon: Package, label: "Categorias de Peças" },
                { icon: Users, label: "Clientes" },
                { icon: MapPin, label: "Localizações" },
                { icon: Truck, label: "Transportadoras" },
                { icon: UserCheck, label: "Vendedores" },
                { icon: Factory, label: "Fornecedores" },
            ]
        },
        { icon: Package, label: "Estoque de peças" },
        { icon: Factory, label: "Sucatas" },
        { icon: Tag, label: "Etiquetas" },
        { icon: ShoppingCart, label: "Vendas" },
        { icon: Store, label: "Lojas" },
        { icon: Users, label: "Usuários" },
        { icon: BarChart3, label: "Relatórios" },
        { icon: Settings, label: "Configurações" },
    ];

    return (
        <div className={cn("pb-12 h-screen border-r bg-brand-dark overflow-y-auto", className)}>
            <div className="space-y-4 py-4">
                <div className="px-6 py-2 flex items-center gap-2">
                    <div className="flex flex-col">
                        <span className="text-2xl font-bold tracking-tight text-white">
                            <span className="text-brand-red">GS</span>{" "}
                            <span className="text-brand-yellow">PRO</span>
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">
                            Quem não controla, quebra.
                        </span>
                    </div>
                </div>
                <div className="px-3 py-2">
                    <div className="space-y-1">
                        {menuItems.map((item) => (
                            <div key={item.label}>
                                <Button
                                    variant={item.active ? "secondary" : "ghost"}
                                    className={cn(
                                        "w-full justify-start gap-3",
                                        item.active ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.label}
                                </Button>
                                {item.submenu && (
                                    <div className="ml-4 mt-1 space-y-1 border-l border-gray-800 pl-4">
                                        {item.submenu.map((sub) => (
                                            <Button
                                                key={sub.label}
                                                variant="ghost"
                                                className="w-full justify-start text-xs text-gray-500 hover:text-white hover:bg-white/5 h-8"
                                            >
                                                {sub.label}
                                            </Button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
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
