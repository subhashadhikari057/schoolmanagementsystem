import ToggleButton from '@/components/atoms/form-controls/ToggleButton';
import PaginationButton from '@/components/atoms/interactive/PaginationButton';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange?: (page: number) => void;
}

export const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange = () => {},
}: PaginationProps) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to display
  const generatePageNumbers = () => {
    const pages = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show 1, 2, 3, ..., 31 pattern or similar
      pages.push(1);

      if (currentPage > 4) {
        pages.push('...');
      }

      // Show current page and neighbors
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== totalPages) {
          pages.push(i);
        }
      }

      if (currentPage < totalPages - 3) {
        pages.push('...');
      }

      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = generatePageNumbers();

  return (
    <div className='flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6'>
      {/* Mobile pagination */}
      <div className='flex flex-1 justify-between sm:hidden'>
        <ToggleButton
          className='hover:bg-gray-100'
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </ToggleButton>
        <ToggleButton
          className='hover:bg-gray-100'
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </ToggleButton>
      </div>

      {/* Desktop pagination */}
      <div className='hidden sm:flex sm:flex-1 sm:items-center sm:justify-between'>
        <div>
          <p className='text-sm text-gray-700'>
            Showing <span className='font-medium'>{startItem}</span> to{' '}
            <span className='font-medium'>{endItem}</span> of{' '}
            <span className='font-medium'>{totalItems}</span> results
          </p>
        </div>

        <div>
          <nav className='flex items-center space-x-1' aria-label='Pagination'>
            {/* Previous button */}
            <PaginationButton
              onClick={() => onPageChange(currentPage - 1)}
              isDisabled={currentPage === 1}
            >
              <svg
                className='h-4 w-4'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M15 19l-7-7 7-7'
                />
              </svg>
            </PaginationButton>

            {/* Page numbers */}
            {pageNumbers.map((page, index) => {
              if (page === '...') {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className='px-3 py-2 text-sm font-medium text-gray-700'
                  >
                    ...
                  </span>
                );
              }

              return (
                <PaginationButton
                  key={page}
                  onClick={() => onPageChange(Number(page))}
                  isActive={currentPage === page}
                >
                  {page}
                </PaginationButton>
              );
            })}

            {/* Next button */}
            <PaginationButton
              onClick={() => onPageChange(currentPage + 1)}
              isDisabled={currentPage === totalPages}
            >
              <svg
                className='h-4 w-4'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 5l7 7-7 7'
                />
              </svg>
            </PaginationButton>
          </nav>
        </div>
      </div>
    </div>
  );
};
