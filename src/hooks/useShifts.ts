import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'

type Shift = Database['public']['Tables']['shifts']['Row']
type ShiftInsert = Database['public']['Tables']['shifts']['Insert']
type ShiftUpdate = Database['public']['Tables']['shifts']['Update']

export interface ShiftWithProfiles extends Shift {
  profiles?: Array<{
    id: string
    full_name: string
    badge_number: string
    rank: string
  }>
}

export const useShifts = (stationId?: string) => {
  const [shifts, setShifts] = useState<ShiftWithProfiles[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchShifts()

    const channel = supabase
      .channel('shifts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shifts',
          filter: stationId ? `station_id=eq.${stationId}` : undefined
        },
        () => {
          fetchShifts()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [stationId])

  const fetchShifts = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('shifts')
        .select('*')
        .order('shift_start', { ascending: true })

      if (stationId) {
        query = query.eq('station_id', stationId)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      const shiftsWithProfiles = await Promise.all(
        (data || []).map(async (shift) => {
          if (shift.assigned_users.length > 0) {
            const { data: profilesData } = await supabase
              .from('profiles')
              .select('id, full_name, badge_number, rank')
              .in('id', shift.assigned_users)

            return {
              ...shift,
              profiles: profilesData || []
            }
          }
          return { ...shift, profiles: [] }
        })
      )

      setShifts(shiftsWithProfiles)
      setError(null)
    } catch (err) {
      console.error('Error fetching shifts:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch shifts')
    } finally {
      setLoading(false)
    }
  }

  const createShift = async (shift: ShiftInsert) => {
    try {
      const { data, error: insertError } = await supabase
        .from('shifts')
        .insert(shift)
        .select()
        .single()

      if (insertError) throw insertError

      await fetchShifts()
      return { data, error: null }
    } catch (err) {
      console.error('Error creating shift:', err)
      return { data: null, error: err instanceof Error ? err.message : 'Failed to create shift' }
    }
  }

  const updateShift = async (id: string, updates: ShiftUpdate) => {
    try {
      const { data, error: updateError } = await supabase
        .from('shifts')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      await fetchShifts()
      return { data, error: null }
    } catch (err) {
      console.error('Error updating shift:', err)
      return { data: null, error: err instanceof Error ? err.message : 'Failed to update shift' }
    }
  }

  const deleteShift = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('shifts')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      await fetchShifts()
      return { error: null }
    } catch (err) {
      console.error('Error deleting shift:', err)
      return { error: err instanceof Error ? err.message : 'Failed to delete shift' }
    }
  }

  const assignUsersToShift = async (shiftId: string, userIds: string[]) => {
    try {
      const { data, error: updateError } = await supabase
        .from('shifts')
        .update({ assigned_users: userIds })
        .eq('id', shiftId)
        .select()
        .single()

      if (updateError) throw updateError

      await fetchShifts()
      return { data, error: null }
    } catch (err) {
      console.error('Error assigning users to shift:', err)
      return { data: null, error: err instanceof Error ? err.message : 'Failed to assign users' }
    }
  }

  return {
    shifts,
    loading,
    error,
    createShift,
    updateShift,
    deleteShift,
    assignUsersToShift,
    refetch: fetchShifts
  }
}
