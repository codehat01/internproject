import React, { useState, useRef, useCallback } from 'react'
import { Camera, MapPin, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export function Dashboard() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const getCurrentLocation = useCallback(() => {
    return new Promise<{ lat: number; lon: number }>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          })
        },
        (error) => {
          reject(new Error(`Location error: ${error.message}`))
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      )
    })
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setShowCamera(true)
      }
    } catch (error) {
      toast.error('Camera access denied or not available')
      console.error('Camera error:', error)
    }
  }

  const capturePhoto = (): string | null => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      if (context) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0)
        
        return canvas.toDataURL('image/jpeg', 0.8)
      }
    }
    return null
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setShowCamera(false)
  }

  const uploadPhoto = async (dataUrl: string): Promise<string> => {
    try {
      // Convert data URL to blob
      const response = await fetch(dataUrl)
      const blob = await response.blob()
      
      const fileName = `attendance/${profile?.id}/${Date.now()}.jpg`
      
      const { data, error } = await supabase.storage
        .from('photos')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: false
        })

      if (error) throw error

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('photos')
        .getPublicUrl(data.path)

      return urlData.publicUrl
    } catch (error) {
      console.error('Upload error:', error)
      throw new Error('Failed to upload photo')
    }
  }

  const handlePunch = async (type: 'in' | 'out') => {
    if (!profile) return
    
    setLoading(true)
    
    try {
      // Get location
      const locationData = await getCurrentLocation()
      setLocation(locationData)
      
      // Start camera
      await startCamera()
      
      toast.success(`Location captured! Please take your photo to ${type === 'in' ? 'punch in' : 'punch out'}.`)
    } catch (error: any) {
      toast.error(error.message)
      setLoading(false)
    }
  }

  const completePunch = async (type: 'in' | 'out') => {
    if (!profile || !location) return
    
    try {
      // Capture photo
      const photoDataUrl = capturePhoto()
      if (!photoDataUrl) {
        toast.error('Failed to capture photo')
        return
      }

      // Upload photo
      const photoUrl = await uploadPhoto(photoDataUrl)

      // Save attendance record
      const { error } = await supabase
        .from('attendance')
        .insert([
          {
            user_id: profile.id,
            punch_type: type,
            latitude: location.lat,
            longitude: location.lon,
            photo_url: photoUrl,
            timestamp: new Date().toISOString()
          }
        ])

      if (error) throw error

      // Stop camera
      stopCamera()
      
      const time = format(new Date(), 'hh:mm a')
      toast.success(
        <div className="flex items-center">
          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
          You punched {type} at {time}
        </div>,
        { duration: 4000 }
      )
      
      setLocation(null)
    } catch (error: any) {
      toast.error(error.message || 'Failed to record attendance')
    } finally {
      setLoading(false)
    }
  }

  const cancelPunch = () => {
    stopCamera()
    setLocation(null)
    setLoading(false)
  }

  if (showCamera) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Take Your Photo</h2>
          
          <div className="relative mb-6">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-64 object-cover rounded-lg bg-gray-100"
            />
            <canvas
              ref={canvasRef}
              className="hidden"
            />
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => completePunch(loading ? 'in' : 'out')}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 px-6 rounded-xl font-medium text-lg transition-colors duration-200 flex items-center justify-center"
            >
              <Camera className="h-6 w-6 mr-2" />
              Capture & Punch In
            </button>
            
            <button
              onClick={cancelPunch}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-4 px-6 rounded-xl font-medium text-lg transition-colors duration-200"
            >
              Cancel
            </button>
          </div>

          {location && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <div className="flex items-center text-green-800">
                <MapPin className="h-5 w-5 mr-2" />
                <span className="text-sm">
                  Location captured: {location.lat.toFixed(6)}, {location.lon.toFixed(6)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {profile?.name}!</h1>
        <p className="text-xl text-blue-100">Badge Number: {profile?.badge_number}</p>
        <p className="text-blue-200 mt-2">{format(new Date(), 'EEEE, MMMM do, yyyy')}</p>
      </div>

      {/* Punch In/Out Section */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Punch In</h2>
            <p className="text-gray-600 mb-6">Start your duty shift with location and photo verification</p>
            
            <button
              onClick={() => handlePunch('in')}
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 px-6 rounded-xl font-bold text-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? 'Processing...' : 'PUNCH IN'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center">
            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Punch Out</h2>
            <p className="text-gray-600 mb-6">End your duty shift with location and photo verification</p>
            
            <button
              onClick={() => handlePunch('out')}
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-4 px-6 rounded-xl font-bold text-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? 'Processing...' : 'PUNCH OUT'}
            </button>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <AlertCircle className="h-6 w-6 text-yellow-500 mr-2" />
          Attendance Instructions
        </h3>
        <div className="grid md:grid-cols-2 gap-6 text-gray-600">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Before Punching:</h4>
            <ul className="space-y-1 text-sm">
              <li>• Enable location services on your device</li>
              <li>• Allow camera access when prompted</li>
              <li>• Ensure good lighting for photo capture</li>
              <li>• Be at your assigned station location</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Security Features:</h4>
            <ul className="space-y-1 text-sm">
              <li>• GPS location is automatically recorded</li>
              <li>• Photo verification prevents proxy attendance</li>
              <li>• All records are immediately synced</li>
              <li>• Timestamps are server-verified</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}