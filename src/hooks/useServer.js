import { useEffect, useState } from 'react';
import { useData } from '../context/DataContext.jsx';

// GET `path` (re-run when params change or after any store mutation) and map the response.
// `load` receives the request params and returns a promise; keep it stable via the `key` string.
export function useServer(key, load) {
  const { version } = useData();
  const [state, setState] = useState({ value: null, error: '', loading: true });

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    load()
      .then((value) => alive && setState({ value, error: '', loading: false }))
      .catch((e) => alive && setState((s) => ({ value: s.value, error: e.message, loading: false })));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, version]);

  return state;
}
