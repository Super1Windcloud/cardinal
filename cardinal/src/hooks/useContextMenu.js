import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

export function useContextMenu() {
  const [contextMenu, setContextMenu] = useState({ 
    visible: false, 
    x: 0, 
    y: 0, 
    path: null 
  });

  const showContextMenu = useCallback((e, path) => {
    setContextMenu({ 
      visible: true, 
      x: e.clientX, 
      y: e.clientY, 
      path 
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, []);

  const menuItems = [
    {
      label: 'Open in Finder',
      action: () => invoke('open_in_finder', { path: contextMenu.path }),
    },
  ];

  return {
    contextMenu,
    showContextMenu,
    closeContextMenu,
    menuItems
  };
}
