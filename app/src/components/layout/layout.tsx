import { Button } from "@/components/ui/button";
import { User, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface LayoutProps {
    children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <div className="flex flex-col h-screen bg-brand-darker text-white">
            <header className="h-16 border-b flex items-center justify-between px-8 bg-brand-dark shrink-0">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-black italic tracking-tighter uppercase text-brand-yellow">Gestor Sucata</h1>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                        <span className="text-sm font-medium uppercase">{user?.email?.split('@')[0] || "USUÁRIO"}</span>
                        <span className="text-[10px] text-gray-400">({user?.email || "Conectado"})</span>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden">
                        <User className="h-6 w-6 text-gray-400" />
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSignOut}
                        className="hidden lg:flex gap-2 border-gray-700 bg-transparent text-gray-400 hover:bg-white/5 hover:text-white"
                    >
                        <LogOut className="h-4 w-4" />
                        Logout
                    </Button>
                </div>
            </header>
            <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {children}
            </main>
        </div>
    );
}
