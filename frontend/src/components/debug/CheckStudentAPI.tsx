'use client';

import { studentService } from '@/api/services/student.service';
import { useEffect, useState } from 'react';

const CheckStudentAPI = () => {
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await studentService.getAllStudents({
          page: 1,
          limit: 5, // Small limit to ensure we should have multiple pages
        });

        setApiResponse(response);
      } catch (err) {
        console.error('Error fetching student data:', err);
        setError('Failed to fetch student data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className='p-4'>
      <h1 className='text-xl font-bold mb-4'>API Response Debug</h1>

      {loading && <p>Loading...</p>}

      {error && <p className='text-red-500'>{error}</p>}

      {apiResponse && (
        <div className='space-y-4'>
          <div>
            <h2 className='text-lg font-semibold'>Response Status</h2>
            <p>Success: {apiResponse.success ? 'Yes' : 'No'}</p>
            <p>Message: {apiResponse.message || 'None'}</p>
          </div>

          <div>
            <h2 className='text-lg font-semibold'>Pagination Info</h2>
            <p>Total Items: {apiResponse.data?.total || 'Not available'}</p>
            <p>Current Page: {apiResponse.data?.page || 'Not available'}</p>
            <p>Items Per Page: {apiResponse.data?.limit || 'Not available'}</p>
            <p>
              Total Pages: {apiResponse.data?.totalPages || 'Not available'}
            </p>
          </div>

          <div>
            <h2 className='text-lg font-semibold'>Data Structure</h2>
            <pre className='bg-gray-100 p-4 overflow-auto max-h-96 text-xs'>
              {JSON.stringify(apiResponse.data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckStudentAPI;
