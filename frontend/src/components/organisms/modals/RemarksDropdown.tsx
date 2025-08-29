'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  MessageCircle,
  User,
  GraduationCap,
  Send,
  FileText,
} from 'lucide-react';

interface RemarksDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  position: { top: number; left: number } | null;
  submission: {
    id: string;
    student: {
      name: string;
      email: string;
    };
    studentNotes?: string;
    feedback?: string;
    submittedAt?: string;
  } | null;
  onSave: (submissionId: string, feedback: string) => Promise<void>;
  isLoading?: boolean;
  userRole?: 'teacher' | 'student';
}

export const RemarksDropdown: React.FC<RemarksDropdownProps> = ({
  isOpen,
  onClose,
  position,
  submission,
  onSave,
  isLoading = false,
  userRole = 'teacher',
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleSave = async () => {
    if (!submission || !newMessage.trim()) return;

    setIsSaving(true);
    try {
      await onSave(submission.id, newMessage.trim());
      setNewMessage('');
      onClose();
    } catch (error) {
      console.error('Error saving feedback:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setNewMessage('');
    onClose();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  if (!isOpen || !submission || !position) return null;

  return (
    <div
      ref={dropdownRef}
      className='fixed z-50 bg-white rounded-xl shadow-2xl border border-gray-200 w-80 max-h-96 overflow-hidden'
      style={{
        top: position.top + 10,
        left: Math.max(
          10,
          Math.min(position.left - 160, window.innerWidth - 330),
        ), // Center and keep in viewport
      }}
    >
      {/* Header */}
      <div className='bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-white flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <MessageCircle className='w-4 h-4' />
          <div>
            <h3 className='font-semibold text-sm'>Remarks</h3>
            <p className='text-blue-100 text-xs'>{submission.student.name}</p>
          </div>
        </div>
        <button
          onClick={handleClose}
          className='p-1 hover:bg-white/20 rounded transition-colors'
          disabled={isSaving}
        >
          <X className='w-4 h-4' />
        </button>
      </div>

      {/* Messages Container */}
      <div className='max-h-48 overflow-y-auto p-3 space-y-3 bg-gray-50'>
        {/* Student Message */}
        {submission.studentNotes && (
          <div className='flex gap-2'>
            <div className='flex-shrink-0'>
              <div className='w-6 h-6 bg-green-100 rounded-full flex items-center justify-center'>
                <User className='w-3 h-3 text-green-600' />
              </div>
            </div>
            <div className='flex-1 min-w-0'>
              <div className='bg-white rounded-lg rounded-tl-sm p-2 shadow-sm border border-gray-200'>
                <div className='flex items-center gap-1 mb-1'>
                  <span className='font-medium text-xs text-gray-900'>
                    Student
                  </span>
                  <span className='text-xs text-gray-500'>
                    {formatDate(submission.submittedAt)}
                  </span>
                </div>
                <p className='text-xs text-gray-700 leading-relaxed whitespace-pre-wrap'>
                  {submission.studentNotes}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Teacher Message */}
        {submission.feedback && (
          <div className='flex gap-2 justify-end'>
            <div className='flex-1 min-w-0'>
              <div className='bg-blue-600 text-white rounded-lg rounded-tr-sm p-2 shadow-sm ml-8'>
                <div className='flex items-center gap-1 mb-1 justify-end'>
                  <span className='text-xs text-blue-100'>
                    {formatDate(submission.submittedAt)}
                  </span>
                  <span className='font-medium text-xs text-white'>
                    Teacher
                  </span>
                </div>
                <p className='text-xs leading-relaxed whitespace-pre-wrap'>
                  {submission.feedback}
                </p>
              </div>
            </div>
            <div className='flex-shrink-0'>
              <div className='w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center'>
                <GraduationCap className='w-3 h-3 text-blue-600' />
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!submission.studentNotes && !submission.feedback && (
          <div className='text-center py-6'>
            <MessageCircle className='w-8 h-8 text-gray-300 mx-auto mb-2' />
            <p className='text-xs text-gray-500'>No remarks yet</p>
          </div>
        )}
      </div>

      {/* Input Area - Only show for teachers */}
      {userRole === 'teacher' && (
        <div className='border-t bg-white p-3'>
          <div className='flex gap-2'>
            <div className='flex-1'>
              <textarea
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder='Enter Remarks'
                rows={2}
                className='w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors'
                disabled={isSaving}
              />
            </div>
            <div className='flex flex-col justify-end'>
              <button
                onClick={handleSave}
                disabled={isSaving || !newMessage.trim()}
                className='w-8 h-8 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-full flex items-center justify-center transition-colors'
              >
                {isSaving ? (
                  <div className='w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                ) : (
                  <Send className='w-3 h-3' />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
