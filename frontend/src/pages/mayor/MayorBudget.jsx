import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Construction } from 'lucide-react';

const MayorBudget = () => {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Budget Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <Construction className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-500">Budget Monitoring module coming soon...</p>
          <p className="text-sm text-gray-400 mt-2">This feature is under development</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MayorBudget;