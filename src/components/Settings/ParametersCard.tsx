
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

interface ParametersCardProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

const ParametersCard = ({ title, children, icon = <Settings className="h-5 w-5" /> }: ParametersCardProps) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          {icon}
          <span className="ml-2">{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
};

export default ParametersCard;
