import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Package, ShoppingCart, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../../shared/api/apiClient';

interface SearchResult {
  type: 'product' | 'sale' | 'purchase';
  id: string;
  label: string;
  sublabel?: string;
  path: string;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await apiClient.get<SearchResult[]>(`/search?q=${encodeURIComponent(query.trim())}`);
        setResults(Array.isArray(data) ? data : []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  function handleSelect(result: SearchResult) {
    navigate(result.path);
    setOpen(false);
    setQuery('');
    setResults([]);
  }

  function getIcon(type: SearchResult['type']) {
    if (type === 'product') return <Package size={14} className="text-blue-500" />;
    if (type === 'sale') return <ShoppingCart size={14} className="text-green-500" />;
    return <FileText size={14} className="text-purple-500" />;
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Cari"
        className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white/50 text-slate-600 hover:bg-slate-50 transition active:scale-95"
      >
        <Search size={18} />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => { setOpen(false); setQuery(''); setResults([]); }}
          />
          <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
              <Search size={16} className="text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari produk, transaksi..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
              {query && (
                <button onClick={() => { setQuery(''); setResults([]); }} className="text-slate-400 hover:text-slate-600">
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto py-1">
              {loading && (
                <p className="px-4 py-3 text-xs text-slate-400">Mencari...</p>
              )}
              {!loading && query.length >= 2 && results.length === 0 && (
                <p className="px-4 py-3 text-xs text-slate-400">Tidak ada hasil untuk &ldquo;{query}&rdquo;</p>
              )}
              {!loading && query.length < 2 && (
                <p className="px-4 py-3 text-xs text-slate-400">Ketik minimal 2 karakter untuk mencari</p>
              )}
              {results.map((r) => (
                <button
                  key={`${r.type}-${r.id}`}
                  type="button"
                  onClick={() => handleSelect(r)}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-slate-50 transition"
                >
                  <span className="shrink-0">{getIcon(r.type)}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-800">{r.label}</span>
                    {r.sublabel && <span className="block truncate text-xs text-slate-400">{r.sublabel}</span>}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
