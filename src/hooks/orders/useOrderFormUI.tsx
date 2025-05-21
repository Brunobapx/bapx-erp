
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
  
  return {
    openClientCombobox,
    setOpenClientCombobox,
    openProductCombobox,
    setOpenProductCombobox,
    openCalendar,
    setOpenCalendar,
    resetUIStates
  };
};
