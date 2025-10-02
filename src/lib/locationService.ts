import { supabase } from './supabase';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export class LocationService {
  private watchId: number | null = null;
  private userId: string | null = null;
  private updateInterval: number = 30000;
  private lastUpdateTime: number = 0;

  setUserId(userId: string) {
    this.userId = userId;
  }

  isLocationSupported(): boolean {
    return 'geolocation' in navigator;
  }

  async getCurrentPosition(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!this.isLocationSupported()) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }

  async updateLocationInDatabase(locationData: LocationData): Promise<void> {
    if (!this.userId) {
      throw new Error('User ID not set');
    }

    const now = Date.now();
    if (now - this.lastUpdateTime < this.updateInterval) {
      return;
    }

    try {
      const { error } = await supabase.from('user_locations').insert({
        user_id: this.userId,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy || null,
        timestamp: new Date().toISOString(),
        is_active: true,
      });

      if (error) throw error;

      this.lastUpdateTime = now;
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  }

  startTracking(userId: string, onLocationUpdate?: (location: LocationData) => void): void {
    if (!this.isLocationSupported()) {
      console.error('Geolocation is not supported');
      return;
    }

    this.setUserId(userId);
    this.stopTracking();

    this.watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };

        try {
          await this.updateLocationInDatabase(locationData);
          onLocationUpdate?.(locationData);
        } catch (error) {
          console.error('Error in location tracking:', error);
        }
      },
      (error) => {
        console.error('Location tracking error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );
  }

  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  async getLatestLocation(userId: string): Promise<LocationData | null> {
    try {
      const { data, error } = await supabase
        .from('user_locations')
        .select('latitude, longitude, accuracy')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy || undefined,
      };
    } catch (error) {
      console.error('Error fetching latest location:', error);
      return null;
    }
  }

  async getLocationHistory(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('user_locations')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching location history:', error);
      return [];
    }
  }
}

export const locationService = new LocationService();
