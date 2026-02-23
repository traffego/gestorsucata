import { motion } from "framer-motion";
import {
  Factory,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Tag,
  Truck,
  Shield,
  Zap,
  ArrowRight,
  ChevronRight,
  Store,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const features = [
  {
    icon: Factory,
    title: "Cadastro de Sucatas",
    desc: "Registre e organize todas as sucatas com identificação única e rastreabilidade completa.",
  },
  {
    icon: Package,
    title: "Estoque de Peças",
    desc: "Controle total do inventário com categorias, localização e status em tempo real.",
  },
  {
    icon: ShoppingCart,
    title: "Vendas Integradas",
    desc: "PDV completo com carrinho, histórico e controle financeiro integrado.",
  },
  {
    icon: Users,
    title: "Clientes & Fornecedores",
    desc: "Base de dados completa com documentos, contatos e histórico de transações.",
  },
  {
    icon: Tag,
    title: "Etiquetas Inteligentes",
    desc: "Gere e imprima etiquetas com código de barras para identificação rápida.",
  },
  {
    icon: BarChart3,
    title: "Relatórios Avançados",
    desc: "Dashboards e métricas para tomada de decisão estratégica do seu negócio.",
  },
];

const stats = [
  { value: "10x", label: "Mais rápido que planilhas" },
  { value: "99%", label: "Precisão no estoque" },
  { value: "0%", label: "Perda por descontrole" },
  { value: "24/7", label: "Acesso ao sistema" },
];

const modules = [
  { icon: Factory, name: "Sucatas" },
  { icon: Package, name: "Estoque" },
  { icon: ShoppingCart, name: "Vendas" },
  { icon: Users, name: "Clientes" },
  { icon: Truck, name: "Transportadoras" },
  { icon: Store, name: "Lojas" },
  { icon: MapPin, name: "Localizações" },
  { icon: BarChart3, name: "Relatórios" },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <img src="/gs-logo.png" alt="GS PRO" className="h-14 w-auto" />
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Funcionalidades
            </a>
            <a href="#modules" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Módulos
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Planos
            </a>
          </div>
          <div className="flex items-center gap-3">
            <a href="/app" className="text-sm font-mono text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5">
              Login
            </a>
            <a href="https://wa.me/5500000000000?text=Olá!%20Quero%20começar%20a%20usar%20o%20GS%20PRO" target="_blank" rel="noopener noreferrer" className="text-xs font-mono font-bold tracking-wide bg-primary/20 text-primary-foreground px-4 py-2 rounded-none border border-primary/40 backdrop-blur-xl hover:bg-primary/30 transition-all shadow-[0_0_20px_-5px_hsl(var(--primary)/0.3)]">
              COMEÇAR AGORA
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-end lg:items-center pt-16 pb-24 lg:pb-0">
        <div className="absolute inset-0 z-0">
          <img
            src={heroBg}
            alt="Pátio de sucatas industrial"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60" />
          <div className="absolute inset-0 bg-grid-pattern" />
        </div>

        {/* Decorative vertical line */}
        <div className="hidden lg:block absolute left-[12%] top-24 bottom-24 w-px bg-gradient-to-b from-transparent via-primary/20 to-transparent z-10" />

        <div className="container relative z-10 mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-8 items-end lg:items-center">
            {/* Left content */}
            <div className="lg:col-span-7 text-left">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 border-l-2 border-primary pl-3 mb-10"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-primary">
                  Sistema de Gestão #1 para Sucatas
                </span>
              </motion.div>

              <motion.h1
                custom={1}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="font-mono text-5xl md:text-7xl lg:text-[5.5rem] font-black tracking-tighter leading-[0.85] mb-8 hero-glitch"
              >
                <span className="text-foreground block">QUEM NÃO</span>
                <span className="text-gradient block translate-x-4 md:translate-x-8">CONTROLA,</span>
                <span className="text-foreground block shatter-word">
                  {"QUEBRA.".split("").map((char, i) => (
                    <span
                      key={i}
                      className="shatter-letter"
                      style={{
                        '--i': i,
                        '--fall-x': `${[-45, 30, -15, 55, -35, 20, -10][i]}px`,
                        '--fall-y': `${[60, 80, 110, 70, 95, 120, 50][i]}px`,
                        '--fall-rot': `${[-25, 40, -60, 35, -45, 55, -15][i]}deg`,
                        '--crack-x': `${[-2, 1.5, -1, 3, -2.5, 1, -0.5][i]}px`,
                        '--crack-y': `${[1, -1.5, 2, -1, 1.5, -2, 1][i]}px`,
                      } as React.CSSProperties}
                    >
                      {char}
                    </span>
                  ))}
                </span>
              </motion.h1>

              <motion.p
                custom={3}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="text-base md:text-lg text-muted-foreground max-w-md mb-10 leading-relaxed"
              >
                O sistema completo para gestão de sucatas, peças e vendas.
                Controle seu estoque, seus clientes e seu financeiro em um só lugar.
              </motion.p>

              <motion.div
                custom={4}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="flex flex-col sm:flex-row items-start gap-4"
              >
                <a
                  href="https://wa.me/5500000000000?text=Olá!%20Quero%20conhecer%20o%20GS%20PRO"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-13 px-8 bg-primary/20 text-primary-foreground text-sm font-mono font-bold tracking-wide rounded-none border border-primary/40 backdrop-blur-xl hover:bg-primary/30 transition-all shadow-[0_0_30px_-8px_hsl(var(--primary)/0.4)] inline-flex items-center gap-2 group"
                >
                  CONHEÇA AGORA
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform animate-[nudge-right_1.5s_ease-in-out_infinite]" />
                </a>
                <button
                  className="h-13 px-8 bg-transparent text-foreground text-sm font-mono font-bold tracking-wide rounded-none border-2 border-muted-foreground/30 hover:border-foreground hover:bg-muted/30 transition-colors inline-flex items-center gap-2"
                >
                  VER DEMONSTRAÇÃO
                </button>
              </motion.div>

              <motion.p
                custom={5}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="mt-8 text-[11px] text-muted-foreground/60 font-mono tracking-wide"
              >
                Sem cartão · 2 min setup · Suporte dedicado
              </motion.p>
            </div>

            {/* Right side - decorative steps */}
            <div className="hidden lg:flex lg:col-span-5 flex-col items-end gap-6 pr-8">
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.7 }}
                className="text-right"
              >
                <span className="font-mono text-7xl font-black text-foreground/5">01</span>
                <div className="mt-2 border-t border-border pt-3">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground">Cadastre</span>
                  <p className="text-[11px] text-muted-foreground/50 mt-1 max-w-[180px] ml-auto">Registre sucatas com identificação única</p>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8, duration: 0.7 }}
                className="text-right"
              >
                <span className="font-mono text-7xl font-black text-foreground/5">02</span>
                <div className="mt-2 border-t border-primary/20 pt-3">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-primary/70">Controle</span>
                  <p className="text-[11px] text-muted-foreground/50 mt-1 max-w-[180px] ml-auto">Estoque em tempo real, sem surpresas</p>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.0, duration: 0.7 }}
                className="text-right"
              >
                <span className="font-mono text-7xl font-black text-foreground/5">03</span>
                <div className="mt-2 border-t border-border pt-3">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground">Lucre</span>
                  <p className="text-[11px] text-muted-foreground/50 mt-1 max-w-[180px] ml-auto">Venda com PDV integrado e relatórios</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border bg-card/50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="flex flex-col items-center py-12 border-r last:border-r-0 border-border"
              >
                <span className="font-mono text-4xl md:text-5xl font-black text-gradient">
                  {stat.value}
                </span>
                <span className="mt-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {stat.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 lg:py-32">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            variants={fadeUp}
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-xs font-bold uppercase tracking-widest text-primary mb-4 block">
              Funcionalidades
            </span>
            <h2 className="font-mono text-4xl md:text-5xl font-black tracking-tighter">
              TUDO QUE VOCÊ PRECISA
              <br />
              <span className="text-gradient">EM UM SÓ SISTEMA</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="group relative rounded-xl border border-border bg-card p-8 hover:border-primary/40 transition-all duration-500 hover:glow-red"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-mono text-lg font-bold mb-3">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                <ChevronRight className="absolute top-8 right-8 h-5 w-5 text-border group-hover:text-primary transition-colors" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section id="modules" className="py-24 lg:py-32 bg-card/30 border-y border-border">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            variants={fadeUp}
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-xs font-bold uppercase tracking-widest text-accent mb-4 block">
              Módulos
            </span>
            <h2 className="font-mono text-4xl md:text-5xl font-black tracking-tighter">
              SISTEMA <span className="text-gradient">MODULAR</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Cada módulo foi projetado para funcionar de forma integrada, dando a você controle total sobre cada área do negócio.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {modules.map((mod, i) => {
              const delays = [0, 2.8, 1.2, 4.1, 0.6, 3.5, 1.8, 2.3];
              const durations = [5, 7, 4.5, 6.5, 5.5, 4, 7.5, 6];
              return (
              <motion.div
                key={mod.name}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="group flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-8 hover:border-accent/40 transition-all duration-500 cursor-pointer hover:glow-amber glitch-card auto-glitch"
                style={{ '--glitch-delay': `${delays[i]}s`, '--glitch-duration': `${durations[i]}s` } as React.CSSProperties}
              >
                <div className="h-16 w-16 rounded-2xl bg-muted border border-border flex items-center justify-center group-hover:border-accent/40 transition-colors">
                  <mod.icon className="h-7 w-7 text-muted-foreground group-hover:text-accent transition-colors" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
                  {mod.name}
                </span>
              </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="pricing" className="py-24 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-50" />
        <div className="container relative z-10 mx-auto px-4 lg:px-8">
          <motion.div
            variants={fadeUp}
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 mb-8">
              <Zap className="h-3 w-3 text-accent" />
              <span className="text-xs font-bold uppercase tracking-widest text-accent">
                Oferta Limitada
              </span>
            </div>

            <h2 className="font-mono text-4xl md:text-6xl font-black tracking-tighter mb-6">
              COMECE A LUCRAR
              <br />
              <span className="text-gradient">HOJE MESMO</span>
            </h2>

            <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
              Pare de perder dinheiro com controles manuais. O GS PRO se paga no primeiro mês de uso.
            </p>

            <div className="rounded-2xl border border-border bg-card p-8 md:p-12 max-w-lg mx-auto mb-8">
              <div className="flex items-baseline justify-center gap-2 mb-2">
                <span className="font-mono text-6xl font-black text-gradient">R$97</span>
                <span className="text-muted-foreground text-sm">/mês</span>
              </div>
              <p className="text-xs text-muted-foreground mb-8">Acesso completo a todos os módulos</p>

              <div className="space-y-3 text-left mb-8">
                {[
                  "Cadastro ilimitado de sucatas e peças",
                  "PDV completo com carrinho",
                  "Controle financeiro integrado",
                  "Relatórios e dashboards",
                  "Multi-usuários e permissões",
                  "Suporte prioritário via WhatsApp",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Shield className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-sm text-foreground">{item}</span>
                  </div>
                ))}
              </div>

              <a href="https://wa.me/5500000000000?text=Olá!%20Quero%20começar%20a%20usar%20o%20GS%20PRO" target="_blank" rel="noopener noreferrer" className="w-full h-14 text-sm font-mono font-bold tracking-wide bg-primary/20 text-primary-foreground rounded-none border border-primary/40 backdrop-blur-xl hover:bg-primary/30 transition-all shadow-[0_0_30px_-8px_hsl(var(--primary)/0.4)] inline-flex items-center justify-center gap-2 group">
                COMEÇAR AGORA — 7 DIAS GRÁTIS
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            <p className="text-xs text-muted-foreground">
              Cancele quando quiser • Sem taxa de adesão • Migração gratuita
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/gs-logo.png" alt="GS PRO" className="h-8 w-auto" />
            </div>
            <p className="text-xs text-muted-foreground">
              © 2025 Gestão Sucata Pro — Todos os direitos reservados
            </p>
            <span className="text-[10px] text-muted-foreground/50 font-mono uppercase tracking-widest">
              Quem não controla, quebra.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
