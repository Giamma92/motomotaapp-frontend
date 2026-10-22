import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HapticService {
  private iosLabel?: HTMLElement;
  private audioCtx?: AudioContext;

  constructor() {
    this.initIosHaptic();
  }

  /**
   * Inietta un interruttore nativo nascosto.
   * Su iOS 17.4+ e iOS 18+, simulare un click sulla label di un
   * <input type="checkbox" switch> attiva direttamente il motore Taptic di iOS.
   */
  private initIosHaptic(): void {
    if (typeof document === 'undefined') return;

    try {
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.top = '-9999px';
      container.style.left = '-9999px';
      container.style.opacity = '0';
      container.style.pointerEvents = 'none';
      container.setAttribute('aria-hidden', 'true');
      container.innerHTML = `
        <input type="checkbox" switch id="ios-haptic-trigger" style="display:none">
        <label for="ios-haptic-trigger" id="ios-haptic-label" style="display:none">haptic</label>
      `;
      document.body.appendChild(container);
      this.iosLabel = document.getElementById('ios-haptic-label') || undefined;
    } catch {
      // Ignora se eseguito prima del mount del DOM
    }
  }

  private triggerIosTaptic(): void {
    try {
      if (this.iosLabel) {
        this.iosLabel.click();
      }
    } catch {}
  }

  /**
   * Genera un micro-impulso tattile a bassa frequenza tramite Web Audio API.
   * Garantisce un feedback immediato e percepibile sui dispositivi Apple
   * che limitano l'API navigator.vibrate.
   */
  private playTactileImpulse(freq: number = 140, duration: number = 0.015): void {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;

      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        this.audioCtx = new AudioCtxClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(25, this.audioCtx.currentTime + duration);

      gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch {}
  }

  /**
   * Vibrazione leggera (tap voci navbar, pulsanti, cambi tab)
   */
  light(): void {
    this.vibrate(10);
    this.triggerIosTaptic();
    this.playTactileImpulse(180, 0.012);
  }

  /**
   * Vibrazione media (apertura modali, salvataggi)
   */
  medium(): void {
    this.vibrate(22);
    this.triggerIosTaptic();
    this.playTactileImpulse(140, 0.018);
  }

  /**
   * Vibrazione di successo (scommessa confermata, login riuscito)
   */
  success(): void {
    this.vibrate([15, 45, 20]);
    this.triggerIosTaptic();
    setTimeout(() => this.triggerIosTaptic(), 50);
    this.playTactileImpulse(220, 0.025);
  }

  /**
   * Vibrazione di attenzione o errore
   */
  warning(): void {
    this.vibrate([25, 40, 25]);
    this.triggerIosTaptic();
    this.playTactileImpulse(90, 0.03);
  }

  /**
   * Vibrazione di errore
   */
  error(): void {
    this.warning();
  }

  /**
   * Feedback aptico "tiro di corda" / cricchetto di avviamento a strappo MotoGP.
   * Scatta progressivamente durante il trascinamento del pull-to-refresh:
   * ad ogni tacca aumenta frequenza e tensione meccanica.
   */
  ropePullTick(tensionStep: number): void {
    const duration = Math.min(18, 6 + tensionStep * 2);
    this.vibrate(duration);
    this.triggerIosTaptic();
    const freq = 130 + tensionStep * 28;
    this.playTactileImpulse(freq, 0.009);
  }

  /**
   * Scatto a strappo quando la corda viene tesa oltre la soglia e innesca l'avviamento.
   */
  ropeSnap(): void {
    this.vibrate([16, 25, 20]);
    this.triggerIosTaptic();
    setTimeout(() => this.triggerIosTaptic(), 35);
    this.playTactileImpulse(340, 0.02);
  }

  private vibrate(pattern: number | number[]): void {
    try {
      if (typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function') {
        navigator.vibrate(pattern);
      }
    } catch {}
  }
}
