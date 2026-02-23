import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { Layout } from './components/layout/layout';
import { AuthProvider } from './contexts/AuthContext';
import { StoreProvider, useStore } from './contexts/StoreContext';
import { AuthGuard } from './components/auth/AuthGuard';
import Dashboard from './pages/dashboard';
import NovaVenda from './pages/nova-venda';
import Financeiro from './pages/financeiro';
import Vendas from './pages/vendas';
import Login from './pages/login';
import ForgotPassword from './pages/forgot-password';
import DevTools from './pages/dev-tools';
import ContasAPagar from './pages/contas-a-pagar';
import Lojas from './pages/lojas';
import Usuarios from './pages/usuarios';

function NavButton({ to, label, icon: Icon }: { to: string; label: string; icon?: any }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link to={to}>
      <button
        className={`px-5 py-2 rounded-lg text-[11px] font-bold transition-all duration-300 uppercase tracking-widest flex items-center gap-2 ${isActive
          ? 'bg-brand-red text-white shadow-[0_0_20px_rgba(227,30,36,0.2)] scale-105 z-10'
          : 'text-gray-500 hover:text-white hover:bg-white/5'
          }`}
      >
        {Icon && <Icon className="h-4 w-4" />}
        {label}
      </button>
    </Link>
  );
}

function RoleBasedNav() {
  const { isSuperAdmin, isVendedor, lojas, lojaAtual, setLojaAtualById } = useStore();

  return (
    <div className="mb-8 flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap gap-2 p-1.5 bg-brand-dark border border-gray-800 rounded-xl w-fit shadow-2xl">
        {/* Vendedor vê apenas venda e histórico */}
        {!isVendedor && <NavButton to="/" label="Painel" />}
        <NavButton to="/nova-venda" label="Nova Venda" />
        <NavButton to="/vendas" label="Minhas Vendas" />
        {!isVendedor && <NavButton to="/financeiro" label="Financeiro" />}
        {!isVendedor && <NavButton to="/lojas" label="Lojas" />}
        {!isVendedor && <NavButton to="/usuarios" label="Usuários" />}
        {!isVendedor && <NavButton to="/contas-a-pagar" label="Contas a Pagar" />}
        {isSuperAdmin && <NavButton to="/dev" label="⚙ Dev" />}
      </div>

      {/* Seletor de Loja */}
      {lojas.length > 1 && (
        <select
          value={lojaAtual?.id || ''}
          onChange={e => setLojaAtualById(e.target.value)}
          className="ml-auto bg-brand-dark border border-gray-700 rounded-xl h-10 px-4 text-xs text-brand-yellow font-bold uppercase tracking-widest outline-none appearance-none cursor-pointer hover:border-brand-yellow/50 transition-all"
        >
          {lojas.map(l => (
            <option key={l.id} value={l.id}>{l.nome}</option>
          ))}
        </select>
      )}

      {lojaAtual && lojas.length <= 1 && (
        <span className="ml-auto text-[10px] text-gray-600 uppercase tracking-widest font-bold">
          {lojaAtual.nome}
        </span>
      )}
    </div>
  );
}

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <StoreProvider>
        <Layout>
          <RoleBasedNav />
          <div className="relative">
            {children}
          </div>
        </Layout>
      </StoreProvider>
    </AuthGuard>
  );
}

function AppContent() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Protected Routes */}
      <Route path="/" element={<ProtectedLayout><div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out"><Dashboard /></div></ProtectedLayout>} />
      <Route path="/nova-venda" element={<ProtectedLayout><div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out"><NovaVenda /></div></ProtectedLayout>} />
      <Route path="/vendas" element={<ProtectedLayout><div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out"><Vendas /></div></ProtectedLayout>} />
      <Route path="/financeiro" element={<ProtectedLayout><div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out"><Financeiro /></div></ProtectedLayout>} />
      <Route path="/lojas" element={<ProtectedLayout><div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out"><Lojas /></div></ProtectedLayout>} />
      <Route path="/usuarios" element={<ProtectedLayout><div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out"><Usuarios /></div></ProtectedLayout>} />
      <Route path="/contas-a-pagar" element={<ProtectedLayout><div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out"><ContasAPagar /></div></ProtectedLayout>} />
      <Route path="/dev" element={<ProtectedLayout><div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out"><DevTools /></div></ProtectedLayout>} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
