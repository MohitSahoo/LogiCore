import { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function Home() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLocation('/dashboard');
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
