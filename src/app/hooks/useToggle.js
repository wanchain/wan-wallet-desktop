
import { useReducer } from 'react';

const useToggle = (initialValue = false) => {
  return useReducer((state) => !state, initialValue);
}

export default useToggle;
