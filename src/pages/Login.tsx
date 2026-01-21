import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../integrations/supabase/client';
import { Dumbbell } from 'lucide-react';

const Login: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-[#0a0a0c] flex flex-col items-center justify-center p-8 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 bg-gradient-to-tr from-orange-900 to-blue-900 blur-3xl"></div>
      
      <div className="w-full max-w-sm space-y-8 animate-in slide-in-from-bottom-8 relative z-10">
        <div className="text-center">
          <div className="w-16 h-16 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-cyan-400 mx-auto mb-6">
            <Dumbbell size={32} />
          </div>
          <h2 className="text-3xl font-black text-white mb-2">Secure Link</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Protocol Handshake Initiated</p>
        </div>

        <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl backdrop-blur-md">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#06b6d4',
                    brandAccent: '#0891b2',
                    inputBackground: 'rgba(255, 255, 255, 0.05)',
                    inputText: 'white',
                    inputPlaceholder: '#475569',
                    inputBorder: 'rgba(255, 255, 255, 0.1)',
                  },
                  radii: {
                    borderRadiusButton: '2rem',
                    inputBorderRadius: '1.5rem',
                  },
                },
              },
            }}
            theme="dark"
            providers={[]}
          />
        </div>
      </div>
    </div>
  );
};

export default Login;