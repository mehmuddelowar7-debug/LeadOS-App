import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function DebugView() {
  const [state, setState] = useState({
    reactVersion: React.version,
    viteMode: import.meta.env.MODE,
    baseUrl: import.meta.env.BASE_URL,
    url: window.location.href,
    pathname: window.location.pathname,
    hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
    hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    hasRoot: !!document.getElementById('root'),
    userAgent: navigator.userAgent,
    isOnline: navigator.onLine,
    swRegistered: 'Checking...',
    swScriptUrl: 'None',
    hasIndexedDB: !!window.indexedDB,
    hasLocalStorage: !!window.localStorage,
    supabaseTest: 'Not run',
  });

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        if (regs.length > 0) {
          setState(s => ({ 
            ...s, 
            swRegistered: 'Yes', 
            swScriptUrl: regs[0].active?.scriptURL || 'Unknown' 
          }));
        } else {
          setState(s => ({ ...s, swRegistered: 'No', swScriptUrl: 'None' }));
        }
      }).catch(err => {
        setState(s => ({ ...s, swRegistered: `Error: ${err.message}` }));
      });
    } else {
      setState(s => ({ ...s, swRegistered: 'Unsupported' }));
    }
  }, []);

  const unregisterSW = async () => {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (let reg of regs) {
        await reg.unregister();
      }
      alert('Service workers unregistered');
      window.location.reload();
    }
  };

  const clearCacheStorage = async () => {
    if ('caches' in window) {
      const keys = await caches.keys();
      for (let key of keys) {
        await caches.delete(key);
      }
      alert('Cache storage cleared');
    }
  };

  const clearIndexedDB = async () => {
    const dbs = await window.indexedDB.databases?.();
    if (dbs) {
      for (let db of dbs) {
        if (db.name) window.indexedDB.deleteDatabase(db.name);
      }
      alert('IndexedDB cleared');
    } else {
      // Fallback for older browsers
      window.indexedDB.deleteDatabase('leados_query_cache');
      alert('Known IndexedDB cleared');
    }
  };

  const testSupabase = async () => {
    setState(s => ({ ...s, supabaseTest: 'Testing...' }));
    try {
      const { error } = await supabase.from('workspaces').select('id').limit(1);
      if (error) throw error;
      setState(s => ({ ...s, supabaseTest: 'OK' }));
    } catch (e: any) {
      setState(s => ({ ...s, supabaseTest: `Failed: ${e.message}` }));
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', color: 'white', background: 'black', minHeight: '100vh', width: '100vw', boxSizing: 'border-box', overflowY: 'auto' }}>
      <h1 style={{ color: '#4ade80' }}>LeadOS Production Diagnostics</h1>
      
      <table style={{ width: '100%', textAlign: 'left', marginBottom: '20px', borderCollapse: 'collapse' }}>
        <tbody>
          {Object.entries(state).map(([key, value]) => (
            <tr key={key} style={{ borderBottom: '1px solid #333' }}>
              <th style={{ padding: '8px', color: '#a1a1aa' }}>{key}</th>
              <td style={{ padding: '8px', wordBreak: 'break-all' }}>{String(value)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        <button onClick={() => alert('React Render OK!')} style={btnStyle}>Test React render</button>
        <button onClick={() => window.location.href = '/'} style={btnStyle}>Test Router (Go Home)</button>
        <button onClick={testSupabase} style={btnStyle}>Test Supabase connection</button>
        <button onClick={unregisterSW} style={{...btnStyle, border: '1px solid #ef4444', color: '#ef4444'}}>Unregister Service Worker</button>
        <button onClick={clearCacheStorage} style={{...btnStyle, border: '1px solid #ef4444', color: '#ef4444'}}>Clear Cache Storage</button>
        <button onClick={clearIndexedDB} style={{...btnStyle, border: '1px solid #ef4444', color: '#ef4444'}}>Clear IndexedDB</button>
        <button onClick={() => window.location.reload()} style={btnStyle}>Reload Page</button>
      </div>
    </div>
  );
}

const btnStyle = {
  padding: '10px 15px',
  background: 'transparent',
  color: 'white',
  border: '1px solid #555',
  borderRadius: '4px',
  cursor: 'pointer',
  fontFamily: 'monospace'
};
