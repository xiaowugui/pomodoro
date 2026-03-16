import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import BreakOverlay from '../components/BreakOverlay';
import { Bot, Check, Circle } from 'lucide-react';

export default function BreakPage() {
  const { t } = useTranslation();
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
  // AI 任务弹窗状态
  const [showAiTasks, setShowAiTasks] = useState(false);
  const [aiTasks, setAiTasks] = useState<any[]>([]);

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

    // 加载 AI 任务
    const loadAiTasks = async () => {
      try {
        if (window.electronAPI?.getTasks) {
          const allTasks = await window.electronAPI.getTasks();
          const aiTaskList = (allTasks || []).filter((t: any) => t.taskType === 'ai' && t.status === 'active');
          setAiTasks(aiTaskList);
          if (aiTaskList.length > 0) {
            setShowAiTasks(true);
          }
        }
      } catch (error) {
        console.error('Failed to load AI tasks:', error);
      }
    };
    loadAiTasks();
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

  const handleToggleAiTask = async (taskId: string) => {
    const task = aiTasks.find(t => t.id === taskId);
    if (!task) return;
    const newStatus = task.status === 'completed' ? 'active' : 'completed';
    await window.electronAPI.updateTask({ ...task, status: newStatus });
    setAiTasks(aiTasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  const handleConfirmAiTasks = () => {
    setShowAiTasks(false);
    handleComplete();
  };

  // 排序 AI 任务：运行中 > 未发起 > 已完成（不显示）
  const sortedAiTasks = aiTasks
    .filter(t => t.status !== 'completed')
    .sort((a, b) => {
      if (a.completedPomodoros > 0 && b.completedPomodoros === 0) return -1;
      if (a.completedPomodoros === 0 && b.completedPomodoros > 0) return 1;
      return 0;
    });

  return (
    <>
      <BreakOverlay
        type={breakType}
        timeRemaining={timeRemaining}
        totalTime={totalTime}
        onComplete={showAiTasks && sortedAiTasks.length > 0 ? () => {} : handleComplete}
        onPostpone={postponeEnabled && !showAiTasks ? handlePostpone : undefined}
        canPostpone={canPostpone && postponeEnabled && !showAiTasks}
        postponeCount={postponeCount}
        postponeLimit={postponeLimit}
        strictMode={strictMode && !showAiTasks}
        endBreakShortcut={endBreakShortcut}
        postponeShortcut={postponeShortcut}
      />
      {showAiTasks && sortedAiTasks.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Bot className="w-6 h-6 text-purple-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('break.breakPage.checkAiTasks')}
              </h2>
            </div>
            <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
              {sortedAiTasks.map(task => (
                <div key={task.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <button onClick={() => handleToggleAiTask(task.id)}>
                    {task.status === 'completed' ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-300" />
                    )}
                  </button>
                  <span className={`flex-1 ${task.status === 'completed' ? 'line-through text-gray-400' : ''}`}>
                    {task.title}
                  </span>
                  {task.completedPomodoros > 0 && task.status !== 'completed' && (
                    <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded">{t('break.breakPage.running')}</span>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={handleConfirmAiTasks}
              className="w-full py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
            >
              {t('break.breakPage.confirmStartFocus')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
