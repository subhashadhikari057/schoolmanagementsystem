import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { StudentService } from '@/api/services/student.service';
import { Loader2 } from 'lucide-react';

export interface Student {
  id: string;
  fullName: string;
  rollNumber: string;
  class?: {
    id: string;
    name: string;
  };
}

interface StudentSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (students: Student[]) => void;
  title: string;
  description: string;
  allowMultiple?: boolean;
  selectedStudentIds?: string[];
}

export const StudentSelectionModal: React.FC<StudentSelectionModalProps> = ({
  open,
  onClose,
  onSelect,
  title,
  description,
  allowMultiple = true,
  selectedStudentIds = [],
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(selectedStudentIds),
  );
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const studentService = new StudentService();

  useEffect(() => {
    if (open) {
      fetchStudents();
    }
  }, [open, searchTerm, page]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await studentService.getAllStudents({
        page,
        pageSize: 20,
        search: searchTerm || undefined,
        orderBy: 'rollNumber',
        orderDirection: 'asc',
      });

      setStudents(response.data);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStudent = (studentId: string) => {
    const newSelectedIds = new Set(selectedIds);

    if (allowMultiple) {
      if (newSelectedIds.has(studentId)) {
        newSelectedIds.delete(studentId);
      } else {
        newSelectedIds.add(studentId);
      }
    } else {
      newSelectedIds.clear();
      newSelectedIds.add(studentId);
    }

    setSelectedIds(newSelectedIds);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === students.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(students.map(s => s.id)));
    }
  };

  const handleConfirm = () => {
    const selectedStudents = students.filter(s => selectedIds.has(s.id));
    onSelect(selectedStudents);
    onClose();
  };

  const handleCancel = () => {
    setSelectedIds(new Set(selectedStudentIds));
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className='max-w-4xl max-h-[80vh]'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Search and Controls */}
          <div className='flex items-center gap-4'>
            <Input
              placeholder='Search by name or roll number...'
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className='flex-1'
            />
            {allowMultiple && (
              <Button variant='outline' size='sm' onClick={handleSelectAll}>
                {selectedIds.size === students.length
                  ? 'Deselect All'
                  : 'Select All'}
              </Button>
            )}
          </div>

          {/* Selected Count */}
          {selectedIds.size > 0 && (
            <div className='flex items-center gap-2'>
              <Badge variant='secondary'>
                {selectedIds.size} student{selectedIds.size !== 1 ? 's' : ''}{' '}
                selected
              </Badge>
            </div>
          )}

          {/* Students List */}
          <div className='border rounded-lg max-h-96 overflow-y-auto'>
            {loading ? (
              <div className='flex items-center justify-center p-8'>
                <Loader2 className='h-6 w-6 animate-spin' />
                <span className='ml-2'>Loading students...</span>
              </div>
            ) : students.length === 0 ? (
              <div className='text-center p-8 text-muted-foreground'>
                No students found
              </div>
            ) : (
              <div className='space-y-1 p-4'>
                {students.map(student => (
                  <div
                    key={student.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 ${
                      selectedIds.has(student.id)
                        ? 'bg-muted border-primary'
                        : ''
                    }`}
                    onClick={() => handleSelectStudent(student.id)}
                  >
                    <Checkbox
                      checked={selectedIds.has(student.id)}
                      onChange={() => handleSelectStudent(student.id)}
                    />
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2'>
                        <span className='font-medium'>{student.fullName}</span>
                        <Badge variant='outline' className='text-xs'>
                          {student.rollNumber}
                        </Badge>
                      </div>
                      {student.class && (
                        <div className='text-sm text-muted-foreground'>
                          {student.class.name}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='flex items-center justify-between'>
              <div className='text-sm text-muted-foreground'>
                Page {page} of {totalPages}
              </div>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={selectedIds.size === 0}>
            Confirm Selection ({selectedIds.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
