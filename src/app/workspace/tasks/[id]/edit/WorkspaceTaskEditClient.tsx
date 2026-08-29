'use client';

import React, { useState } from 'react';
import {
  TaskDetailEditView,
  type TaskData,
  type UserRef,
} from '@/components/tasks/TaskDetailEditView';
import { UserCheck, Layers } from 'lucide-react';

const USER_YASIR: UserRef = {
  id: 'u-yasir',
  name: 'Yasir Khan',
  avatarText: 'Y',
  colorBg: 'bg-indigo-100 dark:bg-indigo-900/60',
  email: 'yasir@clinic.com',
};

const USER_SAMIULLAH: UserRef = {
  id: 'u-samiullah',
  name: 'Samiullah Qureshi',
  avatarText: 'S',
  colorBg: 'bg-blue-100 dark:bg-blue-900/60',
  email: 'samiullah@clinic.com',
};

const USER_GUEST: UserRef = {
  id: 'u-guest',
  name: 'Guest Member',
  avatarText: 'G',
  colorBg: 'bg-slate-100 dark:bg-slate-800',
  email: 'guest@clinic.com',
};

export function WorkspaceTaskEditClient({ taskId }: { taskId: string }) {
  const [currentUser, setCurrentUser] = useState<UserRef>(USER_YASIR);

  const taskData: TaskData = {
    id: taskId || '6d7c5add-1216-44d9-b2ab-2d50deb19910',
    title: 'Testing Task 1',
    projectName: 'AYDI ACTIVE',
    status: 'In Progress',
    priority: 'MEDIUM',
    dueDate: 'Tomorrow',
    estimatedHours: '0.3',
    trackedHours: '12min',
    totalCapacity: '100h',
    usedCapacity: '18min',
    remainingCapacity: '99h 42min',
    milestone: 'None',
    description: 'this description is for this testing task okay',
    assignees: [USER_SAMIULLAH, USER_YASIR],
    checklistAssignees: [USER_YASIR], // Yasir Khan IS in checklist for this task
    checklistItems: [
      {
        id: 'cl-item-1',
        title: 'Checklist item assigned to Yasir Khan',
        completed: false,
        assignedTo: USER_YASIR,
      },
      {
        id: 'cl-item-2',
        title: 'Verify checklist-first view rendering order',
        completed: true,
        assignedTo: USER_YASIR,
      },
    ],
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top User Switching Control for testing */}
      <div className="bg-slate-900 text-white px-6 py-2 flex items-center justify-between text-xs font-semibold shrink-0">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-blue-400" />
          <span>Simulated Logged-In User for Route <code>/workspace/tasks/{taskId}/edit</code>:</span>
        </div>
        <div className="flex items-center gap-2">
          {[USER_YASIR, USER_SAMIULLAH, USER_GUEST].map((u) => {
            const isActive = currentUser.id === u.id;
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => setCurrentUser(u)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <UserCheck className="size-3.5" />
                <span>{u.name} {u.id === USER_YASIR.id ? '(In Checklist)' : '(Not in Checklist)'}</span>
              </button>
            );
          })}
        </div>
      </div>

      <TaskDetailEditView
        task={taskData}
        currentUser={currentUser}
        onSave={(updated) => alert(`Saved task "${updated.title}"`)}
      />
    </div>
  );
}
