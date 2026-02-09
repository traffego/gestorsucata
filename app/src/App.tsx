import { useState } from "react";
import { Layout } from './components/layout/layout';
import Dashboard from './pages/dashboard';
import NovaVenda from './pages/nova-venda';
import Estoque from './pages/estoque';
import Financeiro from './pages/financeiro';
import QRCodeModule from './pages/qrcode';
import Cadastros from './pages/cadastros';
import Vendas from './pages/vendas';

type Page = 'dashboard' | 'nova-venda' | 'estoque' | 'financeiro' | 'qrcode' | 'cadastros' | 'vendas';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  const navItems: { id: Page; label: string }[] = [
    { id: 'dashboard', label: 'Painel' },
    { id: 'nova-venda', label: 'Nova Venda' },
    { id: 'vendas', label: 'Minhas Vendas' },
    { id: 'estoque', label: 'Estoque' },
    { id: 'financeiro', label: 'Financeiro' },
    { id: 'qrcode', label: 'QR Code' },
    { id: 'cadastros', label: 'Cadastros' },
  ];

  return (
    <Layout>
      <div className="mb-8 flex flex-wrap gap-2 p-1.5 bg-brand-dark border border-gray-800 rounded-xl w-fit shadow-2xl">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            className={`px-5 py-2 rounded-lg text-[11px] font-bold transition-all duration-300 uppercase tracking-widest flex items-center gap-2 ${currentPage === item.id
              ? 'bg-brand-red text-white shadow-[0_0_20px_rgba(227,30,36,0.2)] scale-105 z-10'
              : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <div key={currentPage} className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
          {currentPage === 'dashboard' && <Dashboard />}
          {currentPage === 'nova-venda' && <NovaVenda />}
          {currentPage === 'vendas' && <Vendas />}
          {currentPage === 'estoque' && <Estoque />}
          {currentPage === 'financeiro' && <Financeiro />}
          {currentPage === 'qrcode' && <QRCodeModule />}
          {currentPage === 'cadastros' && <Cadastros />}
        </div>
      </div>
    </Layout>
  );
}

export default App;
