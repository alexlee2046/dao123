// Form types and constants

export type FieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'number'
  | 'date';

export type ContactFieldMapping =
  | 'email'
  | 'first_name'
  | 'last_name'
  | 'company_name'
  | 'phone'
  | 'position'
  | 'country'
  | 'none';

export interface FormFieldOption {
  label: string;
  value: string;
}

export interface FormFieldValidation {
  pattern?: string;
  message?: string;
  min?: number;
  max?: number;
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  validation?: FormFieldValidation;
  options?: FormFieldOption[];
  mapping: ContactFieldMapping;
}

export interface FormSettings {
  theme?: {
    primaryColor?: string;
    backgroundColor?: string;
    borderRadius?: number;
  };
  submitButton?: {
    text?: string;
    loadingText?: string;
  };
  successMessage?: string;
  redirectUrl?: string | null;
  notifyEmail?: string | null;
  automationId?: string | null;
}

export interface Form {
  id: string;
  user_id: string;
  project_id?: string;
  name: string;
  description?: string;
  fields: FormField[];
  settings: FormSettings;
  status: 'draft' | 'published' | 'archived';
  submission_count: number;
  created_at: string;
  updated_at: string;
}

export interface FormSubmission {
  id: string;
  form_id: string;
  contact_id?: string;
  data: Record<string, any>;
  metadata?: {
    ip?: string;
    userAgent?: string;
    referrer?: string;
    [key: string]: any;
  };
  created_at: string;
}

// Default fields for new forms
export const DEFAULT_FORM_FIELDS: FormField[] = [
  {
    id: 'field_email',
    type: 'email',
    label: 'Email',
    placeholder: 'your@email.com',
    required: true,
    mapping: 'email',
    validation: {
      pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
      message: 'Please enter a valid email address',
    },
  },
  {
    id: 'field_name',
    type: 'text',
    label: 'Name',
    placeholder: 'Your name',
    required: false,
    mapping: 'first_name',
  },
  {
    id: 'field_company',
    type: 'text',
    label: 'Company',
    placeholder: 'Your company',
    required: false,
    mapping: 'company_name',
  },
];

// Default form settings
export const DEFAULT_FORM_SETTINGS: FormSettings = {
  theme: {
    primaryColor: '#3b82f6',
    backgroundColor: '#ffffff',
    borderRadius: 8,
  },
  submitButton: {
    text: 'Submit',
    loadingText: 'Submitting...',
  },
  successMessage: 'Thank you for your submission!',
  redirectUrl: null,
  notifyEmail: null,
  automationId: null,
};
