import React from 'react';
import { useTheme, THEME_PRESETS } from '../context/ThemeContext.js';
import { Modal } from './Modal.js';
import {
  Palette,
  Check,
  Sparkles,
  Sun,
  Moon,
  CheckCircle2,
  Sliders,
  Laptop
} from 'lucide-react';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({ isOpen, onClose }) => {
  const { currentPreset, setThemePreset, theme, toggleTheme } = useTheme();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Application Theme & Visual Identity"
    >
      <div className="space-y-5">
        {/* Mode & Description Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-stone-100/80 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
          <div>
            <h4 className="font-bold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-amber-500" />
              <span>10 Enterprise Hospitality Themes</span>
            </h4>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
              Click any theme to instantly recolor the entire app, buttons, sidebar, and receipts.
            </p>
          </div>

          {/* Dark / Light Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition shadow-xs bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700 shrink-0"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-500" />
                <span>Dark Mode</span>
              </>
            )}
          </button>
        </div>

        {/* 10 Theme Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
          {THEME_PRESETS.map((preset) => {
            const isActive = currentPreset.id === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => setThemePreset(preset.id)}
                className={`cursor-pointer rounded-2xl p-3.5 border-2 transition-all flex flex-col justify-between group relative overflow-hidden ${
                  isActive
                    ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-500/15 shadow-md shadow-amber-500/10'
                    : 'border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 bg-white dark:bg-stone-900'
                }`}
              >
                {/* Active indicator badge */}
                {isActive && (
                  <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-xs shadow-xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}

                <div>
                  {/* Color Swatch Circles */}
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <span
                      className="w-5 h-5 rounded-full shadow-xs border border-white/20"
                      style={{ backgroundColor: preset.primaryColor }}
                      title={`Primary: ${preset.primaryColor}`}
                    />
                    <span
                      className="w-4 h-4 rounded-full shadow-xs border border-white/20"
                      style={{ backgroundColor: preset.accentColor }}
                      title={`Accent: ${preset.accentColor}`}
                    />
                    <span
                      className="w-3.5 h-3.5 rounded-full shadow-xs border border-white/20"
                      style={{ backgroundColor: preset.secondaryColor }}
                      title={`Secondary: ${preset.secondaryColor}`}
                    />
                    <div
                      className={`h-1.5 flex-1 rounded-full bg-gradient-to-r ${preset.previewGradient} ml-1`}
                    />
                  </div>

                  <h5 className="font-bold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                    <span>{preset.name}</span>
                  </h5>
                  <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                    {preset.tagline}
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">
                    {preset.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-[10px]">
                  <span className="font-mono text-stone-400 uppercase tracking-wider">
                    {preset.primaryColor}
                  </span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-md ${
                      isActive
                        ? 'bg-amber-500 text-stone-950'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-stone-200'
                    }`}
                  >
                    {isActive ? 'Active Theme' : 'Apply Theme'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="pt-2 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold text-xs shadow-md transition hover:opacity-90"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
};
