import { useState, useCallback } from 'react';
import { parseCommand, AppAction } from '../lib/claude';

const API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';

export function useCommandParser(onAction: (action: AppAction) => void) {
  const [loading, setLoading] = useState(false);
  const [lastCommand, setLastCommand] = useState('');
  const [error, setError] = useState('');

  const submit = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (!API_KEY) {
      setError('Add EXPO_PUBLIC_ANTHROPIC_API_KEY to .env');
      return;
    }
    setLoading(true);
    setError('');
    setLastCommand(trimmed);
    const result = await parseCommand(trimmed, API_KEY);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
    } else if (result.action.action === 'unknown') {
      setError(`Didn't understand: "${trimmed}"`);
    } else {
      onAction(result.action);
    }
  }, [onAction]);

  return { submit, loading, lastCommand, error };
}
