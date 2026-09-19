import { useState } from 'react';

export const useAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  return { alerts };
};
