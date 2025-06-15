
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SecuritySetting {
  key: string;
  value: any;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  options?: string[];
}

interface SecuritySettingInputProps {
  setting: SecuritySetting;
  validationError?: string;
  onChange: (key: string, value: any) => void;
}

export const SecuritySettingInput: React.FC<SecuritySettingInputProps> = ({
  setting,
  validationError,
  onChange,
}) => {
  switch (setting.type) {
    case 'boolean':
      return (
        <Switch
          checked={setting.value}
          onCheckedChange={(checked) => onChange(setting.key, checked)}
        />
      );
    case 'number':
      return (
        <div className="space-y-1">
          <Input
            type="number"
            value={setting.value}
            onChange={(e) => onChange(setting.key, parseInt(e.target.value) || 0)}
            className={`w-32 ${validationError ? 'border-red-500' : ''}`}
          />
          {validationError && (
            <p className="text-xs text-red-500">{validationError}</p>
          )}
        </div>
      );
    case 'select':
      return (
        <Select value={setting.value} onValueChange={(value) => onChange(setting.key, value)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {setting.options?.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    default:
      return (
        <Input
          value={setting.value}
          onChange={(e) => onChange(setting.key, e.target.value)}
          className="w-64"
        />
      );
  }
};
