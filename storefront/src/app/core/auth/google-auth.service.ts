import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class GoogleAuthService {
  private readonly auth = inject(AuthService);
  private scriptPromise: Promise<void> | null = null;

  ensureScript(): Promise<void> {
    if (typeof window === 'undefined') {
      return Promise.resolve();
    }
    if (window.google?.accounts?.id) {
      return Promise.resolve();
    }
    if (this.scriptPromise) {
      return this.scriptPromise;
    }

    this.scriptPromise = new Promise<void>((resolve, reject) => {
      const existing = document.getElementById('google-identity-services');
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () =>
          reject(new Error('Google Identity script failed'))
        );
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-identity-services';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Google Identity script failed'));
      document.head.appendChild(script);
    });

    return this.scriptPromise;
  }

  async renderButton(
    container: HTMLElement,
    onCredential: (credential: string) => void
  ): Promise<void> {
    const clientId = environment.googleClientId;
    if (!clientId || clientId.startsWith('YOUR_GOOGLE')) {
      container.innerHTML =
        '<p class="google-placeholder">Google Client ID yapılandırılmadı.</p>';
      return;
    }

    await this.ensureScript();
    if (!window.google?.accounts?.id) {
      throw new Error('Google Identity Services unavailable');
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => onCredential(response.credential),
      ux_mode: 'popup',
    });

    container.innerHTML = '';
    window.google.accounts.id.renderButton(container, {
      theme: 'outline',
      size: 'large',
      shape: 'rectangular',
      text: 'continue_with',
      width: 320,
      locale: 'tr',
    });
  }
}
