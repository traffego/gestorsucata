import { useState, useEffect } from "react";
import {
    Plus, Loader2, Store, Users, Shield, Trash2, UserPlus, Pencil, Save, X, Mail, Lock, ChevronRight, Calendar, User, Phone, FileText
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
    nome?: string;
    loja_nome?: string;
};

type UsuarioPerfil = {
    id: string;
    email: string;
    nome: string;
    telefone: string;
    cpf: string;
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

    // Loja Detail
    const [selectedLoja, setSelectedLoja] = useState<Loja | null>(null);
    const [isLojaDetailOpen, setIsLojaDetailOpen] = useState(false);
    const [lojaDetailUsers, setLojaDetailUsers] = useState<UserRole[]>([]);
    const [loadingLojaDetail, setLoadingLojaDetail] = useState(false);
    const [editingLojaName, setEditingLojaName] = useState(false);
    const [editLojaNameValue, setEditLojaNameValue] = useState('');
    const [savingLojaName, setSavingLojaName] = useState(false);

    // Usuários
    const [roles, setRoles] = useState<UserRole[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(true);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [existingUsers, setExistingUsers] = useState<any[]>([]);
    const [userForm, setUserForm] = useState({ usuario_id: '', loja_id: '', role: 'vendedor' });
    const [savingUser, setSavingUser] = useState(false);

    // Novo Usuário (criação com email/senha)
    const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
    const [newUserForm, setNewUserForm] = useState({ email: '', password: '', nome: '', loja_id: '', role: 'vendedor' });
    const [savingNewUser, setSavingNewUser] = useState(false);
    const [newUserError, setNewUserError] = useState<string | null>(null);

    // Editar Usuário
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState<UsuarioPerfil>({ id: '', email: '', nome: '', telefone: '', cpf: '' });
    const [savingEdit, setSavingEdit] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);

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
            const enriched = await Promise.all(data.map(async (r) => {
                const { data: userData } = await supabase
                    .from('usuarios')
                    .select('email, nome')
                    .eq('id', r.usuario_id)
                    .single();

                const loja = lojas.find(l => l.id === r.loja_id);

                return {
                    ...r,
                    email: userData?.email || r.usuario_id.slice(0, 8),
                    nome: userData?.nome || '',
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

    // ======= LOJA HANDLERS =======

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

    const handleOpenLojaDetail = async (loja: Loja) => {
        setSelectedLoja(loja);
        setIsLojaDetailOpen(true);
        setEditingLojaName(false);
        setEditLojaNameValue(loja.nome);
        setLoadingLojaDetail(true);

        // Fetch users linked to this store
        const { data } = await supabase
            .from('usuario_loja_roles')
            .select('id, usuario_id, loja_id, role')
            .eq('loja_id', loja.id);

        if (data) {
            const enriched = await Promise.all(data.map(async (r) => {
                const { data: userData } = await supabase
                    .from('usuarios')
                    .select('email, nome')
                    .eq('id', r.usuario_id)
                    .single();
                return {
                    ...r,
                    email: userData?.email || userData?.nome || r.usuario_id.slice(0, 8),
                    loja_nome: loja.nome
                };
            }));
            setLojaDetailUsers(enriched);
        } else {
            setLojaDetailUsers([]);
        }
        setLoadingLojaDetail(false);
    };

    const handleSaveLojaName = async () => {
        if (!selectedLoja || !editLojaNameValue.trim()) return;
        setSavingLojaName(true);
        const { error } = await supabase
            .from('lojas')
            .update({ nome: editLojaNameValue.trim() })
            .eq('id', selectedLoja.id);
        if (error) {
            alert(`Erro: ${error.message}`);
        } else {
            setEditingLojaName(false);
            setSelectedLoja({ ...selectedLoja, nome: editLojaNameValue.trim() });
            await fetchLojas();
        }
        setSavingLojaName(false);
    };

    // ======= USER ROLE HANDLERS =======

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
        else {
            await fetchRoles();
            // Also refresh loja detail if open
            if (selectedLoja && isLojaDetailOpen) {
                handleOpenLojaDetail(selectedLoja);
            }
        }
    };

    // ======= NEW USER CREATION =======

    const handleCreateNewUser = async () => {
        setNewUserError(null);

        if (!newUserForm.email.trim() || !newUserForm.password.trim()) {
            setNewUserError('Preencha email e senha.');
            return;
        }
        if (newUserForm.password.length < 6) {
            setNewUserError('A senha deve ter no mínimo 6 caracteres.');
            return;
        }
        if (!newUserForm.loja_id) {
            setNewUserError('Selecione uma loja.');
            return;
        }

        setSavingNewUser(true);

        try {
            // 1. Save current admin session
            const { data: currentSession } = await supabase.auth.getSession();
            const adminSession = currentSession.session;

            if (!adminSession) {
                setNewUserError('Sessão do admin não encontrada. Faça login novamente.');
                setSavingNewUser(false);
                return;
            }

            // 2. Create the new user via signUp
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: newUserForm.email.trim(),
                password: newUserForm.password.trim(),
            });

            if (signUpError) {
                if (signUpError.message?.includes('already registered') || signUpError.message?.includes('already been registered')) {
                    setNewUserError('Este email já está registrado.');
                } else {
                    setNewUserError(signUpError.message);
                }
                setSavingNewUser(false);
                return;
            }

            const newUserId = signUpData.user?.id;

            // 3. Restore admin session immediately
            await supabase.auth.setSession({
                access_token: adminSession.access_token,
                refresh_token: adminSession.refresh_token,
            });

            if (!newUserId) {
                setNewUserError('Erro ao criar usuário: ID não retornado.');
                setSavingNewUser(false);
                return;
            }

            // 4. Insert into usuarios table
            await supabase.from('usuarios').upsert([{
                id: newUserId,
                email: newUserForm.email.trim(),
                nome: newUserForm.nome.trim() || null,
            }]);

            // 5. Assign role
            const { error: roleError } = await supabase
                .from('usuario_loja_roles')
                .insert([{
                    usuario_id: newUserId,
                    loja_id: newUserForm.loja_id,
                    role: newUserForm.role
                }]);

            if (roleError) {
                console.error('Role assignment error:', roleError);
                // User was created but role wasn't assigned — we still report success with a note
                alert('Usuário criado, mas houve um erro ao atribuir a permissão. Atribua manualmente.');
            }

            // 6. Cleanup
            setIsNewUserModalOpen(false);
            setNewUserForm({ email: '', password: '', nome: '', loja_id: '', role: 'vendedor' });
            setNewUserError(null);
            await fetchRoles();
            await fetchExistingUsers();
            alert('Usuário criado com sucesso!');

        } catch (err: any) {
            setNewUserError(err.message || 'Erro inesperado.');
        }

        setSavingNewUser(false);
    };

    // ======= EDITAR USUÁRIO =======

    const handleOpenEdit = async (usuarioId: string) => {
        setEditError(null);
        const { data } = await supabase
            .from('usuarios')
            .select('id, email, nome, telefone, cpf')
            .eq('id', usuarioId)
            .single();

        if (data) {
            setEditForm({
                id: data.id,
                email: data.email || '',
                nome: data.nome || '',
                telefone: data.telefone || '',
                cpf: data.cpf || '',
            });
        } else {
            setEditForm({ id: usuarioId, email: '', nome: '', telefone: '', cpf: '' });
        }
        setIsEditModalOpen(true);
    };

    const handleUpdateUser = async () => {
        setEditError(null);
        setSavingEdit(true);
        try {
            const { error } = await supabase
                .from('usuarios')
                .upsert([{
                    id: editForm.id,
                    email: editForm.email || null,
                    nome: editForm.nome.trim() || null,
                    telefone: editForm.telefone.trim() || null,
                    cpf: editForm.cpf.trim() || null,
                    updated_at: new Date().toISOString(),
                }]);

            if (error) throw error;

            setIsEditModalOpen(false);
            await fetchRoles();
            await fetchExistingUsers();
            alert('Perfil atualizado com sucesso!');
        } catch (err: any) {
            setEditError(err.message || 'Erro ao salvar.');
        }
        setSavingEdit(false);
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
                                <Card
                                    key={loja.id}
                                    className={cn(
                                        "bg-brand-dark border text-white transition-all cursor-pointer hover:border-brand-yellow/60 hover:shadow-lg hover:shadow-brand-yellow/5 group",
                                        loja.is_matriz ? "border-brand-yellow/40" : "border-gray-800"
                                    )}
                                    onClick={() => handleOpenLojaDetail(loja)}
                                >
                                    <CardContent className="p-5 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "h-12 w-12 rounded-xl flex items-center justify-center transition-all",
                                                loja.is_matriz ? "bg-brand-yellow/10" : "bg-gray-800 group-hover:bg-brand-yellow/10"
                                            )}>
                                                <Store className={cn("h-6 w-6 transition-colors", loja.is_matriz ? "text-brand-yellow" : "text-gray-400 group-hover:text-brand-yellow")} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white">{loja.nome}</h3>
                                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                                                    {loja.is_matriz ? '⭐ MATRIZ' : 'FILIAL'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {!loja.is_matriz && (
                                                <Button
                                                    variant="ghost" size="icon"
                                                    className="text-gray-500 hover:text-red-500"
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteLoja(loja.id, loja.is_matriz); }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <ChevronRight className="h-5 w-5 text-gray-600 group-hover:text-brand-yellow transition-colors" />
                                        </div>
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
                                                {r.nome && (
                                                    <p className="font-bold text-white text-sm">{r.nome}</p>
                                                )}
                                                <p className={cn(
                                                    "text-sm",
                                                    r.nome ? "text-gray-400" : "font-bold text-white"
                                                )}>{r.email}</p>
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
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost" size="icon"
                                                className="text-gray-500 hover:text-brand-yellow"
                                                onClick={() => handleOpenEdit(r.usuario_id)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            {r.role !== 'superadmin' && (
                                                <Button
                                                    variant="ghost" size="icon"
                                                    className="text-gray-500 hover:text-red-500"
                                                    onClick={() => handleDeleteRole(r.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ===== MODAL: Nova Loja ===== */}
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

            {/* ===== MODAL: Detalhes da Loja ===== */}
            <Modal
                isOpen={isLojaDetailOpen}
                onClose={() => setIsLojaDetailOpen(false)}
                title={selectedLoja?.nome || 'Detalhes'}
                description={selectedLoja?.is_matriz ? '⭐ Loja Matriz' : 'Filial'}
                footer={
                    <Button variant="outline" onClick={() => setIsLojaDetailOpen(false)} className="border-gray-800">
                        Fechar
                    </Button>
                }
            >
                {selectedLoja && (
                    <div className="space-y-6">
                        {/* Nome editável */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Nome da Loja</label>
                            {editingLojaName ? (
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={editLojaNameValue}
                                        onChange={e => setEditLojaNameValue(e.target.value)}
                                        className="bg-brand-darker border-gray-800 h-10 focus:border-brand-yellow/50 flex-1"
                                        autoFocus
                                    />
                                    <Button
                                        size="icon"
                                        onClick={handleSaveLojaName}
                                        disabled={savingLojaName}
                                        className="bg-green-600 hover:bg-green-700 h-10 w-10"
                                    >
                                        {savingLojaName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => { setEditingLojaName(false); setEditLojaNameValue(selectedLoja.nome); }}
                                        className="text-gray-400 hover:text-white h-10 w-10"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between bg-brand-darker border border-gray-800 rounded-xl px-4 py-3">
                                    <span className="text-white font-bold">{selectedLoja.nome}</span>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => setEditingLojaName(true)}
                                        className="text-gray-400 hover:text-brand-yellow h-8 w-8"
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-brand-darker border border-gray-800 rounded-xl p-3">
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Tipo</p>
                                <p className="text-sm text-white font-bold">{selectedLoja.is_matriz ? '⭐ Matriz' : '🏪 Filial'}</p>
                            </div>
                            <div className="bg-brand-darker border border-gray-800 rounded-xl p-3">
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Criada em</p>
                                <p className="text-sm text-white font-bold flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                    {new Date(selectedLoja.created_at).toLocaleDateString('pt-BR')}
                                </p>
                            </div>
                        </div>

                        {/* Users linked to this store */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                    Usuários vinculados ({lojaDetailUsers.length})
                                </label>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-brand-yellow hover:text-brand-yellow/80 text-[10px] uppercase tracking-widest font-bold h-7"
                                    onClick={() => {
                                        setIsLojaDetailOpen(false);
                                        setNewUserForm({ ...newUserForm, loja_id: selectedLoja.id });
                                        setNewUserError(null);
                                        setIsNewUserModalOpen(true);
                                    }}
                                >
                                    <Plus className="h-3 w-3 mr-1" /> Adicionar
                                </Button>
                            </div>
                            {loadingLojaDetail ? (
                                <div className="flex justify-center py-6">
                                    <Loader2 className="h-5 w-5 animate-spin text-brand-yellow" />
                                </div>
                            ) : lojaDetailUsers.length === 0 ? (
                                <p className="text-center text-gray-600 py-6 text-sm italic border border-dashed border-gray-800 rounded-xl">
                                    Nenhum usuário vinculado a esta loja.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {lojaDetailUsers.map(u => (
                                        <div key={u.id} className="flex items-center justify-between bg-brand-darker border border-gray-800 rounded-xl px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center">
                                                    <Users className="h-4 w-4 text-gray-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white">{u.email}</p>
                                                    <span className={cn(
                                                        "text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-widest",
                                                        u.role === 'superadmin' ? "bg-brand-yellow/10 text-brand-yellow" :
                                                            u.role === 'gerente' ? "bg-green-500/10 text-green-400" :
                                                                "bg-blue-500/10 text-blue-400"
                                                    )}>
                                                        {u.role}
                                                    </span>
                                                </div>
                                            </div>
                                            {u.role !== 'superadmin' && (
                                                <Button
                                                    variant="ghost" size="icon"
                                                    className="text-gray-600 hover:text-red-500 h-8 w-8"
                                                    onClick={() => handleDeleteRole(u.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            {/* ===== MODAL: Atribuir Permissão ===== */}
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

            {/* ===== MODAL: Novo Usuário (email/senha) ===== */}
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
                        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20 animate-in fade-in duration-300">
                            <X className="h-4 w-4 shrink-0" />
                            <p>{newUserError}</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Nome</label>
                        <div className="relative group">
                            <User className="absolute left-3 top-3.5 h-4 w-4 text-gray-500 transition-colors group-focus-within:text-brand-yellow" />
                            <Input
                                value={newUserForm.nome}
                                onChange={e => setNewUserForm({ ...newUserForm, nome: e.target.value })}
                                placeholder="Nome completo"
                                className="bg-brand-darker border-gray-800 h-12 pl-10 focus:border-brand-yellow/50"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Email</label>
                        <div className="relative group">
                            <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-500 transition-colors group-focus-within:text-brand-yellow" />
                            <Input
                                type="email"
                                value={newUserForm.email}
                                onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })}
                                placeholder="usuario@email.com"
                                className="bg-brand-darker border-gray-800 h-12 pl-10 focus:border-brand-yellow/50"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Senha</label>
                        <div className="relative group">
                            <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-500 transition-colors group-focus-within:text-brand-yellow" />
                            <Input
                                type="password"
                                value={newUserForm.password}
                                onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })}
                                placeholder="Mínimo 6 caracteres"
                                className="bg-brand-darker border-gray-800 h-12 pl-10 focus:border-brand-yellow/50"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Loja</label>
                        <select
                            value={newUserForm.loja_id}
                            onChange={e => setNewUserForm({ ...newUserForm, loja_id: e.target.value })}
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
                                    onClick={() => setNewUserForm({ ...newUserForm, role: r.value })}
                                    className={cn(
                                        "p-3 rounded-xl border text-left transition-all",
                                        newUserForm.role === r.value
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

            {/* ===== MODAL: Editar Perfil ===== */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => { setIsEditModalOpen(false); setEditError(null); }}
                title="Editar Perfil"
                description="Atualize os dados do usuário."
                footer={
                    <>
                        <Button variant="outline" onClick={() => { setIsEditModalOpen(false); setEditError(null); }} className="border-gray-800">Cancelar</Button>
                        <Button onClick={handleUpdateUser} disabled={savingEdit} className="bg-brand-red text-white hover:bg-brand-red/90 font-bold uppercase tracking-widest">
                            {savingEdit ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Pencil className="h-4 w-4 mr-2" />} Salvar
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    {editError && (
                        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">
                            <X className="h-4 w-4 shrink-0" /><p>{editError}</p>
                        </div>
                    )}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Email</label>
                        <div className="relative group">
                            <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-500" />
                            <Input type="email" value={editForm.email} readOnly
                                className="bg-brand-darker border-gray-800 h-12 pl-10 text-gray-500 cursor-not-allowed" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Nome</label>
                        <div className="relative group">
                            <User className="absolute left-3 top-3.5 h-4 w-4 text-gray-500 group-focus-within:text-brand-yellow" />
                            <Input value={editForm.nome} onChange={e => setEditForm({ ...editForm, nome: e.target.value })}
                                placeholder="Nome completo" className="bg-brand-darker border-gray-800 h-12 pl-10 focus:border-brand-yellow/50" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Telefone</label>
                        <div className="relative group">
                            <Phone className="absolute left-3 top-3.5 h-4 w-4 text-gray-500 group-focus-within:text-brand-yellow" />
                            <Input value={editForm.telefone} onChange={e => setEditForm({ ...editForm, telefone: e.target.value })}
                                placeholder="(00) 00000-0000" className="bg-brand-darker border-gray-800 h-12 pl-10 focus:border-brand-yellow/50" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">CPF</label>
                        <div className="relative group">
                            <FileText className="absolute left-3 top-3.5 h-4 w-4 text-gray-500 group-focus-within:text-brand-yellow" />
                            <Input value={editForm.cpf} onChange={e => setEditForm({ ...editForm, cpf: e.target.value })}
                                placeholder="000.000.000-00" className="bg-brand-darker border-gray-800 h-12 pl-10 focus:border-brand-yellow/50" />
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
