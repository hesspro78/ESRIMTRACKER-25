import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Assurez-vous que ce chemin est correct
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
        setSession(newSession);
        if (newSession?.user) {
          await fetchUserProfile(newSession.user);
        } else {
          setUserProfile(null);
        }
        if (_event === 'SIGNED_OUT') {
          setUserProfile(null);
        }
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (user) => {
    if (!user || !supabase) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116: ' esattamente una riga attesa' - ignore if no profile yet
        throw error;
      }
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast({
        title: 'Erreur de profil',
        description: "Impossible de charger le profil utilisateur.",
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };


  const login = async (credentials) => {
    if (!supabase) return { error: { message: "Supabase client not initialized." } };
    setLoading(true);
    const { email, password } = credentials;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) return { error };
    if (data.user) await fetchUserProfile(data.user);
    return { session: data.session, user: data.user };
  };

  const register = async (userData) => {
    if (!supabase) return { error: { message: "Supabase client not initialized." } };
    setLoading(true);
    const { email, password, name, department, role = 'employee' } = userData;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          department: department,
        },
        app_metadata: { // Utiliser app_metadata pour le rôle, comme dans la fonction handle_new_user
            role: role
        }
      },
    });
    setLoading(false);
    if (error) return { error };
    // La fonction handle_new_user devrait créer le profil. On pourrait le re-fetcher ici si besoin.
    return { session: data.session, user: data.user };
  };

  const logout = async () => {
    if (!supabase) return { error: { message: "Supabase client not initialized." } };
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);
    if (error) return { error };
    setSession(null);
    setUserProfile(null);
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

      setUserProfile(data); // Mettre à jour le profil localement
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
    user: session?.user, // Alias pour la compatibilité, mais 'session.user' est plus direct
    userProfile,
    login,
    logout,
    register,
    loading,
    fetchUserProfile, // Exposer pour re-fetch si nécessaire
    updateUserProfileInContext
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};