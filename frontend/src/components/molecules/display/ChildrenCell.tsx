import React from 'react';

interface Child {
  name: string;
  grade: string;
  studentId: string;
}

interface ChildrenCellProps {
  children?: Child[];
  linkedStudents?: string[];
}

const ChildrenCell: React.FC<ChildrenCellProps> = ({
  children,
  linkedStudents,
}) => {
  // If we have detailed children info, use that; otherwise fall back to linkedStudents
  const displayChildren =
    children ||
    linkedStudents?.map((student, index) => ({
      name: student,
      grade: `Grade ${index + 1}`, // Fallback grade
      studentId: `STU${String(index + 1).padStart(3, '0')}`,
    })) ||
    [];

  if (displayChildren.length === 0) {
    return <span className='text-gray-500 text-sm'>No children</span>;
  }

  return (
    <div className='space-y-1'>
      {displayChildren.slice(0, 2).map((child, index) => {
        const childName = typeof child === 'string' ? child : child.name;
        const childGrade = typeof child === 'object' ? child.grade : undefined;
        const childId = typeof child === 'object' ? child.studentId : undefined;

        return (
          <div key={index} className='text-sm'>
            <div className='flex items-center gap-2'>
              <div className='w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center'>
                <span className='text-xs font-medium text-blue-600'>
                  {childName.charAt(0)}
                </span>
              </div>
              <div>
                <div className='font-medium text-gray-900'>{childName}</div>
                {childGrade && childId && (
                  <div className='text-xs text-gray-500'>
                    {childGrade} • {childId}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
      {displayChildren.length > 2 && (
        <div className='text-xs text-gray-500 ml-8'>
          +{displayChildren.length - 2} more
        </div>
      )}
    </div>
  );
};

export default ChildrenCell;
