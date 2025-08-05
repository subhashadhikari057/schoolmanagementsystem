import React from 'react';

interface SubjectDetail {
  name: string;
  grade: string;
}

interface SubjectsClassesCellProps {
  subjects?: string[];
  subjects_detailed?: SubjectDetail[];
  classTeacher?: string;
}

const SubjectsClassesCell: React.FC<SubjectsClassesCellProps> = ({
  subjects,
  subjects_detailed,
  classTeacher,
}) => {
  const displaySubjects =
    subjects_detailed ||
    subjects?.map(subject => ({
      name: subject,
      grade: '', // Fallback if no detailed subjects
    })) ||
    [];

  return (
    <div className='space-y-1'>
      {displaySubjects.slice(0, 2).map((subject, index) => (
        <div key={index} className='text-sm'>
          <div className='font-medium text-gray-900'>
            {typeof subject === 'string' ? subject : subject.name}
          </div>
          {typeof subject === 'object' && subject.grade && (
            <div className='text-xs text-gray-500'>{subject.grade}</div>
          )}
        </div>
      ))}

      {classTeacher && (
        <div className='text-sm'>
          <div className='flex items-center gap-1'>
            <span className='text-green-600 text-xs'>★</span>
            <span className='text-green-600 font-medium'>
              Class Teacher: {classTeacher}
            </span>
          </div>
        </div>
      )}

      {displaySubjects.length > 2 && (
        <div className='text-xs text-gray-500'>
          +{displaySubjects.length - 2} more subjects
        </div>
      )}

      {displaySubjects.length === 0 && !classTeacher && (
        <span className='text-gray-500 text-sm'>No subjects assigned</span>
      )}
    </div>
  );
};

export default SubjectsClassesCell;
