import React from 'react';
import { validatePassword } from '../utils/validation';
import { Check, X } from 'lucide-react';

interface Props {
  password: string;
}

export const PasswordRequirements: React.FC<Props> = ({ password }) => {
  const result = validatePassword(password);

  const items = [
    { label: 'More than 8 characters', met: result.hasLength },
    { label: 'At least one uppercase letter (A-Z)', met: result.hasUpper },
    { label: 'At least one lowercase letter (a-z)', met: result.hasLower },
    { label: 'At least one special character (!@#$%...)', met: result.hasSpecial },
  ];

  if (!password) {
    return (
      <div className="mt-2 text-xs text-slate-500 space-y-1">
        <p className="font-medium text-slate-600">Password requirements:</p>
        <ul className="list-disc list-inside space-y-0.5">
          {items.map((i, idx) => (
            <li key={idx}>{i.label}</li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="mt-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
      <p className="font-medium text-slate-700">Password Requirements:</p>
      <div className="grid grid-cols-1 gap-1">
        {items.map((item, idx) => (
          <div
            key={idx}
            className={`flex items-center space-x-1.5 ${
              item.met ? 'text-emerald-700 font-medium' : 'text-slate-500'
            }`}
          >
            {item.met ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

