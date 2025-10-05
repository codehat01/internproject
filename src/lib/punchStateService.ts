import { supabase } from './supabase';

export interface PunchState {
  isPunchedIn: boolean;
  lastPunchTime: Date | null;
  lastPunchType: 'in' | 'out' | null;
}

class PunchStateService {
  private listeners: Set<(state: PunchState) => void> = new Set();
  private currentState: PunchState = {
    isPunchedIn: false,
    lastPunchTime: null,
    lastPunchType: null
  };

  async initialize(userId: string): Promise<void> {
    const state = await this.checkTodayPunchStatus(userId);
    this.currentState = state;
    this.notifyListeners();

    localStorage.setItem(`punchState_${userId}`, JSON.stringify({
      ...state,
      lastPunchTime: state.lastPunchTime?.toISOString()
    }));
  }

  async checkTodayPunchStatus(userId: string): Promise<PunchState> {
    try {
      const cachedState = localStorage.getItem(`punchState_${userId}`);
      if (cachedState) {
        const parsed = JSON.parse(cachedState);
        const cachedDate = parsed.lastPunchTime ? new Date(parsed.lastPunchTime) : null;
        if (cachedDate && this.isSameDay(cachedDate, new Date())) {
          return {
            isPunchedIn: parsed.isPunchedIn,
            lastPunchTime: cachedDate,
            lastPunchType: parsed.lastPunchType
          };
        }
      }

      const today = new Date().toISOString().split('T')[0];
      const { data: todayAttendance, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', userId)
        .gte('timestamp', `${today}T00:00:00`)
        .order('timestamp', { ascending: false })
        .limit(1);

      if (error) throw error;

      let state: PunchState;
      if (todayAttendance && todayAttendance.length > 0) {
        const lastPunch = todayAttendance[0];
        state = {
          isPunchedIn: lastPunch.punch_type === 'in',
          lastPunchTime: new Date(lastPunch.timestamp),
          lastPunchType: lastPunch.punch_type
        };
      } else {
        state = {
          isPunchedIn: false,
          lastPunchTime: null,
          lastPunchType: null
        };
      }

      localStorage.setItem(`punchState_${userId}`, JSON.stringify({
        ...state,
        lastPunchTime: state.lastPunchTime?.toISOString()
      }));

      return state;
    } catch (error) {
      console.error('Error checking punch status:', error);
      return {
        isPunchedIn: false,
        lastPunchTime: null,
        lastPunchType: null
      };
    }
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.toDateString() === date2.toDateString();
  }

  subscribe(listener: (state: PunchState) => void): () => void {
    this.listeners.add(listener);
    listener(this.currentState);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentState));
  }

  async updatePunchState(userId: string, punchType: 'in' | 'out'): Promise<void> {
    const newState: PunchState = {
      isPunchedIn: punchType === 'in',
      lastPunchTime: new Date(),
      lastPunchType: punchType
    };

    this.currentState = newState;

    localStorage.setItem(`punchState_${userId}`, JSON.stringify({
      ...newState,
      lastPunchTime: newState.lastPunchTime.toISOString()
    }));

    this.notifyListeners();
  }

  getCurrentState(): PunchState {
    return { ...this.currentState };
  }

  getNextPunchType(): 'in' | 'out' {
    return this.currentState.isPunchedIn ? 'out' : 'in';
  }
}

export const punchStateService = new PunchStateService();
