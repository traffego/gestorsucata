import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { Layout } from './components/layout/layout';
import { AuthProvider } from './contexts/AuthContext';
import { AuthGuard } from './components/auth/AuthGuard';
import Dashboard from './pages/dashboard';
import NovaVenda from './pages/nova-venda';
import Estoque from './pages/estoque';
import Financeiro from './pages/financeiro';
import Cadastros from './pages/cadastros';
import Vendas from './pages/vendas';
import Login from './pages/login';
import ForgotPassword from './pages/forgot-password';

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

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <Layout>
        <div className="mb-8 flex flex-wrap gap-2 p-1.5 bg-brand-dark border border-gray-800 rounded-xl w-fit shadow-2xl">
          <NavButton to="/" label="Painel" />
          <NavButton to="/nova-venda" label="Nova Venda" />
          <NavButton to="/vendas" label="Minhas Vendas" />
          <NavButton to="/estoque" label="Estoque" />
          <NavButton to="/financeiro" label="Financeiro" />
          <NavButton to="/cadastros" label="Cadastros" />
        </div>
        <div className="relative">
          {children}
        </div>
      </Layout>
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
      <Route path="/estoque" element={<ProtectedLayout><div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out"><Estoque /></div></ProtectedLayout>} />
      <Route path="/financeiro" element={<ProtectedLayout><div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out"><Financeiro /></div></ProtectedLayout>} />
      <Route path="/cadastros" element={<ProtectedLayout><div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out"><Cadastros /></div></ProtectedLayout>} />
      <Route path="/cadastros/:type" element={<ProtectedLayout><div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out"><Cadastros /></div></ProtectedLayout>} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter basename="/app">
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
