import React, { useRef, useState } from 'react';
import { apiClient } from '@/shared/lib/api/apiClient';

const TABS = [
  { id: 'search', label: '🔍 Buscar' },
  { id: 'url', label: '🔗 URL' },
  { id: 'upload', label: '📁 Subir' },
];

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ImagePicker = ({ value, onChange }) => {
  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const params = new URLSearchParams({
        action: 'query',
        generator: 'search',
        gsrsearch: searchQuery,
        gsrnamespace: '6',
        gsrlimit: '9',
        prop: 'imageinfo',
        iiprop: 'url',
        iiurlwidth: '300',
        format: 'json',
        origin: '*',
      });
      const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`);
      const data = await res.json();
      const pages = data?.query?.pages ?? {};
      const results = Object.values(pages)
        .map((page) => {
          const info = page.imageinfo?.[0];
          return { title: page.title, thumb: info?.thumburl, full: info?.url };
        })
        .filter((r) => r.thumb && !/\.svg$/i.test(r.full) && !/Icon/i.test(r.title));
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');

    if (file.size > MAX_FILE_SIZE) {
      setUploadError('El archivo supera el límite de 5MB.');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const response = await apiClient.post('/atraccion/upload', {
          base64: evt.target.result,
          filename: file.name,
        });
        onChange(response.url);
      } catch {
        setUploadError('Error al subir la imagen. Intentá de nuevo.');
      } finally {
        setIsUploading(false);
      }
    };
    reader.onerror = () => {
      setUploadError('Error al leer el archivo.');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col gap-2">
      {value && (
        <div className="relative">
          <img
            src={value}
            alt="Preview"
            className="w-full h-36 object-cover rounded-lg border border-outline-variant"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        </div>
      )}

      <div className="flex gap-1 border-b border-outline-variant">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'search' && (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] text-outline">Tip: buscá en inglés para más resultados</p>
          <div className="flex gap-2">
            <input
              className="flex-1 px-3 py-1.5 text-sm border border-outline rounded bg-surface"
              type="text"
              placeholder="ej. Montevideo cathedral"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }}
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={isSearching}
              className="px-3 py-1.5 text-sm bg-primary text-on-primary rounded disabled:opacity-60"
            >
              {isSearching ? '...' : 'Buscar'}
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto">
              {searchResults.map((result) => (
                <button
                  key={result.title}
                  type="button"
                  onClick={() => onChange(result.full)}
                  className={`rounded overflow-hidden border-2 transition-colors ${
                    value === result.full ? 'border-primary' : 'border-transparent hover:border-outline'
                  }`}
                >
                  <img
                    src={result.thumb}
                    alt={result.title}
                    className="w-full h-[70px] object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'url' && (
        <div className="flex gap-2">
          <input
            className="flex-1 px-3 py-1.5 text-sm border border-outline rounded bg-surface"
            type="url"
            placeholder="https://..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
          />
          <button
            type="button"
            onClick={() => onChange(urlInput)}
            disabled={!urlInput.trim()}
            className="px-3 py-1.5 text-sm bg-primary text-on-primary rounded disabled:opacity-60"
          >
            OK
          </button>
        </div>
      )}

      {activeTab === 'upload' && (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full py-3 border-2 border-dashed border-outline-variant rounded-lg text-sm text-on-surface-variant hover:border-primary hover:text-primary transition-colors disabled:opacity-60"
          >
            {isUploading ? 'Subiendo...' : '📁 Elegir imagen (máx. 5MB)'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          {uploadError && <p className="text-xs text-error">{uploadError}</p>}
        </div>
      )}
    </div>
  );
};

export default ImagePicker;
