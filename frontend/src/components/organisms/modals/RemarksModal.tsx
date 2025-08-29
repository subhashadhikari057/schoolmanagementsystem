'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  MessageCircle,
  User,
  GraduationCap,
  Save,
  FileText,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RemarksModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  userRole?: 'teacher' | 'student'; // To determine if user can edit
}

export const RemarksModal: React.FC<RemarksModalProps> = ({
  isOpen,
  onClose,
  submission,
  onSave,
  isLoading = false,
  userRole = 'teacher',
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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

  if (!isOpen || !submission) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white flex-shrink-0'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-white/20 rounded-lg'>
                <MessageCircle className='w-5 h-5' />
              </div>
              <div>
                <h2 className='text-xl font-semibold'>Remarks</h2>
                <p className='text-blue-100 text-sm'>
                  {submission.student.name}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className='p-2 hover:bg-white/20 rounded-lg transition-colors'
              disabled={isSaving}
            >
              <X className='w-5 h-5' />
            </button>
          </div>
        </div>

        {/* Messages Container */}
        <div className='flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50'>
          {/* Student Message */}
          {submission.studentNotes && (
            <div className='flex gap-3'>
              <div className='flex-shrink-0'>
                <div className='w-8 h-8 bg-green-100 rounded-full flex items-center justify-center'>
                  <User className='w-4 h-4 text-green-600' />
                </div>
              </div>
              <div className='flex-1'>
                <div className='bg-white rounded-2xl rounded-tl-md p-4 shadow-sm border border-gray-200'>
                  <div className='flex items-center gap-2 mb-2'>
                    <span className='font-medium text-gray-900'>Student</span>
                    <span className='text-xs text-gray-500'>
                      {formatDate(submission.submittedAt)}
                    </span>
                  </div>
                  <p className='text-gray-700 leading-relaxed whitespace-pre-wrap'>
                    {submission.studentNotes}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Teacher Message */}
          {submission.feedback && (
            <div className='flex gap-3 justify-end'>
              <div className='flex-1'>
                <div className='bg-blue-600 text-white rounded-2xl rounded-tr-md p-4 shadow-sm ml-12'>
                  <div className='flex items-center gap-2 mb-2 justify-end'>
                    <span className='text-xs text-blue-100'>
                      {formatDate(submission.submittedAt)}
                    </span>
                    <span className='font-medium text-white'>Teacher</span>
                  </div>
                  <p className='leading-relaxed whitespace-pre-wrap'>
                    {submission.feedback}
                  </p>
                </div>
              </div>
              <div className='flex-shrink-0'>
                <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
                  <GraduationCap className='w-4 h-4 text-blue-600' />
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!submission.studentNotes && !submission.feedback && (
            <div className='text-center py-12'>
              <MessageCircle className='w-12 h-12 text-gray-300 mx-auto mb-4' />
              <p className='text-gray-500'>No remarks yet</p>
              <p className='text-sm text-gray-400'>
                Start the conversation by adding a remark
              </p>
            </div>
          )}
        </div>

        {/* Input Area - Only show for teachers or if user can edit */}
        {userRole === 'teacher' && (
          <div className='border-t bg-white p-4 flex-shrink-0'>
            <div className='flex gap-3'>
              <div className='flex-1'>
                <textarea
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder='Enter Remarks'
                  rows={3}
                  className='w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors'
                  disabled={isSaving}
                />
              </div>
              <div className='flex flex-col justify-end'>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !newMessage.trim()}
                  className='w-12 h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-full flex items-center justify-center transition-colors'
                >
                  {isSaving ? (
                    <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                  ) : (
                    <Send className='w-5 h-5' />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
