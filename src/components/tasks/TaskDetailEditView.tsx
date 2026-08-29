'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  ChevronRight,
  ChevronDown,
  FileText,
  Clock,
  User,
  Plus,
  CheckSquare,
  Square,
  CheckCircle2,
  Layout,
  Layers,
} from 'lucide-react';

export interface UserRef {
  id: string;
  name: string;
  avatarText: string;
  colorBg: string;
  email?: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  assignedTo?: UserRef;
}

export interface TaskData {
  id: string;
  title: string;
  projectName: string;
  status: 'In Progress' | 'Pending' | 'Completed' | 'On Hold';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate: string;
  estimatedHours: string;
  trackedHours: string;
  totalCapacity: string;
  usedCapacity: string;
  remainingCapacity: string;
  milestone: string;
  description: string;
  assignees: UserRef[];
  checklistAssignees: UserRef[];
  checklistItems: ChecklistItem[];
}

export interface TaskDetailEditViewProps {
  task: TaskData;
  currentUser: UserRef;
  onClose?: () => void;
  onSave?: (updatedTask: TaskData) => void;
}

/**
 * Robust check if logged-in user is assigned in the task's checklist.
 * Matches by User ID, Name (case-insensitive), or Checklist item assignment.
 */
export function checkIsUserAssignedInChecklist(task: TaskData, currentUser?: UserRef): boolean {
  if (!currentUser || !task) return false;

  const currentId = currentUser.id?.toLowerCase();
  const currentName = currentUser.name?.toLowerCase().trim();
  const currentEmail = currentUser.email?.toLowerCase().trim();

  const isUserMatch = (user?: UserRef) => {
    if (!user) return false;
    if (currentId && user.id?.toLowerCase() === currentId) return true;
    if (currentName && user.name?.toLowerCase().trim() === currentName) return true;
    if (currentEmail && user.email?.toLowerCase().trim() === currentEmail) return true;
    return false;
  };

  // 1. Check checklistAssignees list
  if (task.checklistAssignees?.some(isUserMatch)) {
    return true;
  }

  // 2. Check individual checklist items
  if (task.checklistItems?.some((item) => isUserMatch(item.assignedTo))) {
    return true;
  }

  return false;
}

