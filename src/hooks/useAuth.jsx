import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      console.error("Supabase client not initialized. Auth operations will not work.");
      setLoading(false);
      return;
    }

    const getInitialSession = async () => {
      setLoading(true);
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Error getting session:", sessionError);
      }
      setSession(currentSession);
      if (currentSession?.user) {
        await fetchUserProfile(currentSession.user);
      }
      setLoading(false);
    };
    
    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setLoading(true);
        setSession(newSession);
        if (newSession?.user) {
          await fetchUserProfile(newSession.user);
        } else {
          setUserProfile(null);
        }
        if (_event === 'SIGNED_OUT') {
          setUserProfile(null); 
        }
        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (user) => {
    if (!user || !supabase) {
      setUserProfile(null);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { 
        throw error;
      }
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error.message);
      setUserProfile(null);
      toast({
        title: 'Erreur de profil',
        description: "Impossible de charger le profil utilisateur.",
        variant: 'destructive',
      });
    }
  };


  const login = async (credentials) => {
    if (!supabase) return { success: false, error: "Supabase client not initialized." };
    setLoading(true);
    const { email, password } = credentials;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) return { success: false, error: error.message };
    return { success: true, session: data.session, user: data.user };
  };

  const register = async (userData) => {
    if (!supabase) return { success: false, error: "Supabase client not initialized." };
    setLoading(true);
    const { email, password, name, department, role = 'employee' } = userData;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          department: department,
          username: email, 
        },
        app_metadata: { 
          role: role
        }
      },
    });
    setLoading(false);
    if (error) return { success: false, error: error.message };
    return { success: true, session: data.session, user: data.user };
  };

  const logout = async () => {
    if (!supabase) {
      toast({
        title: 'Erreur de déconnexion',
        description: "Client Supabase non initialisé.",
        variant: 'destructive',
      });
      return { error: { message: "Supabase client not initialized." } };
    }
    
    setLoading(true);
    setSession(null);
    setUserProfile(null);

    const { error } = await supabase.auth.signOut();
    setLoading(false); 
    
    if (error) {
      const isSessionNotFoundError = (error.message && error.message.includes('Session from session_id claim in JWT does not exist')) ||
                                   (error.code && error.code === 'session_not_found') ||
                                   (error.error_code && error.error_code === 'session_not_found');

      if (!isSessionNotFoundError) {
        console.error("Logout error:", error);
        toast({
          title: 'Erreur de déconnexion',
          description: `Une erreur est survenue: ${error.message}`,
          variant: 'destructive',
        });
        return { error };
      }
    }
    
    toast({
      title: "Déconnexion réussie",
      description: "À bientôt !",
    });
    return {};
  };
  
  const updateUserProfileInContext = async (updatedProfileData) => {
    if (!session?.user || !supabase) {
      return { success: false, error: "Utilisateur non connecté ou Supabase non initialisé." };
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updatedProfileData)
        .eq('id', session.user.id)
        .select()
        .single();

      if (error) throw error;

      setUserProfile(data); 
      toast({ title: "Succès", description: "Profil mis à jour." });
      return { success: true, profile: data };
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Erreur de mise à jour",
        description: "Impossible de mettre à jour le profil.",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };


  const value = {
    session,
    user: session?.user, 
    userProfile,
    login,
    logout,
    register,
    loading,
    fetchUserProfile, 
    updateUserProfileInContext
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};