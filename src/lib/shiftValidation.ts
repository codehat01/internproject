import { supabase } from './supabase';

export interface Shift {
  id: string;
  station_id: string;
  shift_name: string;
  shift_start: string;
  shift_end: string;
  assigned_users: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShiftValidationResult {
  isValid: boolean;
  shift: Shift | null;
  complianceStatus: 'on_time' | 'late' | 'early_departure' | 'overtime' | 'absent';
  minutesLate: number;
  minutesEarly: number;
  overtimeMinutes: number;
  gracePeriodUsed: boolean;
  message: string;
}

export interface GracePeriodInfo {
  isWithinGracePeriod: boolean;
  minutesRemaining: number;
  gracePeriodEnd: Date;
}

export class ShiftValidationService {
  private readonly GRACE_PERIOD_MINUTES = 20;

  async getCurrentShift(userId: string, timestamp?: Date): Promise<Shift | null> {
    try {
      const checkTime = timestamp || new Date();

      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .contains('assigned_users', [userId])
        .lte('shift_start', checkTime.toISOString())
        .gte('shift_end', checkTime.toISOString())
        .order('shift_start', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching current shift:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getCurrentShift:', error);
      return null;
    }
  }

  async getUpcomingShift(userId: string): Promise<Shift | null> {
    try {
      const now = new Date();

      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .contains('assigned_users', [userId])
        .gt('shift_start', now.toISOString())
        .order('shift_start', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching upcoming shift:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getUpcomingShift:', error);
      return null;
    }
  }

  async getUserShifts(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Shift[]> {
    try {
      let query = supabase
        .from('shifts')
        .select('*')
        .contains('assigned_users', [userId])
        .order('shift_start', { ascending: true });

      if (startDate) {
        query = query.gte('shift_start', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('shift_end', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching user shifts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserShifts:', error);
      return [];
    }
  }

  calculateGracePeriodInfo(shiftStart: Date, currentTime: Date): GracePeriodInfo {
    const gracePeriodEnd = new Date(shiftStart);
    gracePeriodEnd.setMinutes(gracePeriodEnd.getMinutes() + this.GRACE_PERIOD_MINUTES);

    const isWithinGracePeriod = currentTime <= gracePeriodEnd;
    const minutesRemaining = Math.max(
      0,
      Math.floor((gracePeriodEnd.getTime() - currentTime.getTime()) / (1000 * 60))
    );

    return {
      isWithinGracePeriod,
      minutesRemaining,
      gracePeriodEnd,
    };
  }

  validatePunchIn(shift: Shift, punchTime: Date): ShiftValidationResult {
    const shiftStart = new Date(shift.shift_start);
    const shiftEnd = new Date(shift.shift_end);

    if (punchTime < shiftStart) {
      const minutesEarly = Math.floor(
        (shiftStart.getTime() - punchTime.getTime()) / (1000 * 60)
      );
      return {
        isValid: true,
        shift,
        complianceStatus: 'on_time',
        minutesLate: 0,
        minutesEarly,
        overtimeMinutes: 0,
        gracePeriodUsed: false,
        message: `Punched in ${minutesEarly} minutes early`,
      };
    }

    const gracePeriodInfo = this.calculateGracePeriodInfo(shiftStart, punchTime);

    if (punchTime <= shiftStart) {
      return {
        isValid: true,
        shift,
        complianceStatus: 'on_time',
        minutesLate: 0,
        minutesEarly: 0,
        overtimeMinutes: 0,
        gracePeriodUsed: false,
        message: 'Punched in on time',
      };
    }

    if (gracePeriodInfo.isWithinGracePeriod) {
      const minutesLate = Math.floor(
        (punchTime.getTime() - shiftStart.getTime()) / (1000 * 60)
      );
      return {
        isValid: true,
        shift,
        complianceStatus: 'on_time',
        minutesLate,
        minutesEarly: 0,
        overtimeMinutes: 0,
        gracePeriodUsed: true,
        message: `Within grace period. ${gracePeriodInfo.minutesRemaining} minutes remaining`,
      };
    }

    const minutesLate = Math.floor(
      (punchTime.getTime() - shiftStart.getTime()) / (1000 * 60)
    );

    if (punchTime > shiftEnd) {
      return {
        isValid: false,
        shift,
        complianceStatus: 'absent',
        minutesLate,
        minutesEarly: 0,
        overtimeMinutes: 0,
        gracePeriodUsed: false,
        message: 'Shift has ended. Cannot punch in.',
      };
    }

    return {
      isValid: true,
      shift,
      complianceStatus: 'late',
      minutesLate,
      minutesEarly: 0,
      overtimeMinutes: 0,
      gracePeriodUsed: false,
      message: `Punched in ${minutesLate} minutes late`,
    };
  }

  validatePunchOut(shift: Shift, punchTime: Date, punchInTime: Date): ShiftValidationResult {
    const shiftEnd = new Date(shift.shift_end);
    const shiftStart = new Date(shift.shift_start);

    if (punchTime < punchInTime) {
      return {
        isValid: false,
        shift,
        complianceStatus: 'on_time',
        minutesLate: 0,
        minutesEarly: 0,
        overtimeMinutes: 0,
        gracePeriodUsed: false,
        message: 'Cannot punch out before punch in time',
      };
    }

    const minutesWorked = Math.floor(
      (punchTime.getTime() - punchInTime.getTime()) / (1000 * 60)
    );

    if (punchTime < shiftEnd) {
      const minutesEarly = Math.floor(
        (shiftEnd.getTime() - punchTime.getTime()) / (1000 * 60)
      );

      if (minutesEarly > 15) {
        return {
          isValid: true,
          shift,
          complianceStatus: 'early_departure',
          minutesLate: 0,
          minutesEarly,
          overtimeMinutes: 0,
          gracePeriodUsed: false,
          message: `Early departure: ${minutesEarly} minutes before shift end`,
        };
      }

      return {
        isValid: true,
        shift,
        complianceStatus: 'on_time',
        minutesLate: 0,
        minutesEarly: 0,
        overtimeMinutes: 0,
        gracePeriodUsed: false,
        message: 'Punched out on time',
      };
    }

    const overtimeMinutes = Math.floor(
      (punchTime.getTime() - shiftEnd.getTime()) / (1000 * 60)
    );

    return {
      isValid: true,
      shift,
      complianceStatus: 'overtime',
      minutesLate: 0,
      minutesEarly: 0,
      overtimeMinutes,
      gracePeriodUsed: false,
      message: `Overtime: ${overtimeMinutes} minutes`,
    };
  }

  formatTimeRemaining(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} hour${hours !== 1 ? 's' : ''} ${mins > 0 ? `${mins} minute${mins !== 1 ? 's' : ''}` : ''}`;
  }

  formatShiftTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  getShiftDuration(shift: Shift): number {
    const start = new Date(shift.shift_start);
    const end = new Date(shift.shift_end);
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60));
  }

  isShiftActive(shift: Shift): boolean {
    const now = new Date();
    const start = new Date(shift.shift_start);
    const end = new Date(shift.shift_end);
    return now >= start && now <= end;
  }

  getTimeUntilShift(shift: Shift): number {
    const now = new Date();
    const start = new Date(shift.shift_start);
    return Math.max(0, Math.floor((start.getTime() - now.getTime()) / (1000 * 60)));
  }
}

export const shiftValidationService = new ShiftValidationService();
