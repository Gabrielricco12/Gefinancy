import { createContext, useContext, useState } from 'react';
import { addMonths, subMonths } from 'date-fns';

const DateContext = createContext();

export const useDate = () => useContext(DateContext);

export const DateProvider = ({ children }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [direction, setDirection] = useState(0); // Para animação (1 = direita, -1 = esquerda)
  const [page, setPage] = useState(0); // Índice para o Framer Motion saber que mudou

  const nextMonth = () => {
    setDirection(1);
    setPage((p) => p + 1);
    setCurrentDate((prev) => addMonths(prev, 1));
  };

  const prevMonth = () => {
    setDirection(-1);
    setPage((p) => p - 1);
    setCurrentDate((prev) => subMonths(prev, 1));
  };

  const goToToday = () => {
    setDirection(currentDate < new Date() ? 1 : -1);
    setPage((p) => p + 1);
    setCurrentDate(new Date());
  };

  return (
    <DateContext.Provider value={{ 
      currentDate, 
      direction, 
      page, 
      nextMonth, 
      prevMonth, 
      goToToday 
    }}>
      {children}
    </DateContext.Provider>
  );
};