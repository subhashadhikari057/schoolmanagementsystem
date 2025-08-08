'use client';

/**
 * =============================================================================
 * Basic Preview Page
 * =============================================================================
 * Simple preview page after component deletion
 * =============================================================================
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function BasicPreview() {
  return (
    <div className='min-h-screen bg-base-100 p-6'>
      <div className='max-w-4xl mx-auto space-y-8'>
        {/* Header */}
        <div className='text-center space-y-2'>
          <h1 className='text-3xl font-bold'>School Management System</h1>
          <p className='text-muted-foreground'>
            Components have been reset to original state
          </p>
        </div>

        {/* Basic Components Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Available UI Components</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <h3 className='text-lg font-semibold'>Buttons</h3>
              <div className='flex gap-2 flex-wrap'>
                <Button variant='default'>Default</Button>
                <Button variant='secondary'>Secondary</Button>
                <Button variant='outline'>Outline</Button>
                <Button variant='ghost'>Ghost</Button>
                <Button variant='link'>Link</Button>
              </div>
            </div>

            <div className='space-y-2'>
              <h3 className='text-lg font-semibold'>Button Sizes</h3>
              <div className='flex gap-2 items-center flex-wrap'>
                <Button size='sm'>Small</Button>
                <Button size='default'>Default</Button>
                <Button size='lg'>Large</Button>
              </div>
            </div>

            <div className='space-y-2'>
              <h3 className='text-lg font-semibold'>Cards</h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <Card>
                  <CardHeader>
                    <CardTitle>Sample Card 1</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className='text-muted-foreground'>
                      This is a sample card component from the UI library.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Sample Card 2</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className='text-muted-foreground'>
                      Another example of the card component in use.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardContent className='p-6'>
            <div className='text-center space-y-2'>
              <div className='text-lg font-semibold text-success'>
                ✓ Components Deleted Successfully
              </div>
              <p className='text-muted-foreground'>
                All TabSection components have been removed from the working set
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
