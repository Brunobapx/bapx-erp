
export interface SanitizationOptions {
  allowHtml?: boolean;
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
  maxLength?: number;
  preserveFormatting?: boolean;
}
