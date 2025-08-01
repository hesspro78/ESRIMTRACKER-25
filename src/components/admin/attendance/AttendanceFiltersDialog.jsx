import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Label } from "@/components/ui/label";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

const AttendanceFiltersDialog = ({
  open,
  onOpenChange,
  employees,
  filters,
  onFiltersChange,
  onApplyFilters,
}) => {

  const handleDatePreset = (preset) => {
    const today = new Date();
    let newStart, newEnd;
    switch (preset) {
      case 'today':
        newStart = today;
        newEnd = today;
        break;
      case 'yesterday':
        const yesterday = subDays(today, 1);
        newStart = yesterday;
        newEnd = yesterday;
        break;
      case 'last7days':
        newStart = subDays(today, 6);
        newEnd = today;
        break;
      case 'thisMonth':
        newStart = startOfMonth(today);
        newEnd = endOfMonth(today);
        break;
      case 'lastMonth':
        const lastMonthStart = startOfMonth(subDays(today, today.getDate())); 
        newStart = lastMonthStart;
        newEnd = endOfMonth(lastMonthStart);
        break;
      default:
        return;
    }
    onFiltersChange('startDate', format(newStart, 'yyyy-MM-dd'));
    onFiltersChange('endDate', format(newEnd, 'yyyy-MM-dd'));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px] glass-effect border-gradient">
        <DialogHeader>
          <DialogTitle>Filtres et Tri</DialogTitle>
          <DialogDescription>
            Affinez votre recherche d'historique de pointages.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="employeeSelect" className="text-right">Employé</Label>
            <Select value={filters.selectedEmployee} onValueChange={(value) => onFiltersChange('selectedEmployee', value)}>
              <SelectTrigger id="employeeSelect" className="col-span-3">
                <SelectValue placeholder="Sélectionner employé" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les employés</SelectItem>
                {employees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>{emp.full_name || emp.username}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="startDate" className="text-right">Début</Label>
            <Input id="startDate" type="date" value={filters.startDate} onChange={e => onFiltersChange('startDate', e.target.value)} className="col-span-3"/>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="endDate" className="text-right">Fin</Label>
            <Input id="endDate" type="date" value={filters.endDate} onChange={e => onFiltersChange('endDate', e.target.value)} className="col-span-3"/>
          </div>
            <div className="flex flex-wrap gap-2 mt-2 col-start-2 col-span-3">
              <Button size="sm" variant="outline" onClick={() => handleDatePreset('today')}>Aujourd'hui</Button>
              <Button size="sm" variant="outline" onClick={() => handleDatePreset('yesterday')}>Hier</Button>
              <Button size="sm" variant="outline" onClick={() => handleDatePreset('last7days')}>7 derniers jours</Button>
              <Button size="sm" variant="outline" onClick={() => handleDatePreset('thisMonth')}>Ce mois-ci</Button>
              <Button size="sm" variant="outline" onClick={() => handleDatePreset('lastMonth')}>Mois dernier</Button>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="searchTerm" className="text-right">Recherche</Label>
            <Input id="searchTerm" placeholder="Nom employé..." value={filters.searchTerm} onChange={e => onFiltersChange('searchTerm', e.target.value)} className="col-span-3"/>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sortOrder" className="text-right">Trier par</Label>
            <Select value={filters.sortOrder} onValueChange={(value) => onFiltersChange('sortOrder', value)}>
              <SelectTrigger id="sortOrder" className="col-span-3">
                <SelectValue placeholder="Ordre de tri" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Plus récent d'abord</SelectItem>
                <SelectItem value="asc">Plus ancien d'abord</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button onClick={onApplyFilters} className="gradient-purple">Appliquer</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AttendanceFiltersDialog;