import React from 'react';
import type { ChangeEvent } from 'react';

type SearchBarProps = {
  inputRef: React.RefObject<HTMLInputElement | null>;
  value: string;
  placeholder: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  caseSensitive: boolean;
  useRegex: boolean;
  onToggleCaseSensitive: (event: ChangeEvent<HTMLInputElement>) => void;
  onToggleRegex: (event: ChangeEvent<HTMLInputElement>) => void;
  caseSensitiveLabel: string;
  regexLabel: string;
};

export function SearchBar({
  inputRef,
  value,
  placeholder,
  onChange,
  caseSensitive,
  useRegex,
  onToggleCaseSensitive,
  onToggleRegex,
  caseSensitiveLabel,
  regexLabel,
}: SearchBarProps): React.JSX.Element {
  return (
    <div className="search-container">
      <div className="search-bar">
        <input
          id="search-input"
          ref={inputRef}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          spellCheck={false}
          autoCorrect="off"
          autoComplete="off"
          autoCapitalize="off"
        />
        <div className="search-options">
          <label className="search-option" title={caseSensitiveLabel}>
            <input
              type="checkbox"
              checked={caseSensitive}
              onChange={onToggleCaseSensitive}
              aria-label={caseSensitiveLabel}
            />
            <span className="search-option__display" aria-hidden="true">
              Aa
            </span>
            <span className="sr-only">{caseSensitiveLabel}</span>
          </label>
          <label className="search-option" title={regexLabel}>
            <input
              type="checkbox"
              checked={useRegex}
              onChange={onToggleRegex}
              aria-label={regexLabel}
            />
            <span className="search-option__display" aria-hidden="true">
              .*
            </span>
            <span className="sr-only">{regexLabel}</span>
          </label>
        </div>
      </div>
    </div>
  );
}
