
import { useState, useCallback } from 'react';

interface FormField {
  value: string;
  error?: string;
  touched: boolean;
}

interface UseAccessibleFormProps {
  initialValues: Record<string, string>;
  validationRules?: Record<string, (value: string) => string | undefined>;
  onSubmit: (values: Record<string, string>) => Promise<void> | void;
}

export const useAccessibleForm = ({
  initialValues,
  validationRules = {},
  onSubmit
}: UseAccessibleFormProps) => {
  const [fields, setFields] = useState<Record<string, FormField>>(() => {
    const initial: Record<string, FormField> = {};
    Object.keys(initialValues).forEach(key => {
      initial[key] = {
        value: initialValues[key],
        touched: false
      };
    });
    return initial;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const setFieldValue = useCallback((fieldName: string, value: string) => {
    setFields(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        value,
        touched: true,
        error: validationRules[fieldName]?.(value)
      }
    }));
  }, [validationRules]);

  const setFieldTouched = useCallback((fieldName: string) => {
    setFields(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        touched: true,
        error: validationRules[fieldName]?.(prev[fieldName].value)
      }
    }));
  }, [validationRules]);

  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};
    let hasErrors = false;

    Object.keys(fields).forEach(fieldName => {
      const error = validationRules[fieldName]?.(fields[fieldName].value);
      if (error) {
        errors[fieldName] = error;
        hasErrors = true;
      }
    });

    setFields(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(fieldName => {
        updated[fieldName] = {
          ...updated[fieldName],
          touched: true,
          error: errors[fieldName]
        };
      });
      return updated;
    });

    return !hasErrors;
  }, [fields, validationRules]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!validateForm()) {
      // Focar no primeiro campo com erro para acessibilidade
      const firstErrorField = Object.keys(fields).find(
        fieldName => fields[fieldName].error
      );
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField);
        element?.focus();
      }
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const values: Record<string, string> = {};
      Object.keys(fields).forEach(key => {
        values[key] = fields[key].value;
      });
      
      await onSubmit(values);
    } catch (error: any) {
      setSubmitError(error.message || 'Erro ao enviar formulário');
    } finally {
      setIsSubmitting(false);
    }
  }, [fields, validateForm, onSubmit]);

  const resetForm = useCallback(() => {
    setFields(() => {
      const reset: Record<string, FormField> = {};
      Object.keys(initialValues).forEach(key => {
        reset[key] = {
          value: initialValues[key],
          touched: false
        };
      });
      return reset;
    });
    setSubmitError(null);
  }, [initialValues]);

  const getFieldProps = useCallback((fieldName: string) => ({
    id: fieldName,
    name: fieldName,
    value: fields[fieldName]?.value || '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
      setFieldValue(fieldName, e.target.value),
    onBlur: () => setFieldTouched(fieldName),
    'aria-invalid': fields[fieldName]?.error ? 'true' : 'false',
    'aria-describedby': fields[fieldName]?.error ? `${fieldName}-error` : undefined,
  }), [fields, setFieldValue, setFieldTouched]);

  const getFieldError = useCallback((fieldName: string) => {
    const field = fields[fieldName];
    return field?.touched ? field.error : undefined;
  }, [fields]);

  return {
    fields,
    isSubmitting,
    submitError,
    setFieldValue,
    setFieldTouched,
    handleSubmit,
    resetForm,
    getFieldProps,
    getFieldError,
    validateForm,
  };
};
