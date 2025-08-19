import React from 'react';

interface Child {
  id?: string;
  fullName?: string;
  name: string;
  grade: string;
  studentId: string;
  profilePhotoUrl?: string;
  avatar?: string;
  relationship?: string;
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

  // Helper function to get initials from name
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Helper function to render child avatar
  const renderChildAvatar = (child: Child, _index: number) => {
    const childName =
      typeof child === 'string' ? child : child.name || child.fullName || '';
    const profileImage =
      typeof child === 'object'
        ? child.profilePhotoUrl || child.avatar
        : undefined;
    const initials = getInitials(childName);

    if (profileImage) {
      return (
        <img
          src={profileImage}
          alt={childName}
          className='w-8 h-8 rounded-full object-cover border border-gray-200'
          onError={e => {
            // Fallback to initials if image fails to load
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
      );
    }

    return (
      <div className='w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center'>
        <span className='text-xs font-semibold text-white'>{initials}</span>
      </div>
    );
  };

  // For compact display, show up to 4 children as avatars in a row
  if (displayChildren.length <= 4) {
    return (
      <div className='flex items-center gap-1'>
        {displayChildren.map((child, index) => {
          const childName =
            typeof child === 'string'
              ? child
              : child.name || (child as any).fullName || '';
          return (
            <div
              key={index}
              className='relative group cursor-pointer'
              title={`${childName} - ${typeof child === 'object' ? child.grade || 'N/A' : 'N/A'}`}
            >
              {renderChildAvatar(child, index)}
              {/* Hidden fallback for broken images */}
              <div className='hidden w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full items-center justify-center absolute top-0 left-0'>
                <span className='text-xs font-semibold text-white'>
                  {getInitials(childName)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // For more than 4 children, show first 3 + count badge
  return (
    <div className='flex items-center gap-1'>
      {displayChildren.slice(0, 3).map((child, index) => {
        const childName =
          typeof child === 'string'
            ? child
            : child.name || (child as any).fullName || '';
        return (
          <div
            key={index}
            className='relative group cursor-pointer'
            title={`${childName} - ${typeof child === 'object' ? child.grade || 'N/A' : 'N/A'}`}
          >
            {renderChildAvatar(child, index)}
            {/* Hidden fallback for broken images */}
            <div className='hidden w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full items-center justify-center absolute top-0 left-0'>
              <span className='text-xs font-semibold text-white'>
                {getInitials(childName)}
              </span>
            </div>
          </div>
        );
      })}
      <div className='w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200'>
        <span className='text-xs font-medium text-gray-600'>
          +{displayChildren.length - 3}
        </span>
      </div>
    </div>
  );
};

export default ChildrenCell;
