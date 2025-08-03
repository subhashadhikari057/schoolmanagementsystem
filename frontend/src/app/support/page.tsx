'use client';

import React from 'react';
import {
  Mail,
  Phone,
  MessageCircle,
  HelpCircle,
  Clock,
  MapPin,
} from 'lucide-react';

export default function SupportPage() {
  return (
    <div className='min-h-screen bg-gray-50 py-12'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='text-center mb-12'>
          <h1 className='text-4xl font-bold text-gray-900 mb-4'>
            Contact Support
          </h1>
          <p className='text-xl text-gray-600 max-w-3xl mx-auto'>
            Need help? We are here to assist you. Choose the best way to reach
            our support team.
          </p>
        </div>

        {/* Contact Options */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12'>
          {/* Email Support */}
          <div className='bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow'>
            <div className='flex items-center mb-4'>
              <div className='bg-blue-100 p-3 rounded-full mr-4'>
                <Mail className='w-6 h-6 text-blue-600' />
              </div>
              <h3 className='text-lg font-semibold text-gray-900'>
                Email Support
              </h3>
            </div>
            <p className='text-gray-600 mb-4'>
              Send us an email and we will get back to you within 24 hours.
            </p>
            <a
              href='mailto:support@school.com'
              className='text-blue-600 hover:text-blue-800 font-medium'
            >
              support@school.com
            </a>
          </div>

          {/* Phone Support */}
          <div className='bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow'>
            <div className='flex items-center mb-4'>
              <div className='bg-green-100 p-3 rounded-full mr-4'>
                <Phone className='w-6 h-6 text-green-600' />
              </div>
              <h3 className='text-lg font-semibold text-gray-900'>
                Phone Support
              </h3>
            </div>
            <p className='text-gray-600 mb-4'>
              Call us during business hours for immediate assistance.
            </p>
            <a
              href='tel:+1234567890'
              className='text-green-600 hover:text-green-800 font-medium'
            >
              +1 (234) 567-8900
            </a>
          </div>

          {/* Live Chat */}
          <div className='bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow'>
            <div className='flex items-center mb-4'>
              <div className='bg-purple-100 p-3 rounded-full mr-4'>
                <MessageCircle className='w-6 h-6 text-purple-600' />
              </div>
              <h3 className='text-lg font-semibold text-gray-900'>Live Chat</h3>
            </div>
            <p className='text-gray-600 mb-4'>
              Start a live chat session with our support team.
            </p>
            <button className='text-purple-600 hover:text-purple-800 font-medium'>
              Start Chat
            </button>
          </div>
        </div>

        {/* Support Hours */}
        <div className='bg-white rounded-lg shadow-md p-8 mb-8'>
          <div className='flex items-center mb-6'>
            <Clock className='w-6 h-6 text-gray-600 mr-3' />
            <h2 className='text-2xl font-semibold text-gray-900'>
              Support Hours
            </h2>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <h3 className='font-semibold text-gray-900 mb-2'>
                Phone & Live Chat
              </h3>
              <ul className='space-y-1 text-gray-600'>
                <li>Monday - Friday: 8:00 AM - 6:00 PM</li>
                <li>Saturday: 9:00 AM - 5:00 PM</li>
                <li>Sunday: Closed</li>
              </ul>
            </div>
            <div>
              <h3 className='font-semibold text-gray-900 mb-2'>
                Email Support
              </h3>
              <ul className='space-y-1 text-gray-600'>
                <li>24/7 - We respond within 24 hours</li>
                <li>Priority support for urgent issues</li>
                <li>Multilingual support available</li>
              </ul>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className='bg-white rounded-lg shadow-md p-8 mb-8'>
          <div className='flex items-center mb-6'>
            <HelpCircle className='w-6 h-6 text-gray-600 mr-3' />
            <h2 className='text-2xl font-semibold text-gray-900'>
              Frequently Asked Questions
            </h2>
          </div>
          <div className='space-y-6'>
            <div>
              <h3 className='font-semibold text-gray-900 mb-2'>
                How do I reset my password?
              </h3>
              <p className='text-gray-600'>
                Click on Forgot Password on the login page and follow the
                instructions. Students and parents should contact their school
                administrator for password resets.
              </p>
            </div>
            <div>
              <h3 className='font-semibold text-gray-900 mb-2'>
                How do I access my dashboard?
              </h3>
              <p className='text-gray-600'>
                After logging in, you will be automatically redirected to your
                role-specific dashboard. Each user type (student, teacher,
                parent, admin) has a customized interface.
              </p>
            </div>
            <div>
              <h3 className='font-semibold text-gray-900 mb-2'>
                Who can I contact for technical issues?
              </h3>
              <p className='text-gray-600'>
                For technical issues, please contact our support team using any
                of the methods above. For urgent issues during school hours,
                call the phone number provided.
              </p>
            </div>
          </div>
        </div>

        {/* Office Location */}
        <div className='bg-white rounded-lg shadow-md p-8'>
          <div className='flex items-center mb-6'>
            <MapPin className='w-6 h-6 text-gray-600 mr-3' />
            <h2 className='text-2xl font-semibold text-gray-900'>
              Office Location
            </h2>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            <div>
              <h3 className='font-semibold text-gray-900 mb-2'>
                School Management Office
              </h3>
              <address className='text-gray-600 not-italic'>
                123 Education Street
                <br />
                Learning City, LC 12345
                <br />
                United States
              </address>
            </div>
            <div>
              <h3 className='font-semibold text-gray-900 mb-2'>Visit Us</h3>
              <p className='text-gray-600'>
                Our office is open for in-person visits during regular business
                hours. Please call ahead to schedule an appointment with our
                support team.
              </p>
            </div>
          </div>
        </div>

        {/* Back to Login */}
        <div className='text-center mt-12'>
          <a
            href='/auth/login'
            className='inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors'
          >
            Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}
