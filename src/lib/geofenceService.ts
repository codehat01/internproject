import { supabase } from './supabase';

export interface GeofencePoint {
  latitude: number;
  longitude: number;
}

export interface Geofence {
  id: string;
  station_id: string;
  station_name: string;
  boundary_coordinates: {
    type: string;
    coordinates: number[][][];
  };
  center_latitude: number;
  center_longitude: number;
  radius_meters: number | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BoundaryViolation {
  id?: string;
  user_id: string;
  geofence_id: string | null;
  violation_time: string;
  latitude: number;
  longitude: number;
  distance_from_boundary: number | null;
  shift_id: string | null;
  acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
}

export class GeofenceService {
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000;
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  isPointInPolygon(point: GeofencePoint, polygon: number[][]): boolean {
    let inside = false;
    const x = point.longitude;
    const y = point.latitude;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0];
      const yi = polygon[i][1];
      const xj = polygon[j][0];
      const yj = polygon[j][1];

      const intersect =
        yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }

    return inside;
  }

  isPointInCircle(
    point: GeofencePoint,
    center: GeofencePoint,
    radiusMeters: number
  ): boolean {
    const distance = this.calculateDistance(
      point.latitude,
      point.longitude,
      center.latitude,
      center.longitude
    );
    return distance <= radiusMeters;
  }

  async validateLocation(
    latitude: number,
    longitude: number,
    stationId?: string
  ): Promise<{ isValid: boolean; geofence: Geofence | null; distance?: number }> {
    try {
      let query = supabase
        .from('geofences')
        .select('*')
        .eq('is_active', true);

      if (stationId) {
        query = query.eq('station_id', stationId);
      }

      const { data: geofences, error } = await query;

      if (error) throw error;

      if (!geofences || geofences.length === 0) {
        return { isValid: false, geofence: null };
      }

      for (const geofence of geofences) {
        const point: GeofencePoint = { latitude, longitude };

        if (geofence.radius_meters) {
          const center: GeofencePoint = {
            latitude: Number(geofence.center_latitude),
            longitude: Number(geofence.center_longitude),
          };

          const isInCircle = this.isPointInCircle(
            point,
            center,
            Number(geofence.radius_meters)
          );

          if (isInCircle) {
            return { isValid: true, geofence, distance: 0 };
          }
        }

        if (geofence.boundary_coordinates?.coordinates?.[0]) {
          const polygon = geofence.boundary_coordinates.coordinates[0];
          const isInPolygon = this.isPointInPolygon(point, polygon);

          if (isInPolygon) {
            return { isValid: true, geofence, distance: 0 };
          }
        }
      }

      const nearestGeofence = geofences[0];
      const distance = this.calculateDistance(
        latitude,
        longitude,
        Number(nearestGeofence.center_latitude),
        Number(nearestGeofence.center_longitude)
      );

      return { isValid: false, geofence: nearestGeofence, distance };
    } catch (error) {
      console.error('Error validating location:', error);
      return { isValid: false, geofence: null };
    }
  }

  async logBoundaryViolation(
    userId: string,
    latitude: number,
    longitude: number,
    geofenceId: string | null,
    shiftId: string | null,
    distanceFromBoundary: number | null
  ): Promise<void> {
    try {
      const { error } = await supabase.from('boundary_violations').insert({
        user_id: userId,
        geofence_id: geofenceId,
        latitude,
        longitude,
        distance_from_boundary: distanceFromBoundary,
        shift_id: shiftId,
        acknowledged: false,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging boundary violation:', error);
      throw error;
    }
  }

  async getUserViolations(userId: string, limit: number = 20): Promise<BoundaryViolation[]> {
    try {
      const { data, error } = await supabase
        .from('boundary_violations')
        .select('*')
        .eq('user_id', userId)
        .order('violation_time', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching violations:', error);
      return [];
    }
  }

  async getAllViolations(limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('boundary_violations')
        .select(`
          *,
          profiles!boundary_violations_user_id_fkey(full_name, badge_number),
          geofences(station_name)
        `)
        .order('violation_time', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all violations:', error);
      return [];
    }
  }

  async acknowledgeViolation(
    violationId: string,
    adminId: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('boundary_violations')
        .update({
          acknowledged: true,
          acknowledged_by: adminId,
          acknowledged_at: new Date().toISOString(),
        })
        .eq('id', violationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error acknowledging violation:', error);
      throw error;
    }
  }

  async getActiveGeofences(): Promise<Geofence[]> {
    try {
      const { data, error } = await supabase
        .from('geofences')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching geofences:', error);
      return [];
    }
  }

  async createGeofence(geofenceData: Partial<Geofence>): Promise<Geofence | null> {
    try {
      const { data, error } = await supabase
        .from('geofences')
        .insert(geofenceData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating geofence:', error);
      return null;
    }
  }

  async updateGeofence(
    geofenceId: string,
    updates: Partial<Geofence>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('geofences')
        .update(updates)
        .eq('id', geofenceId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating geofence:', error);
      return false;
    }
  }
}

export const geofenceService = new GeofenceService();
