'use client';

import { useState } from 'react';
import { format, parseISO, isToday, isFuture, addDays } from 'date-fns';
import { ListTodo, Plus, Loader2, CheckCircle2, Circle } from 'lucide-react';
import type { AppEvent } from '@/types';
import { cn } from '@/lib/utils';

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
        (isToday(parseISO(e.start)) || isFuture(parseISO(e.start)) || !e.completed)
    )
    .sort((a, b) => {
      // incomplete first, then by date
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return a.start.localeCompare(b.start);
    });

  const pending = todos.filter((t) => !t.completed);
  const done = todos.filter((t) => t.completed);

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
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold dark:text-white">
          <ListTodo className="h-4 w-4 text-amber-500" />
          To-dos
          {pending.length > 0 && (
            <span className="ml-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-px text-xs font-bold">
              {pending.length}
            </span>
          )}
        </h3>
      </div>

      {/* Quick add */}
      <div className="px-4 pb-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="Add for today..."
          className="flex-1 rounded-xl border border-slate-200 dark:border-slate-600 bg-transparent px-3 py-2 text-sm outline-none focus:border-amber-400 dark:focus:border-amber-500 dark:text-white placeholder:text-slate-400 transition-all"
        />
        <button
          onClick={add}
          disabled={adding || !text.trim()}
          className="rounded-xl bg-amber-500 p-2 text-white hover:bg-amber-600 disabled:opacity-40 transition-colors"
        >
          {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        </button>
      </div>

      {/* List */}
      <div className="px-4 pb-4">
        {todos.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-600 py-2">All clear! 🎉</p>
        ) : (
          <ul className="space-y-1">
            {pending.map((todo) => (
              <TodoRow key={todo.id} todo={todo} togglingId={togglingId} onToggle={toggle} />
            ))}
            {done.length > 0 && pending.length > 0 && (
              <li className="my-2 border-t border-slate-100 dark:border-slate-700/40" />
            )}
            {done.slice(0, 3).map((todo) => (
              <TodoRow key={todo.id} todo={todo} togglingId={togglingId} onToggle={toggle} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function TodoRow({
  todo,
  togglingId,
  onToggle,
}: {
  todo: AppEvent;
  togglingId: string | null;
  onToggle: (t: AppEvent) => void;
}) {
  const loading = togglingId === todo.id;
  return (
    <li className="flex items-center gap-2.5 py-1 group">
      <button
        onClick={() => !loading && onToggle(todo)}
        className="shrink-0 text-slate-400 hover:text-amber-500 transition-colors"
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : todo.completed ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        ) : (
          <Circle className="h-4 w-4" />
        )}
      </button>
      <span
        className={cn(
          'text-sm flex-1 truncate',
          todo.completed
            ? 'text-slate-400 dark:text-slate-600 line-through'
            : 'dark:text-slate-200'
        )}
      >
        {todo.title}
      </span>
      <span className="text-xs text-slate-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {isToday(parseISO(todo.start)) ? 'today' : format(parseISO(todo.start), 'EEE d')}
      </span>
    </li>
  );
}
