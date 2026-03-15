'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { folders } from '@/lib/api';
import type { Folder } from '@/lib/api';
import { FolderOpen, Plus } from 'lucide-react';

export default function FoldersPage() {
  const [list, setList] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newNote, setNewNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    folders.list().then(setList).catch(() => setList([])).finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const title = newTitle.trim();
    if (!title) {
      setError('Enter a title');
      return;
    }
    setCreating(true);
    try {
      const folder = await folders.create({ title, note: newNote.trim() || undefined });
      setList((prev) => [folder, ...prev]);
      setNewTitle('');
      setNewNote('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Folders</h1>
      <p className="text-slate-600 dark:text-slate-400 text-sm">
        Group transactions by purpose (e.g. money from Baba for a trip). Add transactions to a folder, then view or share a report for that folder only.
      </p>

      <section className="card">
        <h2 className="text-lg font-semibold mb-3">New folder</h2>
        <form onSubmit={handleCreate} className="space-y-3">
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="input-field"
              placeholder="e.g. Baba gave for trip"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Note (optional)</label>
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="input-field"
              placeholder="Optional description"
            />
          </div>
          <button type="submit" className="btn-primary flex items-center gap-2" disabled={creating}>
            <Plus size={18} />
            {creating ? 'Creating...' : 'Create folder'}
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Your folders</h2>
        {list.length === 0 ? (
          <div className="card py-12 text-center text-slate-500">
            No folders yet. Create one above to get started.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {list.map((f) => (
              <Link
                key={f.id}
                href={`/dashboard/folders/${f.id}`}
                className="card flex items-start gap-3 hover:ring-2 hover:ring-sky-500/50 transition"
              >
                <FolderOpen size={24} className="shrink-0 text-slate-500" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{f.title}</p>
                  {f.note && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{f.note}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
