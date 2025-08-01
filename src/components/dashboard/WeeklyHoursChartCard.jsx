import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const WeeklyHoursChartCard = ({ weeklyData }) => {
  return (
    <Card className="glass-effect border-gradient">
      <CardHeader>
        <CardTitle className="text-xl text-foreground">Heures Hebdomadaires</CardTitle>
        <CardDescription>
          Votre activité des 7 derniers jours
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="day" 
                stroke="rgba(255,255,255,0.7)"
                fontSize={12}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.7)"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(30, 30, 50, 0.8)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  borderRadius: '8px',
                  color: '#e0e0e0'
                }}
                labelStyle={{ color: '#a855f7', fontWeight: 'bold' }}
              />
              <Bar 
                dataKey="hours" 
                fill="url(#chartGradient)"
                radius={[4, 4, 0, 0]}
              />
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.5}/>
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyHoursChartCard;