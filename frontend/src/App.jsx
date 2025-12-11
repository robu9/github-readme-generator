import React, { useEffect, useState } from 'react';
import { startOAuth, listRepos, generateReadme } from './api';
import { marked } from 'marked';

function LoginButton() {
  return (
    <button className="gh-btn" onClick={() => startOAuth()}>
      <img
        src="/src/github-logo.svg"
        alt="github"
        style={{ height: 18, marginRight: 8 }}
      />
      Login with GitHub
    </button>
  );
}

function Toast({ message, onClose }) {
  return (
    <div className="toast">
      {message}
      <button
        style={{
          marginLeft: 8,
          color: '#94a3b8',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
        }}
        onClick={onClose}
      >
        ✖
      </button>
    </div>
  );
}

export default function App() {
  const [repos, setRepos] = useState([]);
  const [selected, setSelected] = useState(null);
  const [preview, setPreview] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const r = await listRepos();
        setRepos(r.data);
      } catch (e) {
        // not logged in or error
      }
    }
    load();
  }, []);

  function addToast(msg) {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg }]);
    setTimeout(
      () => setToasts((t) => t.filter((toast) => toast.id !== id)),
      3000
    );
  }

  async function onGenerate(writeToRepo = false) {
    if (!selected) return addToast('⚠️ Select a repo first');

    if (writeToRepo) setLoadingSave(true);
    else setLoadingPreview(true);

    try {
      const resp = await generateReadme({
        owner: selected.owner,
        repo: selected.name,
        writeToRepo,
      });
      setPreview(resp.data.generated || '');
      if (resp.data.wroteToRepo)
        addToast(`✅ README saved to ${selected.name}`);
      else addToast(`✅ README generated for ${selected.name}`);
    } catch (e) {
      addToast('❌ ' + (e?.response?.data?.error || 'Generation failed'));
    }

    if (writeToRepo) setLoadingSave(false);
    else setLoadingPreview(false);
  }

  return (
    <div className="page">
      <div className="card">
        <h1>Private GitHub README generator</h1>
        <LoginButton />

        <div style={{ marginTop: 20 }}>
          <label>Choose repo</label>
          <select
            onChange={(e) => {
              const idx = e.target.value;
              setSelected(idx !== '' ? repos[idx] : null);
              setPreview('');
            }}
          >
            <option value="">-- select repo --</option>
            {repos.map((r, i) => (
              <option value={i} key={r.id}>
                {r.full_name}
                {r.private ? ' (private)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginTop: 12 }}>
          <button
            className="action"
            onClick={() => onGenerate(false)}
            disabled={loadingPreview}
          >
            {loadingPreview ? 'Generating...' : 'Generate (preview)'}
          </button>
          <button
            className="action"
            onClick={() => onGenerate(true)}
            disabled={loadingSave}
          >
            {loadingSave ? 'Saving...' : 'Generate & Save'}
          </button>
        </div>

        {preview && (
          <div className="preview">
            <div dangerouslySetInnerHTML={{ __html: marked.parse(preview) }} />
          </div>
        )}
      </div>

      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            message={t.msg}
            onClose={() =>
              setToasts((ts) => ts.filter((x) => x.id !== t.id))
            }
          />
        ))}
      </div>
    </div>
  );
}