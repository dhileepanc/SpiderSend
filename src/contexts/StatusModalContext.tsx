import React, { createContext, useCallback, useContext, useState } from 'react';
import StatusModal from '../components/common/StatusModal';

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusType = 'success' | 'error';

interface StatusModalState {
  visible: boolean;
  type: StatusType;
  title?: string;
  message: string;
  iconType?: 'mail' | 'tick' | 'trash' | 'danger';
  onCloseCallback?: () => void;
}

interface StatusModalContextValue {
  showError: (message: string, title?: string, onCloseCallback?: () => void, iconType?: 'mail' | 'tick' | 'trash' | 'danger') => void;
  showSuccess: (message: string, title?: string, iconType?: 'mail' | 'tick' | 'trash' | 'danger') => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const StatusModalContext = createContext<StatusModalContextValue>({
  showError: () => {},
  showSuccess: () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export const StatusModalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<StatusModalState>({
    visible: false,
    type: 'error',
    message: '',
  });

  const showError = useCallback((message: string, title?: string, onCloseCallback?: () => void, iconType?: 'mail' | 'tick' | 'trash' | 'danger') => {
    setState({ visible: true, type: 'error', message, title, onCloseCallback, iconType });
  }, []);

  const showSuccess = useCallback((message: string, title?: string, iconType?: 'mail' | 'tick' | 'trash' | 'danger') => {
    setState({ visible: true, type: 'success', message, title, iconType });
  }, []);

  const handleClose = useCallback(() => {
    setState(prev => {
      if (prev.onCloseCallback) {
        prev.onCloseCallback();
      }
      return { ...prev, visible: false, onCloseCallback: undefined };
    });
  }, []);

  return (
    <StatusModalContext.Provider value={{ showError, showSuccess }}>
      {children}
      <StatusModal
        visible={state.visible}
        type={state.type}
        title={state.title}
        message={state.message}
        iconType={state.iconType}
        onClose={handleClose}
      />
    </StatusModalContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useStatusModal = (): StatusModalContextValue => {
  return useContext(StatusModalContext);
};

export default StatusModalContext;
