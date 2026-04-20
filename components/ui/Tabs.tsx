'use client';

import React, { useState } from 'react';

export interface Tab {
  label: string;
  value: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  badge?: number | string;
}

export interface TabsProps {
  tabs: Tab[];
  defaultValue?: string;
  onChange?: (value: string) => void;
  children: React.ReactNode;
  variant?: 'line' | 'pills';
}

export default function Tabs({ tabs, defaultValue, onChange, children, variant = 'line' }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue || tabs[0]?.value);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    onChange?.(value);
  };

  return (
    <div className="w-full">
      {/* Tab Headers */}
      <div className={`flex gap-2 ${variant === 'line' ? 'border-b border-neutral-200' : ''}`}>
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => !tab.disabled && handleTabChange(tab.value)}
            disabled={tab.disabled}
            className={`
              flex items-center gap-2 px-4 py-2.5 font-medium text-sm
              transition-colors relative
              ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${variant === 'line' 
                ? activeTab === tab.value
                  ? 'text-accent-500 border-b-2 border-accent-500'
                  : 'text-neutral-600 hover:text-neutral-900'
                : activeTab === tab.value
                  ? 'bg-accent-100 text-accent-700 rounded-lg'
                  : 'text-neutral-600 hover:bg-neutral-100 rounded-lg'
              }
            `}
          >
            {tab.icon && <span className="text-lg">{tab.icon}</span>}
            {tab.label}
            {tab.badge !== undefined && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-error-500 text-white rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {React.Children.map(children, (child) => {
          if (React.isValidElement<{ value: string }>(child) && child.props.value === activeTab) {
            return child;
          }
          return null;
        })}
      </div>
    </div>
  );
}

export function TabPanel({ children, value }: { children: React.ReactNode; value: string }) {
  return <div className="animate-fade-in">{children}</div>;
}
