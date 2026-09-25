import React, { useState, useEffect } from 'react';
import { UserProfile } from './types';
import { LocalData } from './lib/storage';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { ShoppingListsModule } from './components/ShoppingListsModule';
import { ProductsModule } from './components/ProductsModule';
import { StoresModule } from './components/StoresModule';
import { ReceiptsModule } from './components/ReceiptsModule';
import { ReportsModule } from './components/ReportsModule';
import {
  ShoppingBag,
  Package,
  Store as StoreIcon,
  FileText,
  BarChart3,
  LogIn,
  LogOut,
  User,
  AlertCircle,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'lists' | 'products' | 'stores' | 'receipts' | 'reports'>('lists');
  const [user, setUser] = useState<UserProfile | null>(LocalData.getUser());
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      // Check current active Supabase session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const supabaseUser: UserProfile = {
            id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name || session.user.email,
            avatar_url: session.user.user_metadata?.avatar_url,
          };
          setUser(supabaseUser);
          LocalData.setUser(supabaseUser);
        }
      });

      // Listen for OAuth / Auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const supabaseUser: UserProfile = {
            id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name || session.user.email,
            avatar_url: session.user.user_metadata?.avatar_url,
          };
          setUser(supabaseUser);
          LocalData.setUser(supabaseUser);
        } else {
          setUser(null);
          LocalData.setUser(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const handleLoginGoogle = async () => {
    setAuthError(null);

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (error) {
          console.error('Error signing in with Google SSO:', error);
          setAuthError(`Erro do Supabase: ${error.message}. Verifique a configuração do Provider Google no painel do Supabase.`);
          return;
        }
      } catch (e: any) {
        console.error('OAuth sign in exception:', e);
        setAuthError(`Falha ao conectar: ${e?.message || 'Erro de rede ou configuração de OAuth.'}`);
        return;
      }
    } else {
      // Alert user if Supabase environment variables are missing
      setAuthError('Supabase não configurado. Certifique-se de preencher VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY na Vercel e fazer Redeploy.');

      // Simulation fallback for local dev
      const googleUser: UserProfile = {
        id: `usr-google-${Date.now()}`,
        email: 'usuario.google@gmail.com',
        full_name: 'Usuário Google (Modo Demo)',
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      };
      LocalData.setUser(googleUser);
      setUser(googleUser);
    }
    setShowAuthModal(false);
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    LocalData.setUser(null);
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col text-slate-900 pb-20 md:pb-0">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center text-white shadow-md shadow-green-600/20">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg text-slate-800 leading-tight">MercadoLista</h1>
              <p className="text-[10px] text-green-700 font-bold uppercase tracking-wider">Compras Inteligentes</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 pl-2 pr-3 py-1 rounded-full">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.full_name || 'User'} className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">
                    U
                  </div>
                )}
                <span className="text-xs font-semibold text-slate-700 hidden sm:inline">{user.full_name || user.email}</span>
                <button
                  onClick={handleLogout}
                  className="p-1 text-slate-400 hover:text-red-500 transition"
                  title="Sair"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthError(null);
                  setShowAuthModal(true);
                }}
                className="flex items-center space-x-1.5 bg-green-600 hover:bg-green-700 text-white font-medium text-xs px-3.5 py-2 rounded-xl transition shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>Entrar / Google SSO</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 py-6 flex-1 w-full">
        {activeTab === 'lists' && <ShoppingListsModule />}
        {activeTab === 'products' && <ProductsModule />}
        {activeTab === 'stores' && <StoresModule />}
        {activeTab === 'receipts' && <ReceiptsModule />}
        {activeTab === 'reports' && <ReportsModule />}
      </main>

      {/* Bottom Navigation Bar (Mobile) / Tab Bar (Desktop) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 md:relative md:border-t-0 md:bg-slate-200/50 md:p-1.5 md:rounded-2xl md:max-w-xl md:mx-auto md:mb-6">
        <div className="flex items-center justify-around md:justify-center md:space-x-2 p-2">
          <button
            onClick={() => setActiveTab('lists')}
            className={`flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'lists'
                ? 'text-green-700 bg-green-50 md:bg-white md:shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShoppingBag className="w-5 h-5 md:w-4 md:h-4" />
            <span>Listas</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'products'
                ? 'text-green-700 bg-green-50 md:bg-white md:shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Package className="w-5 h-5 md:w-4 md:h-4" />
            <span>Produtos</span>
          </button>

          <button
            onClick={() => setActiveTab('stores')}
            className={`flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'stores'
                ? 'text-green-700 bg-green-50 md:bg-white md:shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <StoreIcon className="w-5 h-5 md:w-4 md:h-4" />
            <span>Lojas</span>
          </button>

          <button
            onClick={() => setActiveTab('receipts')}
            className={`flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'receipts'
                ? 'text-green-700 bg-green-50 md:bg-white md:shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-5 h-5 md:w-4 md:h-4" />
            <span>Notas</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'reports'
                ? 'text-green-700 bg-green-50 md:bg-white md:shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="w-5 h-5 md:w-4 md:h-4" />
            <span>Gastos</span>
          </button>
        </div>
      </nav>

      {/* Auth / Google SSO Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-5 text-center">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <User className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-800">Entrar no MercadoLista</h3>
              <p className="text-xs text-slate-500 mt-1">
                Acesse suas listas compartilhadas e relatórios de gastos em qualquer dispositivo.
              </p>
            </div>

            {authError && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-start space-x-2 text-left">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                <span>{authError}</span>
              </div>
            )}

            <button
              onClick={handleLoginGoogle}
              className="w-full py-3 px-4 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center space-x-3 shadow-sm transition"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.15C3.25 21.3 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.27C.46 8.2 0 10.04 0 12s.46 3.8 1.27 5.42l4.01-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.25 2.7 1.27 6.58l4.01 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continuar com o Google</span>
            </button>

            <button
              onClick={() => setShowAuthModal(false)}
              className="text-xs text-slate-400 hover:text-slate-600 font-medium"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
