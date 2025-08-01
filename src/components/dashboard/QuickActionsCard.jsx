import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const QuickActionsCard = ({ currentTime, currentStatus, onClockIn, onClockOut, isLoading }) => {
  const formattedTime = format(currentTime, 'HH:mm:ss', { locale: fr });
  const formattedDate = format(currentTime, 'eeee dd MMMM yyyy', { locale: fr });

  const ClockButton = ({ action, icon, label, disabled }) => (
    <Button 
      onClick={action} 
      className={`w-full text-lg py-6 transition-all duration-300 ease-in-out transform hover:scale-105 ${
        currentStatus === 'checked-in' && label === 'Pointer Entrée' ? 'bg-gray-500 opacity-50 cursor-not-allowed' :
        currentStatus !== 'checked-in' && label === 'Pointer Sortie' ? 'bg-gray-500 opacity-50 cursor-not-allowed' :
        label === 'Pointer Entrée' ? 'gradient-green hover:opacity-90' : 'gradient-red hover:opacity-90'
      }`}
      disabled={disabled || isLoading}
    >
      {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : React.cloneElement(icon, { className: "mr-2 h-5 w-5" })}
      {label}
    </Button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="glass-effect border-gradient shadow-xl overflow-hidden">
        <CardHeader className="bg-black/20 p-4 sm:p-6">
          <CardTitle className="text-2xl text-foreground">Actions Rapides</CardTitle>
          <CardDescription>
            {formattedDate} - <span className="font-semibold text-primary">{formattedTime}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="text-center p-4 rounded-lg glass-effect-inset mb-6">
            <p className="text-muted-foreground mb-1">Statut Actuel:</p>
            {currentStatus === 'loading' ? (
              <div className="flex items-center justify-center text-primary">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Chargement...
              </div>
            ) : currentStatus === 'checked-in' ? (
              <p className="text-2xl font-bold text-green-400 flex items-center justify-center">
                <CheckCircle className="mr-2 h-7 w-7"/> En Service
              </p>
            ) : currentStatus === 'checked-out' ? (
              <p className="text-2xl font-bold text-red-400 flex items-center justify-center">
                <AlertCircle className="mr-2 h-7 w-7"/> Hors Service
              </p>
            ) : (
               <p className="text-2xl font-bold text-yellow-400 flex items-center justify-center">
                <AlertCircle className="mr-2 h-7 w-7"/> Inconnu
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ClockButton
              action={onClockIn}
              icon={<LogIn />}
              label="Pointer Entrée"
              disabled={currentStatus === 'checked-in' || currentStatus === 'loading'}
            />
            <ClockButton
              action={onClockOut}
              icon={<LogOut />}
              label="Pointer Sortie"
              disabled={currentStatus !== 'checked-in' || currentStatus === 'loading'}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default QuickActionsCard;