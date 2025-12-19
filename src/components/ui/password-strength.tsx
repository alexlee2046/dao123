'use client';

import { useMemo } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordStrengthProps {
  password: string;
  labels?: {
    veryWeak?: string;
    weak?: string;
    fair?: string;
    strong?: string;
    veryStrong?: string;
  };
  requirements?: {
    minLength?: string;
    hasUppercase?: string;
    hasLowercase?: string;
    hasNumber?: string;
    hasSpecial?: string;
  };
  showRequirements?: boolean;
  className?: string;
}

interface Requirement {
  key: string;
  label: string;
  met: boolean;
}

export function PasswordStrength({
  password,
  labels = {},
  requirements = {},
  showRequirements = true,
  className,
}: PasswordStrengthProps) {
  const {
    veryWeak = 'Very weak',
    weak = 'Weak',
    fair = 'Fair',
    strong = 'Strong',
    veryStrong = 'Very strong',
  } = labels;

  const {
    minLength = 'At least 8 characters',
    hasUppercase = 'Contains uppercase letter',
    hasLowercase = 'Contains lowercase letter',
    hasNumber = 'Contains number',
    hasSpecial = 'Contains special character',
  } = requirements;

  const analysis = useMemo(() => {
    const checks: Requirement[] = [
      { key: 'minLength', label: minLength, met: password.length >= 8 },
      { key: 'hasUppercase', label: hasUppercase, met: /[A-Z]/.test(password) },
      { key: 'hasLowercase', label: hasLowercase, met: /[a-z]/.test(password) },
      { key: 'hasNumber', label: hasNumber, met: /[0-9]/.test(password) },
      { key: 'hasSpecial', label: hasSpecial, met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
    ];

    const metCount = checks.filter((c) => c.met).length;

    let strength: number;
    let label: string;
    let color: string;

    if (password.length === 0) {
      strength = 0;
      label = '';
      color = 'bg-muted';
    } else if (metCount <= 1) {
      strength = 1;
      label = veryWeak;
      color = 'bg-destructive';
    } else if (metCount === 2) {
      strength = 2;
      label = weak;
      color = 'bg-orange-500';
    } else if (metCount === 3) {
      strength = 3;
      label = fair;
      color = 'bg-yellow-500';
    } else if (metCount === 4) {
      strength = 4;
      label = strong;
      color = 'bg-green-500';
    } else {
      strength = 5;
      label = veryStrong;
      color = 'bg-green-600';
    }

    return { checks, strength, label, color };
  }, [password, minLength, hasUppercase, hasLowercase, hasNumber, hasSpecial, veryWeak, weak, fair, strong, veryStrong]);

  if (!password) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors',
                analysis.strength >= level ? analysis.color : 'bg-muted'
              )}
            />
          ))}
        </div>
        {analysis.label && (
          <p className={cn(
            'text-xs font-medium',
            analysis.strength <= 2 ? 'text-destructive' :
            analysis.strength === 3 ? 'text-yellow-600 dark:text-yellow-400' :
            'text-green-600 dark:text-green-400'
          )}>
            {analysis.label}
          </p>
        )}
      </div>

      {/* Requirements Checklist */}
      {showRequirements && (
        <ul className="space-y-1">
          {analysis.checks.map((req) => (
            <li
              key={req.key}
              className={cn(
                'flex items-center gap-2 text-xs',
                req.met ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
              )}
            >
              {req.met ? (
                <Check className="h-3 w-3" />
              ) : (
                <X className="h-3 w-3" />
              )}
              {req.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
