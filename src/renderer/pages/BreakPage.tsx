import { useEffect, useState, useCallback, useRef } from 'react';
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

  // 使用 ref 存储计时器状态，避免闭包问题
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timeRemainingRef = useRef<number>(5 * 60);
  const totalTimeRef = useRef<number>(5 * 60);

  useEffect(() => {
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

    // 请求初始计时器状态
    if (window.electronAPI?.getTimerState) {
      window.electronAPI.getTimerState().then((state: any) => {
        console.log('[BreakPage] getTimerState returned:', JSON.stringify(state));
        if (state) {
          const initialTime = state.timeRemaining || 5 * 60;
          const initialTotal = state.totalTime || 5 * 60;
          
          setTimeRemaining(initialTime);
          setTotalTime(initialTotal);
          
          // 根据 phase 设置 breakType
          if (state.phase === 'long_break') {
            setBreakType('long_break');
          } else {
            setBreakType('short_break');
          }
          
          // 启动本地计时器确保倒计时正常工作
          startLocalTimer(initialTime, initialTotal);
        }
      });
    }

    // 本地备用计时器 - 确保倒计时始终正常工作
    const startLocalTimer = (initialTime: number, initialTotal: number) => {
      // 清除之前的计时器
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // 更新 ref
      timeRemainingRef.current = initialTime;
      totalTimeRef.current = initialTotal;
      
      // 启动本地计时器
      timerRef.current = setInterval(() => {
        if (timeRemainingRef.current > 0) {
          timeRemainingRef.current -= 1;
          setTimeRemaining(timeRemainingRef.current);
          console.log('[BreakPage] Local timer tick:', timeRemainingRef.current);
          
          // 倒计时结束时自动完成
          if (timeRemainingRef.current === 0) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            handleComplete();
          }
        }
      }, 1000);
    };

    // 监听时间更新 - 使用本地计时器作为主要机制
    const handleBreakTick = (data: any) => {
      console.log('[BreakPage] Received break tick from IPC:', JSON.stringify(data));
      
      // 更新 ref 值
      timeRemainingRef.current = data.timeRemaining;
      totalTimeRef.current = data.totalTime;
      
      // 同步状态（仅用于显示，实际倒计时由本地计时器驱动）
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
      // 注意：倒计时结束由本地计时器处理
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
      // 清理本地计时器
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
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
