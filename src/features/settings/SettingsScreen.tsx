import { useRef, useState, type ChangeEvent } from 'react';
import { motion } from 'motion/react';
import { downloadBackup, importBackup, parseBackup, type BackupFile, type ImportMode } from '../../db/backup';
import { BottomSheet } from '../../components/BottomSheet';
import { Header } from '../../components/Header';
import { DownloadIcon, UploadIcon } from '../../components/Icons';
import { Page } from '../../components/Page';
import { useToast } from '../../components/Toast';
import { setThemeMode, useThemeMode, type ThemeMode } from '../../theme/theme';

const MODES: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

export function SettingsScreen() {
  const mode = useThemeMode();
  const toast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ open: boolean; backup?: BackupFile }>({ open: false });

  const pickFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setPending({ open: true, backup: parseBackup(await file.text()) });
    } catch (err) {
      toast({ message: err instanceof Error ? err.message : 'Could not read the file.', duration: 6000 });
    }
  };

  return (
    <Page>
      <Header title="Settings" back="/" />

      <section className="settings-section">
        <h2 className="section-title">Appearance</h2>
        <div className="segmented" role="radiogroup" aria-label="Theme">
          {MODES.map((m) => (
            <button key={m.value} role="radio" aria-checked={mode === m.value} className="segment" onClick={() => setThemeMode(m.value)}>
              {mode === m.value && (
                <motion.span layoutId="segment-pill" className="segment-pill" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />
              )}
              <span className="segment-label">{m.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <h2 className="section-title">Data</h2>
        <p className="section-text">
          Everything is stored only on this device. Export a backup to keep a copy or move your lists to another device.
        </p>
        <div className="settings-buttons">
          <motion.button className="btn btn-secondary" whileTap={{ scale: 0.97 }} onClick={() => downloadBackup()}>
            <DownloadIcon width={18} height={18} /> Export
          </motion.button>
          <motion.button className="btn btn-secondary" whileTap={{ scale: 0.97 }} onClick={() => fileInput.current?.click()}>
            <UploadIcon width={18} height={18} /> Import
          </motion.button>
          <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={pickFile} />
        </div>
      </section>

      <section className="settings-section">
        <h2 className="section-title">About</h2>
        <p className="section-text">Simple Lists · works offline · v{__APP_VERSION__}</p>
      </section>

      <BottomSheet open={pending.open} onClose={() => setPending((p) => ({ ...p, open: false }))} title="Import backup">
        {pending.backup && (
          <ImportForm
            backup={pending.backup}
            onCancel={() => setPending((p) => ({ ...p, open: false }))}
            onDone={(msg) => {
              setPending((p) => ({ ...p, open: false }));
              toast({ message: msg });
            }}
          />
        )}
      </BottomSheet>
    </Page>
  );
}

function ImportForm({ backup, onCancel, onDone }: { backup: BackupFile; onCancel: () => void; onDone: (msg: string) => void }) {
  const [mode, setMode] = useState<ImportMode>('merge');
  const [busy, setBusy] = useState(false);
  const { organizations, projects, lists, items } = backup.data;
  const stats = [
    ['Organizations', organizations.length],
    ['Projects', projects.length],
    ['Lists', lists.length],
    ['Items', items.length],
  ] as const;

  const run = async () => {
    setBusy(true);
    try {
      await importBackup(backup, mode);
      onDone(mode === 'replace' ? 'Data replaced from backup' : 'Backup merged');
    } catch {
      setBusy(false);
      onDone('Import failed — nothing was changed');
    }
  };

  return (
    <div className="sheet-body">
      <p className="section-text">Exported {new Date(backup.exportedAt).toLocaleString()}</p>
      <div className="stats">
        {stats.map(([label, n]) => (
          <div key={label} className="stat">
            <span className="stat-value tabular">{n}</span>
            <span className="stat-label">{label}</span>
          </div>
        ))}
      </div>
      <div className="choice-group" role="radiogroup" aria-label="Import mode">
        <label className="choice">
          <input type="radio" name="mode" checked={mode === 'merge'} onChange={() => setMode('merge')} />
          <span>
            <strong>Merge</strong>
            <small>Add new records; when both copies exist, keep the most recently edited.</small>
          </span>
        </label>
        <label className="choice">
          <input type="radio" name="mode" checked={mode === 'replace'} onChange={() => setMode('replace')} />
          <span>
            <strong>Replace all</strong>
            <small>Delete everything on this device and load the backup.</small>
          </span>
        </label>
      </div>
      <div className="sheet-actions">
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className={`btn ${mode === 'replace' ? 'btn-danger' : 'btn-primary'}`} disabled={busy} onClick={run}>
          {mode === 'replace' ? 'Replace all' : 'Merge'}
        </button>
      </div>
    </div>
  );
}
