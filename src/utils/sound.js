// تشغيل صوت تنبيه ناعم وجذاب عند وصول طلب أو تحديث جديد
export const playNotificationSound = () => {
  try {
    // نستخدم Web Audio API لبناء صوت تنبيه خفيف وسريع دون الحاجة لملفات mp3 خارجية
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    const audioCtx = new AudioContext();
    
    // النغمة الأولى
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    gain1.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start();
    osc1.stop(audioCtx.currentTime + 0.3);

    // النغمة الثانية (أعلى قليلاً)
    setTimeout(() => {
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      gain2.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);

      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start();
      osc2.stop(audioCtx.currentTime + 0.4);
    }, 150);
  } catch (e) {
    console.log('Audio playback error:', e);
  }
};