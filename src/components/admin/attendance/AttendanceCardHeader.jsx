import React from 'react';
import { CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Filter, Trash2, CalendarDays } from 'lucide-react';
import { DialogTrigger } from "@/components/ui/dialog"; // Gardez ceci si Dialog est dans le parent
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger as AlertDialogTriggerPrimitive, // Renommez pour éviter conflit si DialogTrigger est aussi utilisé pour AlertDialog
} from "@/components/ui/alert-dialog";

const AttendanceCardHeader = ({ onOpenFilters, onDeleteAll }) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
      <CardTitle className="text-2xl font-bold text-gradient flex items-center mb-4 md:mb-0">
        <CalendarDays className="mr-3 h-7 w-7 text-primary"/>
        Historique des Pointages
      </CardTitle>
      <div className="flex space-x-2">
        {/* Le DialogTrigger est ici, il attend un Dialog parent */}
        <DialogTrigger asChild>
          <Button variant="outline" className="bg-transparent hover:bg-primary/10 border-primary text-primary" onClick={onOpenFilters}>
            <Filter className="mr-2 h-4 w-4"/> Filtrer / Trier
          </Button>
        </DialogTrigger>
        <AlertDialog>
          <AlertDialogTriggerPrimitive asChild>
            <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
              <Trash2 className="mr-2 h-4 w-4"/> Supprimer Tout
            </Button>
          </AlertDialogTriggerPrimitive>
          <AlertDialogContent className="glass-effect border-gradient">
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Cela supprimera définitivement tout l'historique des pointages de tous les employés.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={onDeleteAll} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                Oui, supprimer tout
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default AttendanceCardHeader;