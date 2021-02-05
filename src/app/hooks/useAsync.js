import { useState, useCallback, useEffect } from 'react';
import { wandWrapper } from 'utils/support';

const useAsync = (func, initValue = null, immediate = true, options = {}) => {
  const [status, setStatus] = useState('idle');
  const [value, setValue] = useState(initValue);
  const [error, setError] = useState(null);

  const execute = useCallback(executeParams => {
    let asyncFunction = typeof func === 'string' ? wandWrapper.bind(this, func) : func;
    setStatus('pending');
    setValue(initValue);
    setError(null);
    return asyncFunction(executeParams || options)
      .then(response => {
        setValue(response);
        setStatus('success');
      })
      .catch(error => {
        console.log('useAsyncError', error)
        setError(error);
        setStatus('error');
      });
  }, [func]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { execute, status, value, error };
};

export default useAsync;
