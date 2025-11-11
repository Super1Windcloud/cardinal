import React from 'react';

type PermissionOverlayProps = {
  title: string;
  description: string;
  steps: string[];
  statusMessage: string | null;
  onRequestPermission: () => void;
  disabled: boolean;
  actionLabel: string;
};

export function PermissionOverlay({
  title,
  description,
  steps,
  statusMessage,
  onRequestPermission,
  disabled,
  actionLabel,
}: PermissionOverlayProps): React.JSX.Element {
  return (
    <div className="permission-overlay">
      <div className="permission-card" role="dialog" aria-modal="true">
        <h1>{title}</h1>
        <p>{description}</p>
        <ol>
          {steps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
        <p className="permission-status" role="status" aria-live="polite">
          {statusMessage}
        </p>
        <div className="permission-actions">
          <button type="button" onClick={onRequestPermission} disabled={disabled}>
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
