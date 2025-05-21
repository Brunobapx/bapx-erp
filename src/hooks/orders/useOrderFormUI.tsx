
import { useState } from 'react';

export const useOrderFormUI = () => {
  // UI states for controlling the open/closed state of components
  const [openClientCombobox, setOpenClientCombobox] = useState(false);
  const [openProductCombobox, setOpenProductCombobox] = useState(false);
  const [openCalendar, setOpenCalendar] = useState(false);
  
  // Reset all popover states
  const resetUIStates = () => {
    setOpenClientCombobox(false);
    setOpenProductCombobox(false);
    setOpenCalendar(false);
  };
  
  // Handler to close all other popovers when one is opened
  const handleOpenClientCombobox = (open: boolean) => {
    if (open) {
      setOpenProductCombobox(false);
      setOpenCalendar(false);
    }
    setOpenClientCombobox(open);
  };
  
  const handleOpenProductCombobox = (open: boolean) => {
    if (open) {
      setOpenClientCombobox(false);
      setOpenCalendar(false);
    }
    setOpenProductCombobox(open);
  };
  
  const handleOpenCalendar = (open: boolean) => {
    if (open) {
      setOpenClientCombobox(false);
      setOpenProductCombobox(false);
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
