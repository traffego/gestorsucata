import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2, Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) throw error;
            setSuccess(true);
        } catch (err: any) {
            console.error('Reset password error:', err);
            setError(err.message || 'Erro ao enviar e-mail de recuperação.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-brand-dark p-4">
            <Card className="w-full max-w-md border-gray-800 bg-brand-dark/80 backdrop-blur-xl text-white shadow-2xl">
                <CardHeader className="space-y-1 text-center">
                    <div className="mx-auto mb-4 flex transform items-center justify-center rounded-2xl bg-brand-yellow p-3 shadow-[0_0_20px_rgba(255,215,0,0.2)]">
                        <Mail className="h-8 w-8 text-brand-dark" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">Recuperar Senha</CardTitle>
                    <CardDescription className="text-gray-400">
                        Digite seu e-mail para receber um link de redefinição
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {success ? (
                        <div className="flex flex-col items-center gap-4 py-4 text-center animate-in fade-in zoom-in duration-500">
                            <CheckCircle2 className="h-12 w-12 text-green-500" />
                            <div className="space-y-2">
                                <h3 className="font-semibold text-lg text-white">E-mail Enviado!</h3>
                                <p className="text-sm text-gray-400">
                                    Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
                                </p>
                            </div>
                            <Link to="/login" className="w-full mt-2">
                                <Button className="w-full bg-white/10 hover:bg-white/20 text-white">
                                    Voltar para o Login
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleReset} className="space-y-4">
                            {error && (
                                <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
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

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-brand-yellow hover:bg-yellow-600 text-brand-dark py-6 text-lg font-bold shadow-lg shadow-brand-yellow/10 transition-all"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    'Enviar Link de Recuperação'
                                )}
                            </Button>

                            <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-white transition-colors pt-2">
                                <ArrowLeft className="h-4 w-4" />
                                Voltar para o Login
                            </Link>
                        </form>
                    )}
                </CardContent>
                <CardFooter className="text-center">
                    <p className="w-full text-xs text-gray-500">
                        Gestão Sucata Pro v1.0
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