export function TaskDetailEditView({
  task: initialTask,
  currentUser,
  onClose,
  onSave,
}: TaskDetailEditViewProps) {
  const [task, setTask] = useState<TaskData>(initialTask);
  const [newChecklistText, setNewChecklistText] = useState('');

  // Evaluate if current user is assigned in checklist
  const isUserAssignedInChecklist = useMemo(() => {
    return checkIsUserAssignedInChecklist(task, currentUser);
  }, [task, currentUser]);

  const toggleChecklistItem = (id: string) => {
    const updatedItems = task.checklistItems.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setTask({ ...task, checklistItems: updatedItems });
  };

  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;

    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      title: newChecklistText,
      completed: false,
      assignedTo: currentUser,
    };

    setTask({
      ...task,
      checklistItems: [...task.checklistItems, newItem],
      checklistAssignees: task.checklistAssignees.some(
        (u) => u.id === currentUser.id || u.name === currentUser.name
      )
        ? task.checklistAssignees
        : [...task.checklistAssignees, currentUser],
    });
    setNewChecklistText('');
  };

  // --- RENDER SECTIONS ---

  // SECTION A: TASK OVERVIEW
  const renderTaskOverviewSection = () => (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="size-5 text-slate-700 dark:text-slate-200" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Task Overview
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            Total: <strong>{task.totalCapacity}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            Used: <strong>{task.usedCapacity}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50">
            Remaining: <strong>{task.remainingCapacity}</strong>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
        <div>
          <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">
            Task Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={task.title}
            onChange={(e) => setTask({ ...task, title: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div>
          <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">
            Project
          </label>
          <div className="relative">
            <select
              value={task.projectName}
              onChange={(e) => setTask({ ...task, projectName: e.target.value })}
              className="w-full appearance-none px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none pr-8"
            >
              <option value="AYDI ACTIVE">AYDI ACTIVE</option>
              <option value="Clinic AI Platform">Clinic AI Platform</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-medium">
        <div>
          <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">
            Status
          </label>
          <select
            value={task.status}
            onChange={(e) => setTask({ ...task, status: e.target.value as any })}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold"
          >
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
            <option value="On Hold">On Hold</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">
            Priority
          </label>
          <select
            value={task.priority}
            onChange={(e) => setTask({ ...task, priority: e.target.value as any })}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold"
          >
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="URGENT">URGENT</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">
            Due Date
          </label>
          <div className="relative">
            <input
              type="text"
              value={task.dueDate}
              onChange={(e) => setTask({ ...task, dueDate: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold pr-7"
            />
            <X className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 cursor-pointer" />
          </div>
        </div>

        <div>
          <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">
            Estimated Hours
          </label>
          <div className="relative">
            <input
              type="text"
              value={task.estimatedHours}
              onChange={(e) => setTask({ ...task, estimatedHours: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold pr-10"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
              hrs
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
            <Clock className="size-3" />
            <span>99h 42min available of 100h capacity</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium pt-2">
        <div>
          <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">
            Assignees
          </label>
          <div className="flex items-center gap-2 p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
            <div className="flex items-center -space-x-1.5">
              {task.assignees.map((user) => (
                <div
                  key={user.id}
                  title={user.name}
                  className={`size-7 rounded-full ${user.colorBg} text-blue-700 dark:text-blue-200 font-bold text-xs flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-2xs`}
                >
                  {user.avatarText}
                </div>
              ))}
            </div>
            <ChevronDown className="size-4 text-slate-400 ml-auto" />
          </div>
        </div>

        <div>
          <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">
            Milestone
          </label>
          <select
            value={task.milestone}
            onChange={(e) => setTask({ ...task, milestone: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold"
          >
            <option value="None">None</option>
            <option value="Sprint 1 Release">Sprint 1 Release</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">
            Tracked Hours
          </label>
          <input
            type="text"
            readOnly
            value={task.trackedHours}
            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-bold cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );

  // SECTION B: CHECKLIST SECTION
  const renderChecklistSection = () => (
    <div className="bg-white dark:bg-slate-900 border-2 border-blue-500/30 dark:border-blue-500/40 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="size-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Task Checklist Section (Assigned View)
          </h2>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          {task.checklistItems.filter((i) => i.completed).length} of {task.checklistItems.length} completed
        </span>
      </div>

      <div className="space-y-2">
        {task.checklistItems.map((item) => (
          <div
            key={item.id}
            onClick={() => toggleChecklistItem(item.id)}
            className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
          >
            <div className="text-blue-600 shrink-0">
              {item.completed ? (
                <CheckSquare className="size-4.5 fill-blue-600 text-white" />
              ) : (
                <Square className="size-4.5 text-slate-300" />
              )}
            </div>
            <span
              className={`text-xs font-semibold flex-1 ${
                item.completed
                  ? 'line-through text-slate-400 dark:text-slate-500'
                  : 'text-slate-800 dark:text-slate-100'
              }`}
            >
              {item.title}
            </span>
            {item.assignedTo && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200/50">
                Assigned to: {item.assignedTo.name}
              </span>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleAddChecklistItem} className="flex gap-2 text-xs">
        <input
          type="text"
          placeholder="Add new checklist item..."
          value={newChecklistText}
          onChange={(e) => setNewChecklistText(e.target.value)}
          className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-1 shadow-2xs"
        >
          <Plus className="size-3.5" /> Add Item
        </button>
      </form>
    </div>
  );

  // SECTION C: TASK DESCRIPTION
  const renderDescriptionSection = () => (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="size-5 text-slate-700 dark:text-slate-200" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Task Description
          </h2>
        </div>
        <span className="text-xs text-slate-400">
          Type &quot;/&quot; for blocks, &quot;@&quot; for team
        </span>
      </div>

      <textarea
        rows={4}
        value={task.description}
        onChange={(e) => setTask({ ...task, description: e.target.value })}
        placeholder="this description is for this testing task okay"
        className="w-full p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col">
      {/* HEADER BREADCRUMB BAR */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
          <span className="text-slate-400">«</span>
          <span>Project Space</span>
          <ChevronRight className="size-3 text-slate-400" />
          <span>{task.projectName}</span>
          <ChevronRight className="size-3 text-slate-400" />
          <span>Edit Task</span>
          <ChevronRight className="size-3 text-slate-400" />
          <span className="text-slate-900 dark:text-white font-bold">
            {task.title}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
          >
            <span>Select Rules…</span>
            <ChevronDown className="size-3.5 text-slate-400" />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-700"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </header>

      {/* DYNAMIC MODE INDICATOR BANNER */}
      <div
        className={`px-6 py-2 text-xs font-bold flex items-center justify-between transition-colors shadow-xs ${
          isUserAssignedInChecklist
            ? 'bg-emerald-600 text-white'
            : 'bg-slate-800 text-white'
        }`}
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>
            {isUserAssignedInChecklist
              ? `Checklist Assignee View active for ${currentUser.name}: Showing CHECKLIST & DESCRIPTION FIRST.`
              : `Standard Overview View active for ${currentUser.name}: Showing TASK OVERVIEW FIRST.`}
          </span>
        </div>
        <span className="text-[10px] uppercase font-mono tracking-wider opacity-90 font-black">
          {isUserAssignedInChecklist ? 'CHECKLIST FIRST' : 'OVERVIEW FIRST'}
        </span>
      </div>

      {/* MAIN TWO COLUMN LAYOUT */}
      <div className="flex-1 flex flex-col lg:flex-row min-w-0">
        {/* LEFT COLUMN: CONDITIONAL SECTION ORDERING */}
        <main className="flex-1 p-6 space-y-6 min-w-0 overflow-y-auto">
          {isUserAssignedInChecklist ? (
            /* 🟢 CHECKLIST ASSIGNED USER -> Checklist FIRST, Description SECOND, Overview BELOW */
            <>
              {renderChecklistSection()}
              {renderDescriptionSection()}
              {renderTaskOverviewSection()}
            </>
          ) : (
            /* 🔵 NOT CHECKLIST ASSIGNED USER -> Task Overview FIRST, Description SECOND, Checklist BELOW */
            <>
              {renderTaskOverviewSection()}
              {renderDescriptionSection()}
              {renderChecklistSection()}
            </>
          )}
        </main>

        {/* RIGHT SIDEBAR: TASK PROPERTIES */}
        <aside className="w-full lg:w-80 shrink-0 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 space-y-6 text-xs">
          <h3 className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">
            TASK PROPERTIES
          </h3>

          <div>
            <span className="text-slate-400 block mb-0.5">Project</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              {task.projectName}
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3.5 space-y-2 font-medium">
            <div className="flex justify-between">
              <span className="text-slate-500">Total Capacity</span>
              <span className="font-bold text-slate-900 dark:text-white">{task.totalCapacity}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Used Capacity</span>
              <span>{task.usedCapacity}</span>
            </div>
            <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400 pt-1 border-t border-slate-200 dark:border-slate-700">
              <span>Remaining Capacity</span>
              <span>{task.remainingCapacity}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <span className="text-slate-400 block mb-1">Status</span>
              <span className="font-bold text-slate-900 dark:text-white">{task.status}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Priority</span>
              <span className="font-bold text-slate-900 dark:text-white">{task.priority}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-slate-400 block mb-1">Due Date</span>
              <span className="font-bold text-slate-900 dark:text-white">{task.dueDate}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Est. Hours</span>
              <span className="font-bold text-slate-900 dark:text-white">{task.estimatedHours}</span>
            </div>
          </div>

          <div>
            <span className="text-slate-400 block mb-1">Tracked Hours</span>
            <span className="font-bold text-slate-900 dark:text-white">{task.trackedHours}</span>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 block mb-2 font-semibold">
              Assignees ({task.assignees.length})
            </span>
            <div className="space-y-2">
              {task.assignees.map((user) => (
                <div key={user.id} className="flex items-center gap-2.5 font-bold text-slate-800 dark:text-slate-200">
                  <div
                    className={`size-6 rounded-full ${user.colorBg} text-blue-700 dark:text-blue-200 text-[11px] flex items-center justify-center`}
                  >
                    {user.avatarText}
                  </div>
                  <span>{user.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 block mb-2 font-semibold">
              Checklist Assignees ({task.checklistAssignees.length})
            </span>
            <div className="space-y-2">
              {task.checklistAssignees.map((user) => (
                <div key={user.id} className="flex items-center gap-2.5 font-bold text-slate-800 dark:text-slate-200">
                  <div
                    className={`size-6 rounded-full ${user.colorBg} text-blue-700 dark:text-blue-200 text-[11px] flex items-center justify-center`}
                  >
                    {user.avatarText}
                  </div>
                  <span>{user.name}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* FOOTER */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between sticky bottom-0 z-20">
        <button
          type="button"
          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2"
        >
          <Layout className="size-4" />
          <span>Templates</span>
        </button>

        <div className="flex items-center gap-4 text-xs">
          <span className="text-slate-400 font-medium">
            You can save and continue later.
          </span>
          <button
            type="button"
            onClick={() => onSave?.(task)}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl font-bold shadow-2xs transition-all"
          >
            Save Changes
          </button>
        </div>
      </footer>
    </div>
  );
}
