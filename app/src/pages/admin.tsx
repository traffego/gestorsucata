import { useState, useEffect } from "react";
import {
    Plus, Loader2, Store, Users, Shield, Trash2, UserPlus
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type Loja = { id: string; nome: string; is_matriz: boolean; created_at: string };
type UserRole = {
    id: string;
    usuario_id: string;
    loja_id: string;
    role: string;
    email?: string;
    loja_nome?: string;
};

const ROLES = [
    { value: 'gerente', label: 'Gerente', desc: 'Acesso total à loja' },
    { value: 'vendedor', label: 'Vendedor', desc: 'Apenas vendas' },
];

export default function Admin() {
    const [tab, setTab] = useState<'lojas' | 'usuarios'>('lojas');

    // Lojas
    const [lojas, setLojas] = useState<Loja[]>([]);
    const [loadingLojas, setLoadingLojas] = useState(true);
    const [isLojaModalOpen, setIsLojaModalOpen] = useState(false);
    const [lojaForm, setLojaForm] = useState({ nome: '' });
    const [savingLoja, setSavingLoja] = useState(false);

    // Usuários
    const [roles, setRoles] = useState<UserRole[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(true);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [existingUsers, setExistingUsers] = useState<any[]>([]);
    const [userForm, setUserForm] = useState({ usuario_id: '', loja_id: '', role: 'vendedor' });
    const [savingUser, setSavingUser] = useState(false);

    useEffect(() => {
        fetchLojas();
        fetchRoles();
        fetchExistingUsers();
    }, []);

    async function fetchLojas() {
        setLoadingLojas(true);
        const { data } = await supabase.from('lojas').select('*').order('created_at');
        setLojas(data || []);
        setLoadingLojas(false);
    }

    async function fetchRoles() {
        setLoadingRoles(true);
        const { data } = await supabase
            .from('usuario_loja_roles')
            .select('id, usuario_id, loja_id, role');

        if (data) {
            // Buscar emails dos usuários via auth (os emails ficam na tabela auth.users, mas podemos buscar pelo id)
            const enriched = await Promise.all(data.map(async (r) => {
                // Buscar o email na tabela usuarios (se existir) ou usar o id
                const { data: userData } = await supabase
                    .from('usuarios')
                    .select('email, nome')
                    .eq('id', r.usuario_id)
                    .single();

                const loja = lojas.find(l => l.id === r.loja_id);

                return {
                    ...r,
                    email: userData?.email || userData?.nome || r.usuario_id.slice(0, 8),
                    loja_nome: loja?.nome || 'Desconhecida'
                };
            }));
            setRoles(enriched);
        } else {
            setRoles([]);
        }
        setLoadingRoles(false);
    }

    async function fetchExistingUsers() {
        const { data } = await supabase.from('usuarios').select('id, email, nome');
        setExistingUsers(data || []);
    }

    // Refetch roles when lojas change
    useEffect(() => {
        if (lojas.length > 0) fetchRoles();
    }, [lojas]);

    const handleSaveLoja = async () => {
        if (!lojaForm.nome.trim()) { alert('Informe o nome da loja.'); return; }
        setSavingLoja(true);
        const { error } = await supabase.from('lojas').insert([{
            nome: lojaForm.nome.trim(),
            is_matriz: false
        }]);
        if (error) {
            alert(`Erro: ${error.message}`);
        } else {
            setIsLojaModalOpen(false);
            setLojaForm({ nome: '' });
            await fetchLojas();
        }
        setSavingLoja(false);
    };

    const handleDeleteLoja = async (id: string, isMatriz: boolean) => {
        if (isMatriz) { alert('Não é possível excluir a loja matriz.'); return; }
        if (!confirm('Excluir esta loja? Todos os vínculos de usuários serão removidos.')) return;
        const { error } = await supabase.from('lojas').delete().eq('id', id);
        if (error) alert(`Erro: ${error.message}`);
        else await fetchLojas();
    };

    const handleSaveUser = async () => {
        if (!userForm.usuario_id || !userForm.loja_id) {
            alert('Selecione um usuário e uma loja.');
            return;
        }
        setSavingUser(true);
        try {
            const { error: roleError } = await supabase
                .from('usuario_loja_roles')
                .insert([{
                    usuario_id: userForm.usuario_id,
                    loja_id: userForm.loja_id,
                    role: userForm.role
                }]);

            if (roleError) throw roleError;

            setIsUserModalOpen(false);
            setUserForm({ usuario_id: '', loja_id: '', role: 'vendedor' });
            await fetchRoles();
            alert('Permissão atribuída com sucesso!');
        } catch (err: any) {
            if (err.message?.includes('unique') || err.message?.includes('duplicate')) {
                alert('Este usuário já tem um vínculo com esta loja.');
            } else {
                alert(`Erro: ${err.message}`);
            }
        }
        setSavingUser(false);
    };

    const handleDeleteRole = async (id: string) => {
        if (!confirm('Remover este vínculo?')) return;
        const { error } = await supabase.from('usuario_loja_roles').delete().eq('id', id);
        if (error) alert(`Erro: ${error.message}`);
        else await fetchRoles();
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">
                    <Shield className="inline h-7 w-7 text-brand-yellow mr-2" />
                    Painel Admin
                </h2>
                <p className="text-gray-500 text-sm mt-1">Gerencie lojas e permissões de usuários.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                {[
                    { key: 'lojas' as const, label: 'Lojas', icon: Store },
                    { key: 'usuarios' as const, label: 'Usuários', icon: Users },
                ].map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={cn(
                            "flex items-center gap-2 px-5 py-2.5 rounded-xl border transition-all text-sm font-bold",
                            tab === t.key
                                ? "bg-brand-yellow text-brand-dark border-brand-yellow"
                                : "bg-brand-dark border-gray-800 text-gray-500 hover:text-white"
                        )}
                    >
                        <t.icon className="h-4 w-4" /> {t.label}
                    </button>
                ))}
            </div>

            {/* ===== TAB LOJAS ===== */}
            {tab === 'lojas' && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <Button
                            onClick={() => setIsLojaModalOpen(true)}
                            className="bg-brand-yellow text-brand-dark font-black hover:bg-brand-yellow/90 uppercase tracking-widest"
                        >
                            <Plus className="h-4 w-4 mr-2 stroke-[3px]" /> Nova Filial
                        </Button>
                    </div>

                    {loadingLojas ? (
                        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-brand-yellow" /></div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {lojas.map(loja => (
                                <Card key={loja.id} className={cn(
                                    "bg-brand-dark border text-white transition-all",
                                    loja.is_matriz ? "border-brand-yellow/40" : "border-gray-800"
                                )}>
                                    <CardContent className="p-5 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "h-12 w-12 rounded-xl flex items-center justify-center",
                                                loja.is_matriz ? "bg-brand-yellow/10" : "bg-gray-800"
                                            )}>
                                                <Store className={cn("h-6 w-6", loja.is_matriz ? "text-brand-yellow" : "text-gray-400")} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white">{loja.nome}</h3>
                                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                                                    {loja.is_matriz ? '⭐ MATRIZ' : 'FILIAL'}
                                                </p>
                                            </div>
                                        </div>
                                        {!loja.is_matriz && (
                                            <Button
                                                variant="ghost" size="icon"
                                                className="text-gray-500 hover:text-red-500"
                                                onClick={() => handleDeleteLoja(loja.id, loja.is_matriz)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ===== TAB USUARIOS ===== */}
            {tab === 'usuarios' && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <Button
                            onClick={() => setIsUserModalOpen(true)}
                            className="bg-brand-yellow text-brand-dark font-black hover:bg-brand-yellow/90 uppercase tracking-widest"
                        >
                            <UserPlus className="h-4 w-4 mr-2 stroke-[3px]" /> Atribuir Permissão
                        </Button>
                    </div>

                    {loadingRoles ? (
                        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-brand-yellow" /></div>
                    ) : roles.length === 0 ? (
                        <p className="text-center text-gray-500 py-16 italic border border-dashed border-gray-800 rounded-xl">
                            Nenhum vínculo de usuário encontrado.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {roles.map(r => (
                                <Card key={r.id} className="bg-brand-dark border-gray-800 text-white">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center">
                                                <Users className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-white text-sm">{r.email}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={cn(
                                                        "text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-widest",
                                                        r.role === 'superadmin' ? "bg-brand-yellow/10 text-brand-yellow" :
                                                            r.role === 'gerente' ? "bg-green-500/10 text-green-400" :
                                                                "bg-blue-500/10 text-blue-400"
                                                    )}>
                                                        {r.role}
                                                    </span>
                                                    <span className="text-[10px] text-gray-500">em {r.loja_nome}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {r.role !== 'superadmin' && (
                                            <Button
                                                variant="ghost" size="icon"
                                                className="text-gray-500 hover:text-red-500"
                                                onClick={() => handleDeleteRole(r.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Modal Nova Loja */}
            <Modal
                isOpen={isLojaModalOpen}
                onClose={() => setIsLojaModalOpen(false)}
                title="Nova Filial"
                description="Crie uma nova loja filial."
                footer={
                    <>
                        <Button variant="outline" onClick={() => setIsLojaModalOpen(false)} className="border-gray-800">Cancelar</Button>
                        <Button onClick={handleSaveLoja} disabled={savingLoja} className="bg-brand-red text-white hover:bg-brand-red/90 font-bold uppercase tracking-widest">
                            {savingLoja ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Criar Loja
                        </Button>
                    </>
                }
            >
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Nome da Loja / Filial</label>
                    <Input
                        value={lojaForm.nome}
                        onChange={e => setLojaForm({ nome: e.target.value })}
                        placeholder="Ex: Filial Centro, Unidade Norte..."
                        className="bg-brand-darker border-gray-800 h-12 focus:border-brand-yellow/50"
                    />
                </div>
            </Modal>

            {/* Modal Atribuir Permissão */}
            <Modal
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)}
                title="Atribuir Permissão"
                description="Selecione um usuário já registrado e atribua uma loja e permissão."
                footer={
                    <>
                        <Button variant="outline" onClick={() => setIsUserModalOpen(false)} className="border-gray-800">Cancelar</Button>
                        <Button onClick={handleSaveUser} disabled={savingUser} className="bg-brand-red text-white hover:bg-brand-red/90 font-bold uppercase tracking-widest">
                            {savingUser ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Atribuir
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Usuário</label>
                        {existingUsers.length === 0 ? (
                            <p className="text-sm text-gray-500 italic py-2">Nenhum usuário registrado. O usuário precisa criar uma conta na tela de login primeiro.</p>
                        ) : (
                            <select
                                value={userForm.usuario_id}
                                onChange={e => setUserForm({ ...userForm, usuario_id: e.target.value })}
                                className="w-full bg-brand-darker border border-gray-800 rounded-lg h-12 px-4 text-sm text-gray-300 outline-none appearance-none"
                            >
                                <option value="">Selecione um usuário...</option>
                                {existingUsers.map(u => (
                                    <option key={u.id} value={u.id}>
                                        {u.nome || u.email || u.id.slice(0, 8)}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Loja</label>
                        <select
                            value={userForm.loja_id}
                            onChange={e => setUserForm({ ...userForm, loja_id: e.target.value })}
                            className="w-full bg-brand-darker border border-gray-800 rounded-lg h-12 px-4 text-sm text-gray-300 outline-none appearance-none"
                        >
                            <option value="">Selecione uma loja...</option>
                            {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Permissão</label>
                        <div className="grid grid-cols-2 gap-2">
                            {ROLES.map(r => (
                                <button
                                    key={r.value}
                                    onClick={() => setUserForm({ ...userForm, role: r.value })}
                                    className={cn(
                                        "p-3 rounded-xl border text-left transition-all",
                                        userForm.role === r.value
                                            ? "bg-brand-yellow/10 border-brand-yellow text-brand-yellow"
                                            : "bg-brand-darker border-gray-800 text-gray-400 hover:border-gray-600"
                                    )}
                                >
                                    <p className="font-bold text-sm">{r.label}</p>
                                    <p className="text-[10px] mt-0.5 opacity-60">{r.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
