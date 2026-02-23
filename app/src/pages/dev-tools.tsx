import { useState } from "react";
import { Trash2, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

interface Action {
    label: string;
    description: string;
    tables: string[];
    color: string;
}

const ACTIONS: Action[] = [
    {
        label: "Apagar Todas as Vendas",
        description: "Remove todos os registros de vendas e itens de venda.",
        tables: ["itens_venda", "vendas"],
        color: "red",
    },
    {
        label: "Apagar Todos os Clientes",
        description: "Remove todos os clientes cadastrados.",
        tables: ["clientes"],
        color: "orange",
    },
    {
        label: "Apagar Todo o Estoque",
        description: "Zera o estoque atual de todos os produtos.",
        tables: [],
        color: "yellow",
    },
    {
        label: "Apagar Todos os Produtos",
        description: "Remove todos os produtos cadastrados (inclui itens de venda).",
        tables: ["itens_venda", "produtos"],
        color: "pink",
    },
];

const colorMap: Record<string, string> = {
    red: "border-red-500/30 hover:border-red-500 hover:bg-red-500/10 text-red-400",
    orange: "border-orange-500/30 hover:border-orange-500 hover:bg-orange-500/10 text-orange-400",
    yellow: "border-yellow-500/30 hover:border-yellow-500 hover:bg-yellow-500/10 text-yellow-400",
    pink: "border-pink-500/30 hover:border-pink-500 hover:bg-pink-500/10 text-pink-400",
};

export default function DevTools() {
    const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
    const [results, setResults] = useState<Record<number, string>>({});

    const handleAction = async (action: Action, index: number) => {
        const confirmed = window.confirm(
            `⚠️ ATENÇÃO!\n\nVocê vai ${action.label.toLowerCase()}.\nIsso não pode ser desfeito.\n\nConfirmar?`
        );
        if (!confirmed) return;

        setLoadingIndex(index);
        setResults(prev => ({ ...prev, [index]: "" }));

        try {
            if (index === 2) {
                // Caso especial: zerar estoque (só atualiza, não deleta)
                const { error } = await supabase
                    .from("produtos")
                    .update({ estoque_atual: 0 })
                    .neq("id", "00000000-0000-0000-0000-000000000000"); // força update em todos
                if (error) throw error;
            } else {
                for (const table of action.tables) {
                    const { error } = await supabase
                        .from(table)
                        .delete()
                        .neq("id", "00000000-0000-0000-0000-000000000000"); // deleta todos
                    if (error) throw error;
                }
            }
            setResults(prev => ({ ...prev, [index]: "✅ Concluído com sucesso!" }));
        } catch (err: any) {
            setResults(prev => ({ ...prev, [index]: `❌ Erro: ${err.message}` }));
        } finally {
            setLoadingIndex(null);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 border border-yellow-500/30 bg-yellow-500/5 rounded-xl px-5 py-4">
                <ShieldAlert className="h-6 w-6 text-yellow-400 shrink-0" />
                <div>
                    <p className="text-yellow-400 font-black text-sm uppercase tracking-widest">Modo Desenvolvedor</p>
                    <p className="text-yellow-400/60 text-xs mt-0.5">Ações destrutivas para uso exclusivo durante o desenvolvimento. Não use em produção.</p>
                </div>
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-1 gap-4">
                {ACTIONS.map((action, i) => (
                    <div
                        key={i}
                        className={`flex items-center justify-between bg-brand-dark border rounded-xl px-5 py-4 transition-all ${colorMap[action.color]}`}
                    >
                        <div>
                            <p className="font-bold text-sm text-white">{action.label}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{action.description}</p>
                            {results[i] && (
                                <p className="text-xs mt-1 font-mono font-bold">{results[i]}</p>
                            )}
                        </div>
                        <Button
                            variant="outline"
                            className={`ml-4 shrink-0 border-current bg-transparent hover:bg-current/10 font-bold uppercase text-xs tracking-widest gap-2 ${colorMap[action.color]}`}
                            onClick={() => handleAction(action, i)}
                            disabled={loadingIndex !== null}
                        >
                            {loadingIndex === i ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="h-4 w-4" />
                            )}
                            Apagar
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}
