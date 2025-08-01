import React from 'react';
import { format, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, Users } from 'lucide-react';

const AttendanceListItem = ({ entry }) => {
  return (
    <div
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-card/60 backdrop-blur-sm rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border border-white/10"
    >
      <div className="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-0 flex-shrink-0">
        <Avatar className="h-10 w-10 border-2 border-primary/50">
          <AvatarImage src={entry.avatarUrl || undefined} alt={entry.userName} />
          <AvatarFallback className="gradient-purple text-white">
            {entry.userName?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold text-base text-foreground">{entry.userName}</h3>
          <p className="text-xs text-muted-foreground">
            Date: {entry.recordDate && isValid(entry.recordDate) ? format(entry.recordDate, 'dd MMM yyyy', { locale: fr }) : 'N/A'}
          </p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 md:space-x-4 w-full sm:w-auto mt-2 sm:mt-0">
        <div className="flex items-center space-x-1 text-xs sm:text-sm mb-1 sm:mb-0">
          <Clock className="h-4 w-4 text-green-500 flex-shrink-0" />
          <span className="text-green-400 font-medium whitespace-nowrap">Entrée:</span>
          <span className="text-foreground whitespace-nowrap">
            {entry.clockIn && isValid(entry.clockIn) ? format(entry.clockIn, 'HH:mm:ss', { locale: fr }) : 'N/A'}
          </span>
        </div>
        <div className="flex items-center space-x-1 text-xs sm:text-sm mb-1 sm:mb-0">
          <Clock className="h-4 w-4 text-red-500 flex-shrink-0" />
          <span className="text-red-400 font-medium whitespace-nowrap">Sortie:</span>
          <span className="text-foreground whitespace-nowrap">
            {entry.clockOut && isValid(entry.clockOut) ? format(entry.clockOut, 'HH:mm:ss', { locale: fr }) : 'N/A'}
          </span>
        </div>
        <div className="flex items-center space-x-1 text-xs sm:text-sm">
            <Users className="h-4 w-4 text-primary flex-shrink-0"/>
          <span className="text-primary font-medium whitespace-nowrap">Durée:</span>
          <span className="text-foreground whitespace-nowrap">{entry.duration}</span>
        </div>
      </div>
    </div>
  );
};

export default AttendanceListItem;