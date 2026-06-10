'use client';

import { useState } from 'react';
import { format, parseISO, isToday, isFuture, addDays } from 'date-fns';
import { ListTodo, Plus, Loader2 } from 'lucide-react';
import type { AppEvent } from '@/types';

interface Props {
  events: AppEvent[];
  onAdd: (event: Partial<AppEvent>) => Promise<unknown>;
  onToggle: (id: string, event: Partial<AppEvent>) => Promise<unknown>;
}

export default function TodoSidebar({ events, onAdd, onToggle }: Props) {
  const [text, setText] = useState('');
  const [adding, setAdding] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const todos = events
    .filter(
      (e) =>
        e.type === 'todo' &&
        (isToday(parseISO(e.start)) || isFuture(parseISO(e.start)))
    )
    .sort((a, b) => a.start.localeCompare(b.start));

  const add = async () => {
    if (!text.trim()) return;
    setAdding(true);
    const today = format(new Date(), 'yyyy-MM-dd');
    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    try {
      await onAdd({
        title: text.trim(),
        type: 'todo',
        allDay: true,
        start: `${today}T00:00:00`,
        end: `${tomorrow}T00:00:00`,
        completed: false,
      });
      setText('');
    } finally {
      setAdding(false);
    }
  };

  const toggle = async (todo: AppEvent) => {
    setTogglingId(todo.id);
    try {
      await onToggle(todo.id, { ...todo, completed: !todo.completed });
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <ListTodo className="h-4 w-4 text-amber-500" /> To-dos
      </h2>

      <div className="mb-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="Quick add for today..."
          className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-amber-400"
        />
        <button
          onClick={add}
          disabled={adding || !text.trim()}
          className="rounded-lg bg-amber-500 p-2 text-white hover:bg-amber-600 disabled:opacity-50"
        >
          {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        </button>
      </div>

      {todos.length === 0 ? (
        <p className="text-sm text-slate-400">Nothing on the list 🎉</p>
      ) : (
        <ul className="space-y-1.5">
          {todos.map((todo) => (
            <li key={todo.id} className="flex items-center gap-2 text-sm">
              {togglingId === todo.id ? (
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              ) : (
                <input
                  type="checkbox"
                  checked={Boolean(todo.completed)}
                  onChange={() => toggle(todo)}
                  className="h-4 w-4 accent-amber-500"
                />
              )}
              <span className={todo.completed ? 'text-slate-400 line-through' : ''}>
                {todo.title}
              </span>
              <span className="ml-auto text-xs text-slate-400">
                {isToday(parseISO(todo.start)) ? 'today' : format(parseISO(todo.start), 'EEE d')}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
