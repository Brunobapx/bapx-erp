
import React from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { SecuritySettingInput } from "./SecuritySettingInput";
import { Label } from "@/components/ui/label";
import { LucideIcon } from "lucide-react";

interface SecuritySetting {
  key: string;
  value: any;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  options?: string[];
}

interface SecurityCardSectionProps {
  title: string;
  Icon: LucideIcon;
  settings: SecuritySetting[];
  validationErrors: { [key: string]: string };
  onSettingChange: (key: string, value: any) => void;
}

export const SecurityCardSection: React.FC<SecurityCardSectionProps> = ({
  title,
  Icon,
  settings,
  validationErrors,
  onSettingChange,
}) => {
  if (settings.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {settings.map((setting) => (
          <div key={setting.key} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="font-medium">{setting.description}</Label>
              <p className="text-sm text-muted-foreground">{setting.key}</p>
            </div>
            <div>
              <SecuritySettingInput
                setting={setting}
                validationError={validationErrors[setting.key]}
                onChange={onSettingChange}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

