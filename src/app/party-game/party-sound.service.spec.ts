import { TestBed } from '@angular/core/testing';
import { PartySoundService } from './party-sound.service';

describe('PartySoundService', () => {
  let service: PartySoundService;

  beforeEach(() => {
    localStorage.removeItem('lemon-party:sound-muted');
    TestBed.configureTestingModule({});
    service = TestBed.inject(PartySoundService);
  });

  it('should be created with sound enabled by default', () => {
    expect(service).toBeTruthy();
    expect(service.isMuted()).toBeFalse();
  });

  it('should toggle sound muting and persist in localStorage', () => {
    const isMutedNow = service.toggleMute();
    expect(isMutedNow).toBeTrue();
    expect(service.isMuted()).toBeTrue();
    expect(localStorage.getItem('lemon-party:sound-muted')).toBe('true');

    const isUnmutedNow = service.toggleMute();
    expect(isUnmutedNow).toBeFalse();
    expect(service.isMuted()).toBeFalse();
    expect(localStorage.getItem('lemon-party:sound-muted')).toBe('false');
  });

  it('should not throw when triggering sound effects', () => {
    expect(() => {
      service.playTick();
      service.playClick();
      service.playWin();
      service.playClash();
    }).not.toThrow();
  });
});
