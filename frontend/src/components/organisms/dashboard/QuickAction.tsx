'use client'

import React, { useState } from 'react'
import SectionHeader from '@/components/molecules/interactive/SectionHeader'

import { QuickAction } from '@/types/QuickActionItems'
import QuickActionItems from '@/components/molecules/cards/QuickActionItems'
import { QuickActionModal } from '@/components/molecules/interactive/QuickActionModels'

interface QuickActionsProps {
  actions: QuickAction[]
}

export default function QuickActions({ actions }: QuickActionsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAction, setSelectedAction] = useState<QuickAction | null>(null)

  const handleActionClick = (action: QuickAction) => {
    setSelectedAction(action)
    setIsModalOpen(true)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <SectionHeader title="Quick Actions" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {actions.map(action => (
          <QuickActionItems
            key={action.id}
            quickActions={{
              ...action,
              onClick: () => handleActionClick(action),
            }}
          />
        ))}
      </div>

      <QuickActionModal
        isOpen={isModalOpen}
        closeModal={() => setIsModalOpen(false)}
        action={selectedAction}
      />
    </div>
  )
}




