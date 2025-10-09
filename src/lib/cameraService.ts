export interface CaptureOptions {
  width?: number;
  height?: number;
  facingMode?: 'user' | 'environment';
}

export class CameraService {
  private stream: MediaStream | null = null;

  async checkPermission(): Promise<boolean> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported');
      }

      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      return result.state === 'granted' || result.state === 'prompt';
    } catch (error) {
      console.error('Error checking camera permission:', error);
      return false;
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true
      });

      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return false;
    }
  }

  async capturePhoto(options: CaptureOptions = {}): Promise<string> {
    const {
      width = 640,
      height = 480,
      facingMode = 'user'
    } = options;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: width },
          height: { ideal: height },
          facingMode: facingMode
        }
      });

      const video = document.createElement('video');
      video.srcObject = this.stream;
      video.setAttribute('playsinline', 'true');

      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => {
          video.play();
          resolve();
        };
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Could not get canvas context');
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      this.stopStream();

      return canvas.toDataURL('image/jpeg', 0.8);
    } catch (error) {
      this.stopStream();
      console.error('Error capturing photo:', error);
      throw error;
    }
  }

  async capturePhotoWithPreview(): Promise<string> {
    return new Promise((resolve, reject) => {
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      `;

      const video = document.createElement('video');
      video.setAttribute('playsinline', 'true');
      video.style.cssText = `
        max-width: 90%;
        max-height: 70vh;
        border-radius: 10px;
      `;

      const buttonContainer = document.createElement('div');
      buttonContainer.style.cssText = `
        margin-top: 20px;
        display: flex;
        gap: 15px;
      `;

      const captureButton = document.createElement('button');
      captureButton.textContent = 'Capture Photo';
      captureButton.style.cssText = `
        padding: 12px 24px;
        background: #d4af37;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
      `;

      const cancelButton = document.createElement('button');
      cancelButton.textContent = 'Cancel';
      cancelButton.style.cssText = `
        padding: 12px 24px;
        background: #c0392b;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
      `;

      buttonContainer.appendChild(captureButton);
      buttonContainer.appendChild(cancelButton);
      modal.appendChild(video);
      modal.appendChild(buttonContainer);
      document.body.appendChild(modal);

      navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      }).then(stream => {
        this.stream = stream;
        video.srcObject = stream;
        video.play();

        captureButton.onclick = () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          const context = canvas.getContext('2d');
          if (!context) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

          this.stopStream();
          document.body.removeChild(modal);
          resolve(dataUrl);
        };

        cancelButton.onclick = () => {
          this.stopStream();
          document.body.removeChild(modal);
          reject(new Error('User cancelled photo capture'));
        };
      }).catch(error => {
        document.body.removeChild(modal);
        reject(error);
      });
    });
  }

  private stopStream(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  async uploadPhoto(dataUrl: string, userId: string, timestamp: string): Promise<string | null> {
    try {
      const base64Data = dataUrl.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });

      const fileName = `${userId}/${timestamp}.jpg`;

      return dataUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      return null;
    }
  }
}

export const cameraService = new CameraService();
