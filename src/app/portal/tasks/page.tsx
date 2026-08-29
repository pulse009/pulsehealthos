'use client';

import React, { useState } from 'react';
import {
  TaskDetailEditView,
  type TaskData,
  type UserRef,
} from '@/components/tasks/TaskDetailEditView';
import { CheckCircle2, UserCheck, ArrowRight, Layers, FileText } from 'lucide-react';

const USER_SAMIULLAH: UserRef = {
  id: 'u1',
  name: 'Samiullah Qureshi',
  avatarText: 'S',
  colorBg: 'bg-blue-100 dark:bg-blue-900/60',
};

const USER_YASIR: UserRef = {
  id: 'u2',
  name: 'Yasir Khan',
  avatarText: 'Y',
  colorBg: 'bg-indigo-100 dark:bg-indigo-900/60',
};

const USER_GUEST: UserRef = {
  id: 'u3',
  name: 'Guest Developer',
  avatarText: 'G',
  colorBg: 'bg-slate-100 dark:bg-slate-800',
};

const MOCK_TASKS: TaskData[] = [
  {
    id: 'task-1',
    title: 'Testing Task 1',
    projectName: 'AYDI ACTIVE',
    status: 'In Progress',
    priority: 'MEDIUM',
    dueDate: '2026-08-22',
    estimatedHours: '0.3 hrs',
    trackedHours: '12min',
    totalCapacity: '100h',
    usedCapacity: '18min',
    remainingCapacity: '99h 42min',
    milestone: 'None',
    description: 'this description is for this testing task okay',
    assignees: [USER_SAMIULLAH, USER_YASIR],
    checklistAssignees: [USER_SAMIULLAH],
    checklistItems: [
      {
        id: 'cl-1',
        title: 'Checklist item #1 for Testing Task 1',
        completed: false,
        assignedTo: USER_SAMIULLAH,
      },
      {
        id: 'cl-2',
        title: 'Verify backend API integration',
        completed: true,
        assignedTo: USER_SAMIULLAH,
      },
    ],
  },
  {
    id: 'task-2',
    title: 'Frontend UI Polish Task',
    projectName: 'AYDI ACTIVE',
    status: 'Pending',
    priority: 'HIGH',
    dueDate: '2026-08-25',
    estimatedHours: '2.5 hrs',
    trackedHours: '45min',
    totalCapacity: '100h',
    usedCapacity: '18min',
    remainingCapacity: '99h 42min',
    milestone: 'Sprint 1 Release',
    description: 'General UI polish and component responsiveness check across viewports.',
    assignees: [USER_SAMIULLAH, USER_YASIR],
    checklistAssignees: [USER_YASIR], // Samiullah is NOT in checklist for this task
    checklistItems: [
      {
        id: 'cl-3',
        title: 'Review responsive breakpoints on mobile',
        completed: false,
        assignedTo: USER_YASIR,
      },
    ],
  },
];

export default function TasksPage() {
  const [currentUser, setCurrentUser] = useState<UserRef>(USER_SAMIULLAH);
  const [selectedTask, setSelectedTask] = useState<TaskData | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 text-slate-800 dark:text-slate-100">
      {selectedTask ? (
        <TaskDetailEditView
          task={selectedTask}
          currentUser={currentUser}
          onClose={() => setSelectedTask(null)}
          onSave={(updated) => {
            alert(`Task "${updated.title}" saved successfully!`);
            setSelectedTask(null);
          }}
        />
      ) : (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="size-6 text-blue-600" />
              <span>Project Tasks & Checklist View Tester</span>
            </h1>
            <p className="text-xs font-medium text-slate-500 mt-1">
              Select a logged-in user and open any task below to verify the conditional layout logic.
            </p>

            {/* User Selector Pill */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Simulate Logged-in User:
              </span>
              <div className="flex gap-2">
                {[USER_SAMIULLAH, USER_YASIR, USER_GUEST].map((u) => {
                  const isActive = currentUser.id === u.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setCurrentUser(u)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      <UserCheck className="size-3.5" />
                      <span>{u.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tasks List */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Tasks in Project AYDI ACTIVE
            </h2>

            <div className="grid grid-cols-1 gap-4">
              {MOCK_TASKS.map((t) => {
                const isChecklistAssignee = t.checklistAssignees.some(
                  (a) => a.id === currentUser.id || a.name === currentUser.name
                );

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTask(t)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 rounded-2xl p-5 shadow-xs transition-all cursor-pointer group flex items-center justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                          {t.title}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {t.projectName}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 line-clamp-1">{t.description}</p>

                      <div className="flex items-center gap-3 pt-1 text-xs">
                        <span className="font-semibold text-slate-600 dark:text-slate-400">
                          Assignees: {t.assignees.map((a) => a.name).join(', ')}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="font-semibold text-slate-600 dark:text-slate-400">
                          Checklist Assignees: {t.checklistAssignees.map((a) => a.name).join(', ')}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-2 ${
                          isChecklistAssignee
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/50'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/50'
                        }`}
                      >
                        <CheckCircle2 className="size-3.5" />
                        <span>
                          {isChecklistAssignee
                            ? 'Checklist View First'
                            : 'Overview View First'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                        <span>Open Task View</span>
                        <ArrowRight className="size-4" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
