import { useState, useEffect } from "react";
import {
    Plus, Loader2, Users, Trash2, UserPlus, X, Mail, Lock
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type Loja = { id: string; nome: string; is_matriz: boolean };
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

export default function Usuarios() {
    const [lojas, setLojas] = useState<Loja[]>([]);
    const [roles, setRoles] = useState<UserRole[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(true);
    const [existingUsers, setExistingUsers] = useState<any[]>([]);

    // Atribuir Permissão
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [userForm, setUserForm] = useState({ usuario_id: '', loja_id: '', role: 'vendedor' });
    const [savingUser, setSavingUser] = useState(false);

    // Novo Usuário
    const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
    const [newUserForm, setNewUserForm] = useState({ email: '', password: '', loja_id: '', role: 'vendedor' });
    const [savingNewUser, setSavingNewUser] = useState(false);
    const [newUserError, setNewUserError] = useState<string | null>(null);

    useEffect(() => {
        fetchLojas();
        fetchExistingUsers();
    }, []);

    async function fetchLojas() {
        const { data } = await supabase.from('lojas').select('id, nome, is_matriz').order('created_at');
        setLojas(data || []);
    }

    async function fetchRoles(lojasData?: Loja[]) {
        setLoadingRoles(true);
        const lojasToUse = lojasData || lojas;
        const { data } = await supabase
            .from('usuario_loja_roles')
            .select('id, usuario_id, loja_id, role');

        if (data) {
            const enriched = await Promise.all(data.map(async (r) => {
                const { data: userData } = await supabase
                    .from('usuarios')
                    .select('email, nome')
                    .eq('id', r.usuario_id)
                    .single();

                const loja = lojasToUse.find(l => l.id === r.loja_id);
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

    // Fetch roles once lojas are loaded
    useEffect(() => {
        if (lojas.length > 0) fetchRoles(lojas);
    }, [lojas]);

    const handleSaveUser = async () => {
        if (!userForm.usuario_id || !userForm.loja_id) {
            alert('Selecione um usuário e uma loja.'); return;
        }
        setSavingUser(true);
        try {
            const { error: roleError } = await supabase
                .from('usuario_loja_roles')
                .insert([{ usuario_id: userForm.usuario_id, loja_id: userForm.loja_id, role: userForm.role }]);
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

    const handleCreateNewUser = async () => {
        setNewUserError(null);
        if (!newUserForm.email.trim() || !newUserForm.password.trim()) {
            setNewUserError('Preencha email e senha.'); return;
        }
        if (newUserForm.password.length < 6) {
            setNewUserError('A senha deve ter no mínimo 6 caracteres.'); return;
        }
        if (!newUserForm.loja_id) {
            setNewUserError('Selecione uma loja.'); return;
        }

        setSavingNewUser(true);
        try {
            const { data: currentSession } = await supabase.auth.getSession();
            const adminSession = currentSession.session;
            if (!adminSession) {
                setNewUserError('Sessão do admin não encontrada.'); setSavingNewUser(false); return;
            }

            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: newUserForm.email.trim(),
                password: newUserForm.password.trim(),
            });

            if (signUpError) {
                setNewUserError(signUpError.message?.includes('already') ? 'Este email já está registrado.' : signUpError.message);
                setSavingNewUser(false); return;
            }

            const newUserId = signUpData.user?.id;
            await supabase.auth.setSession({
                access_token: adminSession.access_token,
                refresh_token: adminSession.refresh_token,
            });

            if (!newUserId) {
                setNewUserError('Erro ao criar usuário: ID não retornado.'); setSavingNewUser(false); return;
            }

            await supabase.from('usuarios').upsert([{ id: newUserId, email: newUserForm.email.trim() }]);

            const { error: roleError } = await supabase
                .from('usuario_loja_roles')
                .insert([{ usuario_id: newUserId, loja_id: newUserForm.loja_id, role: newUserForm.role }]);

            if (roleError) {
                alert('Usuário criado, mas erro ao atribuir permissão. Atribua manualmente.');
            }

            setIsNewUserModalOpen(false);
            setNewUserForm({ email: '', password: '', loja_id: '', role: 'vendedor' });
            setNewUserError(null);
            await fetchRoles();
            await fetchExistingUsers();
            alert('Usuário criado com sucesso!');
        } catch (err: any) {
            setNewUserError(err.message || 'Erro inesperado.');
        }
        setSavingNewUser(false);
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">
                    <Users className="inline h-7 w-7 text-brand-yellow mr-2" />
                    Usuários
                </h2>
                <p className="text-gray-500 text-sm mt-1">Gerencie usuários e permissões.</p>
            </div>

            <div className="space-y-4">
                <div className="flex justify-end gap-2">
                    <Button
                        onClick={() => { setNewUserError(null); setIsNewUserModalOpen(true); }}
                        className="bg-brand-red text-white font-black hover:bg-brand-red/90 uppercase tracking-widest"
                    >
                        <Plus className="h-4 w-4 mr-2 stroke-[3px]" /> Novo Usuário
                    </Button>
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
                                        <Button variant="ghost" size="icon" className="text-gray-500 hover:text-red-500"
                                            onClick={() => handleDeleteRole(r.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* MODAL: Atribuir Permissão */}
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
                            <p className="text-sm text-gray-500 italic py-2">Nenhum usuário registrado. Crie um novo usuário primeiro.</p>
                        ) : (
                            <select value={userForm.usuario_id} onChange={e => setUserForm({ ...userForm, usuario_id: e.target.value })}
                                className="w-full bg-brand-darker border border-gray-800 rounded-lg h-12 px-4 text-sm text-gray-300 outline-none appearance-none">
                                <option value="">Selecione um usuário...</option>
                                {existingUsers.map(u => (
                                    <option key={u.id} value={u.id}>{u.nome || u.email || u.id.slice(0, 8)}</option>
                                ))}
                            </select>
                        )}
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Loja</label>
                        <select value={userForm.loja_id} onChange={e => setUserForm({ ...userForm, loja_id: e.target.value })}
                            className="w-full bg-brand-darker border border-gray-800 rounded-lg h-12 px-4 text-sm text-gray-300 outline-none appearance-none">
                            <option value="">Selecione uma loja...</option>
                            {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Permissão</label>
                        <div className="grid grid-cols-2 gap-2">
                            {ROLES.map(r => (
                                <button key={r.value} onClick={() => setUserForm({ ...userForm, role: r.value })}
                                    className={cn("p-3 rounded-xl border text-left transition-all",
                                        userForm.role === r.value
                                            ? "bg-brand-yellow/10 border-brand-yellow text-brand-yellow"
                                            : "bg-brand-darker border-gray-800 text-gray-400 hover:border-gray-600"
                                    )}>
                                    <p className="font-bold text-sm">{r.label}</p>
                                    <p className="text-[10px] mt-0.5 opacity-60">{r.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </Modal>

            {/* MODAL: Novo Usuário */}
            <Modal
                isOpen={isNewUserModalOpen}
                onClose={() => { setIsNewUserModalOpen(false); setNewUserError(null); }}
                title="Novo Usuário"
                description="Crie um novo usuário com email e senha, e atribua a uma loja."
                footer={
                    <>
                        <Button variant="outline" onClick={() => { setIsNewUserModalOpen(false); setNewUserError(null); }} className="border-gray-800">Cancelar</Button>
                        <Button onClick={handleCreateNewUser} disabled={savingNewUser} className="bg-brand-red text-white hover:bg-brand-red/90 font-bold uppercase tracking-widest">
                            {savingNewUser ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />} Criar Usuário
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    {newUserError && (
                        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">
                            <X className="h-4 w-4 shrink-0" /><p>{newUserError}</p>
                        </div>
                    )}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Email</label>
                        <div className="relative group">
                            <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-500 group-focus-within:text-brand-yellow" />
                            <Input type="email" value={newUserForm.email} onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })}
                                placeholder="usuario@email.com" className="bg-brand-darker border-gray-800 h-12 pl-10 focus:border-brand-yellow/50" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Senha</label>
                        <div className="relative group">
                            <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-500 group-focus-within:text-brand-yellow" />
                            <Input type="password" value={newUserForm.password} onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })}
                                placeholder="Mínimo 6 caracteres" className="bg-brand-darker border-gray-800 h-12 pl-10 focus:border-brand-yellow/50" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Loja</label>
                        <select value={newUserForm.loja_id} onChange={e => setNewUserForm({ ...newUserForm, loja_id: e.target.value })}
                            className="w-full bg-brand-darker border border-gray-800 rounded-lg h-12 px-4 text-sm text-gray-300 outline-none appearance-none">
                            <option value="">Selecione uma loja...</option>
                            {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Permissão</label>
                        <div className="grid grid-cols-2 gap-2">
                            {ROLES.map(r => (
                                <button key={r.value} onClick={() => setNewUserForm({ ...newUserForm, role: r.value })}
                                    className={cn("p-3 rounded-xl border text-left transition-all",
                                        newUserForm.role === r.value
                                            ? "bg-brand-yellow/10 border-brand-yellow text-brand-yellow"
                                            : "bg-brand-darker border-gray-800 text-gray-400 hover:border-gray-600"
                                    )}>
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
