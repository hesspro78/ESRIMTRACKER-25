import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import AttendanceListItem from '@/components/admin/attendance/AttendanceListItem';

const AttendanceList = ({ entries, loading }) => {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        Aucun pointage correspondant aux filtres pour le moment.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <motion.div
          key={entry.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <AttendanceListItem entry={entry} />
        </motion.div>
      ))}
    </div>
  );
};

export default AttendanceList;