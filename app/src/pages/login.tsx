import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2, LogIn, Mail, Lock, AlertCircle } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/';

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            navigate(from, { replace: true });
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || 'Erro ao realizar login. Verifique suas credenciais.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-brand-dark p-4">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 blur-sm pointer-events-none"></div>

            <Card className="z-10 w-full max-w-md border-gray-800 bg-brand-dark/80 backdrop-blur-xl text-white shadow-2xl">
                <CardHeader className="space-y-1 text-center">
                    <div className="mx-auto mb-4 flex transform items-center justify-center rounded-2xl bg-brand-red p-3 shadow-[0_0_20px_rgba(227,30,36,0.3)] transition-transform hover:scale-110">
                        <LogIn className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-3xl font-bold tracking-tight">GESTÃO SUCATA</CardTitle>
                    <CardDescription className="text-gray-400">
                        Entre com suas credenciais para acessar o painel
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        {error && (
                            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20 animate-in fade-in zoom-in duration-300">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300" htmlFor="email">
                                E-mail
                            </label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500 transition-colors group-focus-within:text-brand-yellow" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="bg-brand-dark/50 border-gray-700 pl-10 text-white placeholder:text-gray-600 focus:border-brand-yellow focus:ring-brand-yellow/20"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-300" htmlFor="password">
                                    Senha
                                </label>
                                <Link
                                    to="/forgot-password"
                                    className="text-xs text-brand-yellow hover:underline"
                                >
                                    Esqueceu a senha?
                                </Link>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500 transition-colors group-focus-within:text-brand-yellow" />
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-brand-dark/50 border-gray-700 pl-10 text-white placeholder:text-gray-600 focus:border-brand-yellow focus:ring-brand-yellow/20"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-brand-red hover:bg-red-700 text-white py-6 text-lg font-semibold shadow-lg shadow-brand-red/20 transition-all active:scale-[0.98]"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Entrando...
                                </>
                            ) : (
                                'Entrar no Sistema'
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4 text-center">
                    <p className="text-xs text-gray-500">
                        © 2024 Gestão Sucata Pro - Todos os direitos reservados
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
