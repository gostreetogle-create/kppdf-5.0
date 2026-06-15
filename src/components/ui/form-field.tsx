'use client';

import React from 'react';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  type?: string;
}

export function FormField({ label, name, type = 'text', ...props }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-[var(--foreground)] mb-1">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-colors"
        {...props}
      />
    </div>
  );
}

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  name: string;
  options: { value: string; label: string }[];
}

export function FormSelect({ label, name, options, ...props }: FormSelectProps) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-[var(--foreground)] mb-1">
        {label}
      </label>
      <select
        id={name}
        name={name}
        className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-colors"
        {...props}
      >
        <option value="">Выберите...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  name: string;
}

export function FormTextarea({ label, name, ...props }: FormTextareaProps) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-[var(--foreground)] mb-1">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-colors min-h-[80px] resize-y"
        {...props}
      />
    </div>
  );
}
