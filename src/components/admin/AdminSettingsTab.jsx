import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TabsContent } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth.jsx';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { Save, Image as ImageIcon, KeyRound } from 'lucide-react';

const AdminSettingsTab = () => {
  const { user, updateUserInContext } = useAuth();
  const { 
    appName, setAppName, 
    appLogo, setAppLogo
  } = useAppSettings();

  const [adminCredentials, setAdminCredentials] = useState({ email: '', password: '', confirmPassword: '' });
  const [tempAppName, setTempAppName] = useState(appName);
  const [tempAppLogo, setTempAppLogo] = useState(appLogo);
  const [logoPreview, setLogoPreview] = useState(appLogo);

  useEffect(() => {
    if (user) {
      setAdminCredentials(prev => ({ ...prev, email: user.email }));
    }
    setTempAppName(appName);
    setTempAppLogo(appLogo);
    setLogoPreview(appLogo);
  }, [user, appName, appLogo]);

  const handleAdminCredentialsChange = (e) => {
    setAdminCredentials({ ...adminCredentials, [e.target.name]: e.target.value });
  };

  const handleUpdateAdminCredentials = () => {
    if (adminCredentials.password !== adminCredentials.confirmPassword) {
      toast({ title: "Erreur", description: "Les mots de passe ne correspondent pas.", variant: "destructive" });
      return;
    }
    if (!adminCredentials.email || !adminCredentials.password) {
      toast({ title: "Erreur", description: "L'email et le mot de passe sont requis.", variant: "destructive" });
      return;
    }

    if(user){
      const updatedUser = { 
        ...user, 
        email: adminCredentials.email, 
        password: adminCredentials.password 
      };
      updateUserInContext(updatedUser);
      toast({ title: "Succès", description: "Identifiants administrateur mis à jour." });
      setAdminCredentials(prev => ({ ...prev, password: '', confirmPassword: '' }));
    } else {
       toast({ title: "Erreur", description: "Utilisateur admin non trouvé ou session expirée.", variant: "destructive" });
    }
  };

  const handleAppNameChange = (e) => {
    setTempAppName(e.target.value);
  };

  const handleAppLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
        setTempAppLogo(reader.result); 
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleUpdateAppSettings = () => {
    setAppName(tempAppName);
    setAppLogo(tempAppLogo);
    toast({ title: "Succès", description: "Paramètres de l'application mis à jour." });
  };

  return (
    <TabsContent value="settings" className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Paramètres de l'Application</h2>

      <Card className="glass-effect border-gradient">
        <CardHeader>
          <CardTitle className="flex items-center text-foreground"><KeyRound className="mr-2 h-5 w-5 text-purple-400" />Modifier les identifiants Admin</CardTitle>
          <CardDescription>Mettez à jour l'email et le mot de passe de l'administrateur.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-email" className="text-muted-foreground">Email Administrateur</Label>
            <Input id="admin-email" name="email" type="email" value={adminCredentials.email} onChange={handleAdminCredentialsChange} className="bg-background/70 border-muted-foreground/30 text-foreground placeholder-muted-foreground/50"/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-password" className="text-muted-foreground">Nouveau mot de passe</Label>
            <Input id="admin-password" name="password" type="password" value={adminCredentials.password} onChange={handleAdminCredentialsChange} className="bg-background/70 border-muted-foreground/30 text-foreground placeholder-muted-foreground/50"/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-confirm-password" className="text-muted-foreground">Confirmer le nouveau mot de passe</Label>
            <Input id="admin-confirm-password" name="confirmPassword" type="password" value={adminCredentials.confirmPassword} onChange={handleAdminCredentialsChange} className="bg-background/70 border-muted-foreground/30 text-foreground placeholder-muted-foreground/50"/>
          </div>
          <Button onClick={handleUpdateAdminCredentials} className="gradient-purple w-full sm:w-auto">
            <Save className="mr-2 h-4 w-4" />
            Mettre à jour les identifiants
          </Button>
        </CardContent>
      </Card>

      <Card className="glass-effect border-gradient">
        <CardHeader>
          <CardTitle className="flex items-center text-foreground"><ImageIcon className="mr-2 h-5 w-5 text-green-400" />Personnaliser l'Application</CardTitle>
          <CardDescription>Changez le nom et le logo de l'application.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="app-name" className="text-muted-foreground">Nom de l'application</Label>
            <Input id="app-name" value={tempAppName} onChange={handleAppNameChange} className="bg-background/70 border-muted-foreground/30 text-foreground placeholder-muted-foreground/50"/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="app-logo" className="text-muted-foreground">Logo de l'application (SVG, PNG, JPG)</Label>
            <Input id="app-logo" type="file" accept=".svg,.png,.jpg,.jpeg" onChange={handleAppLogoChange} className="file:text-purple-400 file:font-semibold hover:file:bg-purple-500/10 bg-background/70 border-muted-foreground/30 text-foreground"/>
            {logoPreview && (
              <div className="mt-2 p-2 border border-dashed border-muted-foreground/50 rounded-md inline-block">
                <p className="text-xs text-muted-foreground mb-1">Aperçu du logo :</p>
                <img-replace src={logoPreview} alt="Aperçu du logo" className="h-16 w-16 object-contain rounded-sm"/>
              </div>
            )}
          </div>
          <Button onClick={handleUpdateAppSettings} className="gradient-green w-full sm:w-auto">
            <Save className="mr-2 h-4 w-4" />
            Mettre à jour l'application
          </Button>
        </CardContent>
      </Card>


    </TabsContent>
  );
};

export default AdminSettingsTab;
