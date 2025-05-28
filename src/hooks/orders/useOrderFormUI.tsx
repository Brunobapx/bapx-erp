
import { useState } from 'react';

export const useOrderFormUI = () => {
  const [openClientCombobox, setOpenClientCombobox] = useState(false);
  const [openProductCombobox, setOpenProductCombobox] = useState<Record<string, boolean>>({});
  const [openCalendar, setOpenCalendar] = useState(false);

  const setOpenProductComboboxForItem = (itemId: string, open: boolean) => {
    setOpenProductCombobox(prev => ({
      ...prev,
      [itemId]: open
    }));
  };

  return {
    openClientCombobox,
    setOpenClientCombobox,
    openProductCombobox,
    setOpenProductCombobox: setOpenProductComboboxForItem,
    openCalendar,
    setOpenCalendar
  };
};
