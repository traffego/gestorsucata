import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export type Role = 'superadmin' | 'gerente' | 'vendedor';

export interface Loja {
    id: string;
    nome: string;
    is_matriz: boolean;
}

interface UserLojaRole {
    loja_id: string;
    role: Role;
    loja: Loja;
}

interface StoreContextType {
    lojas: Loja[];
    lojaAtual: Loja | null;
    roleNaLoja: Role | null;
    isSuperAdmin: boolean;
    isGerente: boolean;
    isVendedor: boolean;
    setLojaAtualById: (id: string) => void;
    loadingStore: boolean;
    userRoles: UserLojaRole[];
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [userRoles, setUserRoles] = useState<UserLojaRole[]>([]);
    const [lojaAtual, setLojaAtual] = useState<Loja | null>(null);
    const [loadingStore, setLoadingStore] = useState(true);

    useEffect(() => {
        if (user) {
            fetchUserRoles();
        } else {
            setUserRoles([]);
            setLojaAtual(null);
            setLoadingStore(false);
        }
    }, [user]);

    async function fetchUserRoles() {
        setLoadingStore(true);
        try {
            const { data, error } = await supabase
                .from('usuario_loja_roles')
                .select('loja_id, role, loja:lojas(id, nome, is_matriz)')
                .eq('usuario_id', user!.id);

            if (error) {
                console.error('Erro ao buscar roles:', error);
                // Se a tabela ainda não existir, trata como se fosse superadmin da matriz
                setUserRoles([]);
                setLoadingStore(false);
                return;
            }

            const roles = (data || []).map((d: any) => ({
                loja_id: d.loja_id,
                role: d.role as Role,
                loja: d.loja as Loja
            }));

            setUserRoles(roles);

            // Auto-selecionar loja
            if (roles.length > 0) {
                const saved = localStorage.getItem('gs_loja_atual');
                const found = saved ? roles.find(r => r.loja_id === saved) : null;
                setLojaAtual(found ? found.loja : roles[0].loja);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingStore(false);
        }
    }

    const setLojaAtualById = (id: string) => {
        const found = userRoles.find(r => r.loja_id === id);
        if (found) {
            setLojaAtual(found.loja);
            localStorage.setItem('gs_loja_atual', id);
        }
    };

    const lojas = userRoles.map(r => r.loja);
    const currentRole = lojaAtual
        ? userRoles.find(r => r.loja_id === lojaAtual.id)?.role ?? null
        : null;

    const isSuperAdmin = userRoles.some(r => r.role === 'superadmin');

    return (
        <StoreContext.Provider value={{
            lojas,
            lojaAtual,
            roleNaLoja: currentRole,
            isSuperAdmin,
            isGerente: currentRole === 'gerente' || isSuperAdmin,
            isVendedor: currentRole === 'vendedor',
            setLojaAtualById,
            loadingStore,
            userRoles
        }}>
            {children}
        </StoreContext.Provider>
    );
};

export const useStore = () => {
    const context = useContext(StoreContext);
    if (context === undefined) {
        throw new Error('useStore must be used within a StoreProvider');
    }
    return context;
};
