
import React from 'react';
import { AlertTriangle, X, Clock } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type AlertType = {
  id: string;
  type: 'order' | 'production' | 'packaging' | 'sales' | 'finance' | 'route';
  message: string;
  time: string;
};

type StageAlertProps = {
  alerts: AlertType[];
  onDismiss: (id: string) => void;
};

export const StageAlert = ({ alerts, onDismiss }: StageAlertProps) => {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-3 mb-4">
      {alerts.map((alert) => (
        <Alert key={alert.id} variant="destructive" className="animate-fade-in">
          <AlertTriangle className="h-4 w-4" />
          <div className="flex-1">
            <AlertTitle className="flex items-center">
              <span className={`stage-badge badge-${alert.type} mr-2`}>
                {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}
              </span>
              Alerta de Pendência
            </AlertTitle>
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between">
              <span>{alert.message}</span>
              <span className="text-xs flex items-center gap-1 mt-1 sm:mt-0">
                <Clock className="h-3 w-3" />
                {alert.time}
              </span>
            </AlertDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 ml-2" 
            onClick={() => onDismiss(alert.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      ))}
    </div>
  );
};

export default StageAlert;
