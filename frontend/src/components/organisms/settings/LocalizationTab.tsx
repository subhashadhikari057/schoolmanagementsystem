'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import Icon from '@/components/atoms/display/Icon';
import Dropdown from '@/components/molecules/interactive/Dropdown';
import { Globe, Languages, Calendar, DollarSign, Type } from 'lucide-react';

interface LocalizationTabProps {
  isEditing?: boolean;
}

export default function LocalizationTab({
  isEditing = false,
}: LocalizationTabProps) {
  const [settings, setSettings] = useState({
    defaultLanguage: 'English',
    numberFormat: '1,234.56 (US)',
    weekStartDay: 'Monday',
    rtlSupport: false,
  });

  const [supportedLanguages, setSupportedLanguages] = useState({
    english: true,
    spanish: true,
    french: true,
    german: false,
    chinese: false,
    arabic: false,
  });

  const handleSettingChange = (field: string, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleLanguageToggle = (language: string) => {
    if (!isEditing) return;
    setSupportedLanguages(prev => ({
      ...prev,
      [language]: !prev[language as keyof typeof prev],
    }));
  };

  const handleRtlToggle = () => {
    if (!isEditing) return;
    setSettings(prev => ({ ...prev, rtlSupport: !prev.rtlSupport }));
  };

  const ToggleSwitch = ({
    checked,
    onChange,
  }: {
    checked: boolean;
    onChange: () => void;
  }) => (
    <button
      onClick={onChange}
      disabled={!isEditing}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 ${
        checked ? 'bg-blue-600 shadow-lg' : 'bg-gray-200'
      } ${!isEditing ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  const languageOptions = [
    { value: 'English', label: 'English' },
    { value: 'Spanish', label: 'Spanish' },
    { value: 'French', label: 'French' },
    { value: 'German', label: 'German' },
    { value: 'Chinese', label: 'Chinese' },
    { value: 'Arabic', label: 'Arabic' },
  ];

  const weekStartOptions = [
    { value: 'Sunday', label: 'Sunday' },
    { value: 'Monday', label: 'Monday' },
  ];

  const numberFormatOptions = [
    { value: '1,234.56 (US)', label: '1,234.56 (US)' },
    { value: '1.234,56 (EU)', label: '1.234,56 (EU)' },
    { value: '1 234,56 (FR)', label: '1 234,56 (FR)' },
  ];

  const DropdownGroup = ({
    icon,
    label,
    options,
    value,
    field,
  }: {
    icon: React.ReactNode;
    label: string;
    options: { value: string; label: string }[];
    value: string;
    field: string;
  }) => (
    <div className='space-y-3'>
      <label className='text-sm font-semibold text-gray-700 flex items-center gap-2'>
        {icon}
        {label}
      </label>
      {isEditing ? (
        <Dropdown
          type='filter'
          options={options}
          selectedValue={value}
          onSelect={newValue => handleSettingChange(field, newValue)}
          placeholder={`Select ${label.toLowerCase()}`}
          className='w-full'
        />
      ) : (
        <div className='w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700'>
          {value}
        </div>
      )}
    </div>
  );

  const languageDetails = [
    {
      key: 'english',
      label: 'English',
      enabled: supportedLanguages.english,
      flag: '🇺🇸',
    },
    {
      key: 'spanish',
      label: 'Spanish',
      enabled: supportedLanguages.spanish,
      flag: '🇪🇸',
    },
    {
      key: 'french',
      label: 'French',
      enabled: supportedLanguages.french,
      flag: '🇫🇷',
    },
    {
      key: 'german',
      label: 'German',
      enabled: supportedLanguages.german,
      flag: '🇩🇪',
    },
    {
      key: 'chinese',
      label: 'Chinese',
      enabled: supportedLanguages.chinese,
      flag: '🇨🇳',
    },
    {
      key: 'arabic',
      label: 'Arabic',
      enabled: supportedLanguages.arabic,
      flag: '🇸🇦',
    },
  ];

  const enabledLanguagesCount = languageDetails.filter(
    lang => lang.enabled,
  ).length;

  return (
    <div className='space-y-8'>
      {/* Language & Regional Settings */}
      <Card className='p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow'>
        <div className='flex items-center gap-4 mb-8'>
          <div className='p-3 bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl'>
            <Globe className='h-6 w-6 text-pink-600' />
          </div>
          <div>
            <h3 className='text-xl font-bold text-gray-900'>
              Regional Settings
            </h3>
            <p className='text-gray-600 text-sm mt-1'>
              Configure language support and regional formatting preferences
            </p>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <DropdownGroup
            icon={<Languages className='h-4 w-4 text-blue-500' />}
            label='Default Language'
            options={languageOptions}
            value={settings.defaultLanguage}
            field='defaultLanguage'
          />

          <DropdownGroup
            icon={<Calendar className='h-4 w-4 text-green-500' />}
            label='Week Start Day'
            options={weekStartOptions}
            value={settings.weekStartDay}
            field='weekStartDay'
          />

          <DropdownGroup
            icon={<DollarSign className='h-4 w-4 text-purple-500' />}
            label='Number Format'
            options={numberFormatOptions}
            value={settings.numberFormat}
            field='numberFormat'
          />

          <div
            className={`flex items-center justify-between py-4 px-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 ${
              isEditing ? '' : 'opacity-75'
            }`}
          >
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-blue-100 rounded-lg'>
                <Type className='h-4 w-4 text-blue-600' />
              </div>
              <div>
                <p className='font-semibold text-gray-900 text-sm'>
                  RTL Language Support
                </p>
                <p className='text-xs text-gray-600 mt-0.5'>
                  Enable right-to-left text support for Arabic, Hebrew
                </p>
              </div>
            </div>
            <ToggleSwitch
              checked={settings.rtlSupport}
              onChange={handleRtlToggle}
            />
          </div>
        </div>
      </Card>

      {/* Language Management */}
      <Card className='p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow'>
        <div className='flex items-center justify-between mb-8'>
          <div className='flex items-center gap-4'>
            <div className='p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-xl'>
              <Languages className='h-6 w-6 text-green-600' />
            </div>
            <div>
              <h3 className='text-xl font-bold text-gray-900'>
                Supported Languages
              </h3>
              <p className='text-gray-600 text-sm mt-1'>
                Manage available languages for your school system
              </p>
            </div>
          </div>
          <div className='text-right'>
            <div className='text-2xl font-bold text-green-600'>
              {enabledLanguagesCount}
            </div>
            <div className='text-xs text-gray-500'>Enabled</div>
          </div>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {languageDetails.map(language => (
            <div
              key={language.key}
              className={`group p-4 border rounded-xl transition-all duration-200 ${
                isEditing ? 'hover:shadow-md' : ''
              } ${
                language.enabled
                  ? 'border-green-200 bg-green-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              } ${!isEditing ? 'opacity-75' : ''}`}
            >
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <span className='text-2xl'>{language.flag}</span>
                  <div>
                    <span
                      className={`font-semibold text-sm ${
                        language.enabled ? 'text-green-900' : 'text-gray-900'
                      }`}
                    >
                      {language.label}
                    </span>
                    {language.enabled && (
                      <div className='text-xs text-green-600 mt-0.5'>
                        Active
                      </div>
                    )}
                  </div>
                </div>
                <ToggleSwitch
                  checked={language.enabled}
                  onChange={() => handleLanguageToggle(language.key)}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Language Summary */}
        <div className='mt-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg'>
          <div className='flex items-start gap-3'>
            <div className='flex-shrink-0'>
              <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
                <Globe className='h-4 w-4 text-blue-600' />
              </div>
            </div>
            <div>
              <h4 className='text-sm font-semibold text-blue-900'>
                Language Configuration Summary
              </h4>
              <div className='text-xs text-blue-700 mt-1 space-y-1'>
                <p>
                  • Default Language:{' '}
                  <span className='font-medium'>
                    {settings.defaultLanguage}
                  </span>
                </p>
                <p>
                  • Enabled Languages:{' '}
                  <span className='font-medium'>
                    {enabledLanguagesCount} languages
                  </span>
                </p>
                <p>
                  • RTL Support:{' '}
                  <span className='font-medium'>
                    {settings.rtlSupport ? 'Enabled' : 'Disabled'}
                  </span>
                </p>
                <p>
                  • Number Format:{' '}
                  <span className='font-medium'>{settings.numberFormat}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
