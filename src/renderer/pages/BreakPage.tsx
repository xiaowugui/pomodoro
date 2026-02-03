import { useEffect, useState } from 'react';
import { BreakOverlay } from '../components';

export default function BreakPage() {
  // 使用本地状态管理时间
  const [timeRemaining, setTimeRemaining] = useState(5 * 60); // 默认5分钟
  const [totalTime, setTotalTime] = useState(5 * 60);
  const [breakType, setBreakType] = useState<'short_break' | 'long_break'>('short_break');

  useEffect(() => {
    // Parse URL params
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    
    if (type === 'short_break') {
      setBreakType('short_break');
      setTimeRemaining(5 * 60);
      setTotalTime(5 * 60);
    } else if (type === 'long_break') {
      setBreakType('long_break');
      setTimeRemaining(15 * 60);
      setTotalTime(15 * 60);
    }

    // Listen for time updates from main process
    window.electronAPI.onBreakTick(({ timeRemaining, totalTime }) => {
      setTimeRemaining(timeRemaining);
      setTotalTime(totalTime);
      
      // When break timer reaches 0, automatically complete
      if (timeRemaining === 0) {
        window.electronAPI.timerSkip();
        window.close();
      }
    });

    // Listen for window close action
    window.electronAPI.onBreakWindowAction((action: string) => {
      if (action === 'close') {
        // 结束休息
        window.electronAPI.timerSkip();
        window.close();
      }
    });

  }, []);

  const handleComplete = async () => {
    await window.electronAPI.timerSkip();
    window.close();
  };

  return (
    <BreakOverlay
      type={breakType}
      timeRemaining={timeRemaining}
      totalTime={totalTime}
      onComplete={handleComplete}
    />
  );
}
