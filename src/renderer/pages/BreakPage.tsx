import { useEffect, useState, useCallback } from 'react';
import BreakOverlay from '../components/BreakOverlay';

export default function BreakPage() {
  // 状态管理
  const [timeRemaining, setTimeRemaining] = useState(5 * 60);
  const [totalTime, setTotalTime] = useState(5 * 60);
  const [breakType, setBreakType] = useState<'short_break' | 'long_break'>('short_break');
  const [canPostpone, setCanPostpone] = useState(true);
  const [postponeCount, setPostponeCount] = useState(0);
  const [postponeLimit, setPostponeLimit] = useState(1);
  const [strictMode, setStrictMode] = useState(false);
  const [endBreakShortcut, setEndBreakShortcut] = useState('Ctrl+X');
  const [postponeShortcut, setPostponeShortcut] = useState('Ctrl+P');
  const [postponeEnabled, setPostponeEnabled] = useState(true);

  useEffect(() => {
    // 解析 URL 参数
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type') as 'short_break' | 'long_break';
    
    if (type === 'short_break') {
      setBreakType('short_break');
      setTimeRemaining(5 * 60);
      setTotalTime(5 * 60);
    } else if (type === 'long_break') {
      setBreakType('long_break');
      setTimeRemaining(15 * 60);
      setTotalTime(15 * 60);
    }

    // 监听时间更新
    const handleBreakTick = (data: any) => {
      setTimeRemaining(data.timeRemaining);
      setTotalTime(data.totalTime);
      
      // 更新可推迟状态
      if (data.canPostpone !== undefined) {
        setCanPostpone(data.canPostpone);
      }
      if (data.postponeCount !== undefined) {
        setPostponeCount(data.postponeCount);
      }
      if (data.postponeLimit !== undefined) {
        setPostponeLimit(data.postponeLimit);
      }
      
      // 倒计时结束时自动完成
      if (data.timeRemaining === 0) {
        handleComplete();
      }
    };

    // 监听推迟计数更新
    const handlePostponeCount = (data: any) => {
      setPostponeCount(data.count);
      setPostponeLimit(data.limit);
    };

    // 监听严格模式
    const handleStrictMode = (data: any) => {
      setStrictMode(data.enabled);
    };

    // 注册事件监听
    if (window.electronAPI?.onBreakTick) {
      window.electronAPI.onBreakTick(handleBreakTick);
    }
    
    if (window.electronAPI?.onBreakPostponeCount) {
      window.electronAPI.onBreakPostponeCount(handlePostponeCount);
    }
    
    if (window.electronAPI?.onBreakStrictMode) {
      window.electronAPI.onBreakStrictMode(handleStrictMode);
    }

    // 请求初始设置
    if (window.electronAPI?.getBreakSettings) {
      window.electronAPI.getBreakSettings().then((settings: any) => {
        if (settings) {
          setStrictMode(settings.breakStrictMode || false);
          setPostponeEnabled(settings.postponeEnabled !== false);
          setPostponeLimit(settings.postponeLimit || 1);
          setEndBreakShortcut(formatShortcut(settings.endBreakShortcut || 'CommandOrControl+X'));
          setPostponeShortcut(formatShortcut(settings.postponeBreakShortcut || 'CommandOrControl+P'));
        }
      });
    }

    return () => {
      // 清理事件监听
      if (window.electronAPI?.removeAllListeners) {
        window.electronAPI.removeAllListeners('break-tick');
        window.electronAPI.removeAllListeners('break-postpone-count');
        window.electronAPI.removeAllListeners('break-strict-mode');
      }
    };
  }, []);

  // 格式化快捷键显示
  const formatShortcut = (shortcut: string): string => {
    return shortcut
      .replace('CommandOrControl', 'Ctrl')
      .replace('Command', 'Cmd')
      .replace('Control', 'Ctrl')
      .replace('Shift', 'Shift')
      .replace('Alt', 'Alt');
  };

  // 完成休息
  const handleComplete = useCallback(async () => {
    try {
      if (window.electronAPI?.breakComplete) {
        await window.electronAPI.breakComplete();
      } else {
        // 兼容旧版
        await window.electronAPI?.timerSkip?.();
      }
    } catch (error) {
      console.error('Error completing break:', error);
    } finally {
      window.close();
    }
  }, []);

  // 推迟休息
  const handlePostpone = useCallback(async () => {
    if (!canPostpone || postponeCount >= postponeLimit) return;
    
    try {
      if (window.electronAPI?.breakPostpone) {
        const success = await window.electronAPI.breakPostpone();
        if (success) {
          // 推迟成功后关闭窗口
          window.close();
        }
      }
    } catch (error) {
      console.error('Error postponing break:', error);
    }
  }, [canPostpone, postponeCount, postponeLimit]);

  return (
    <BreakOverlay
      type={breakType}
      timeRemaining={timeRemaining}
      totalTime={totalTime}
      onComplete={handleComplete}
      onPostpone={postponeEnabled ? handlePostpone : undefined}
      canPostpone={canPostpone && postponeEnabled}
      postponeCount={postponeCount}
      postponeLimit={postponeLimit}
      strictMode={strictMode}
      endBreakShortcut={endBreakShortcut}
      postponeShortcut={postponeShortcut}
    />
  );
}
