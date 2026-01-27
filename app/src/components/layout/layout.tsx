import { Sidebar } from "./sidebar";
import { Button } from "@/components/ui/button";
import { User, LogOut, Bell, ShoppingCart } from "lucide-react";

interface LayoutProps {
    children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
    return (
        <div className="flex h-screen bg-brand-darker text-white">
            <Sidebar className="w-64 hidden md:block" />
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 border-b flex items-center justify-between px-8 bg-brand-dark">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-semibold">Painel</h1>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                                <Bell className="h-5 w-5" />
                                <span className="absolute top-2 right-2 h-4 w-4 bg-brand-red rounded-full text-[10px] flex items-center justify-center text-white">71</span>
                            </Button>
                        </div>
                        <div className="relative">
                            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                                <ShoppingCart className="h-5 w-5" />
                                <span className="absolute top-2 right-2 h-4 w-4 bg-brand-red rounded-full text-[10px] flex items-center justify-center text-white">0</span>
                            </Button>
                        </div>
                        <div className="flex items-center gap-3 border-l pl-6 border-gray-800">
                            <div className="flex flex-col items-end">
                                <span className="text-sm font-medium">ADMIN</span>
                                <span className="text-[10px] text-gray-400">(Dono)</span>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center">
                                <User className="h-6 w-6 text-gray-400" />
                            </div>
                            <Button variant="outline" size="sm" className="hidden lg:flex gap-2 border-gray-700 bg-transparent text-gray-400 hover:bg-white/5 hover:text-white">
                                <LogOut className="h-4 w-4" />
                                Logout
                            </Button>
                        </div>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {children}
                </main>
            </div>
        </div>
    );
}
