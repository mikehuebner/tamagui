import { useId } from '@react-aria/utils'
import { useConstant } from '@tamagui/core'
import * as React from 'react'
import { useMemo } from 'react'

import { AnimatePresenceContext, AnimatePresenceContextProps } from './AnimatePresenceContext'
import { VariantLabels } from './types'

interface PresenceChildProps {
  children: React.ReactElement<any>
  isPresent: boolean
  onExitComplete?: () => void
  initial?: false | VariantLabels
  custom?: any
  presenceAffectsLayout: boolean
}

export const PresenceChild = ({
  children,
  initial,
  isPresent,
  onExitComplete,
  custom,
  presenceAffectsLayout,
}: PresenceChildProps) => {
  const presenceChildren = useConstant(newChildrenMap)
  const id = useId()

  const context = useMemo(
    (): AnimatePresenceContextProps => ({
      id,
      initial,
      isPresent,
      custom,
      onExitComplete: (childId: string) => {
        presenceChildren.set(childId, true)

        for (const isComplete of presenceChildren.values()) {
          if (!isComplete) return // can stop searching when any is incomplete
        }

        onExitComplete?.()
      },
      register: (childId: string) => {
        presenceChildren.set(childId, false)
        return () => presenceChildren.delete(childId)
      },
    }),
    /**
     * If the presence of a child affects the layout of the components around it,
     * we want to make a new context value to ensure they get re-rendered
     * so they can detect that layout change.
     */
    presenceAffectsLayout ? undefined : [isPresent]
  )

  useMemo(() => {
    presenceChildren.forEach((_, key) => presenceChildren.set(key, false))
  }, [isPresent])

  /**
   * If there's no animated components to fire exit animations, we want to remove this
   * component immediately.
   */
  React.useEffect(() => {
    !isPresent && !presenceChildren.size && onExitComplete?.()
  }, [isPresent])

  return (
    <AnimatePresenceContext.Provider value={context}>{children}</AnimatePresenceContext.Provider>
  )
}

function newChildrenMap(): Map<string, boolean> {
  return new Map()
}