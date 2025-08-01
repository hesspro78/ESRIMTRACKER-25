import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Bell, User, Settings as SettingsIconLucide, LogOut, ArrowLeft } from 'lucide-react';


const DashboardHeader = ({
  appName,
  appLogo,
  userName,
  userAvatarUrl,
  currentTime,
  unreadNotificationsCount,
  notifications,
  markAllNotificationsAsRead,
  onLogout, // Ce prop est toujours là, mais le toast est géré par useAuth
  onBackToClocking
}) => {

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
      // Le toast est maintenant géré dans le hook useAuth
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0"
    >
      <div className="flex items-center space-x-3">
        <img-replace src={appLogo} alt={`${appName} Logo`} className="h-10 w-10 rounded-md shadow-md"/>
        <div>
          <h1 className="text-3xl font-bold text-gradient">{appName}</h1>
          <p className="text-muted-foreground">
            Bonjour {userName}, {currentTime.toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-foreground hover:bg-white/10">
              <Bell className="h-5 w-5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white animate-pulse">
                  {unreadNotificationsCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 glass-effect border-gradient" align="end">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Notifications</CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-80 overflow-y-auto scrollbar-hide">
              {notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4 text-center">Aucune notification</p>
              ) : (
                notifications.map(notif => (
                  <DropdownMenuItem key={notif.id} className="flex flex-col items-start p-3 hover:bg-white/5 cursor-default">
                    <p className={`font-semibold ${!notif.read ? 'text-primary' : 'text-foreground'}`}>{notif.title}</p>
                    <p className="text-xs text-muted-foreground">{notif.message}</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">{new Date(notif.timestamp).toLocaleString('fr-FR')}</p>
                  </DropdownMenuItem>
                ))
              )}
            </CardContent>
            {notifications.length > 0 && (
              <>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={markAllNotificationsAsRead} className="justify-center hover:bg-white/5 cursor-pointer text-foreground">
                  Marquer tout comme lu
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-white/10">
              <Avatar className="h-10 w-10 border-2 border-primary">
                <AvatarImage src={userAvatarUrl || "/placeholder-avatar.jpg"} alt={userName} />
                <AvatarFallback className="gradient-purple text-white">
                  {userName?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 glass-effect border-gradient" align="end" forceMount>
            <DropdownMenuItem className="focus:bg-white/5 text-foreground">
              <User className="mr-2 h-4 w-4 text-primary" />
              <span>Profil</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="focus:bg-white/5 text-foreground">
              <SettingsIconLucide className="mr-2 h-4 w-4 text-primary" />
              <span>Paramètres</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10"/>
            {onBackToClocking && (
              <>
                <DropdownMenuItem onClick={onBackToClocking} className="text-blue-400 focus:bg-blue-400/20 focus:text-blue-300">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  <span>Retour au Pointage</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10"/>
              </>
            )}
            <DropdownMenuItem onClick={handleLogoutClick} className="text-red-400 focus:bg-red-400/20 focus:text-red-300">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Déconnexion</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
};

export default DashboardHeader;
