
import { useState } from 'react';

export const useOrderFormUI = () => {
  // UI states for controlling the open/closed state of components
  const [openClientCombobox, setOpenClientCombobox] = useState(false);
  const [openProductCombobox, setOpenProductCombobox] = useState<Record<string, boolean>>({});
  const [openCalendar, setOpenCalendar] = useState(false);
  
  // Reset all popover states
  const resetUIStates = () => {
    setOpenClientCombobox(false);
    setOpenProductCombobox({});
    setOpenCalendar(false);
  };
  
  // Handler to close all other popovers when one is opened
  const handleOpenClientCombobox = (open: boolean) => {
    if (open) {
      setOpenProductCombobox({});
      setOpenCalendar(false);
    }
    setOpenClientCombobox(open);
  };
  
  const handleOpenProductCombobox = (itemId: string, open: boolean) => {
    if (open) {
      setOpenClientCombobox(false);
      setOpenCalendar(false);
      // Close other product comboboxes
      setOpenProductCombobox({ [itemId]: true });
    } else {
      setOpenProductCombobox(prev => {
        const newState = { ...prev };
        delete newState[itemId];
        return newState;
      });
    }
  };
  
  const handleOpenCalendar = (open: boolean) => {
    if (open) {
      setOpenClientCombobox(false);
      setOpenProductCombobox({});
    }
    setOpenCalendar(open);
  };
  
  return {
    openClientCombobox,
    setOpenClientCombobox: handleOpenClientCombobox,
    openProductCombobox,
    setOpenProductCombobox: handleOpenProductCombobox,
    openCalendar,
    setOpenCalendar: handleOpenCalendar,
    resetUIStates
  };
};
