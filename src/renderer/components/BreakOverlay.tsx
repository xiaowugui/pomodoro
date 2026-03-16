import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Coffee, Sparkles, X, Clock, Zap } from 'lucide-react';

interface BreakOverlayProps {
  type: 'short_break' | 'long_break';
  timeRemaining: number;
  totalTime: number;
  onComplete: () => void;
  onPostpone?: () => void;
  canPostpone?: boolean;
  postponeCount?: number;
  postponeLimit?: number;
  strictMode?: boolean;
  endBreakShortcut?: string;
  postponeShortcut?: string;
}

export default function BreakOverlay({ 
  type, 
  timeRemaining, 
  totalTime,
  onComplete,
  onPostpone,
  canPostpone = false,
  postponeCount = 0,
  postponeLimit = 1,
  strictMode = false,
  endBreakShortcut = 'Ctrl+X',
  postponeShortcut = 'Ctrl+P',
}: BreakOverlayProps) {
  const { t } = useTranslation();
  const [isFullscreen, setIsFullscreen] = useState(true);
  
  // 检测屏幕尺寸
  useEffect(() => {
    const checkFullscreen = () => {
      const isFS = window.innerWidth > 800 || window.innerHeight > 600;
      setIsFullscreen(isFS);
    };
    
    checkFullscreen();
    window.addEventListener('resize', checkFullscreen);
    return () => window.removeEventListener('resize', checkFullscreen);
  }, []);
  
  // 确保时间值有效
  const validTimeRemaining = isNaN(timeRemaining) || timeRemaining < 0 ? 0 : timeRemaining;
  const validTotalTime = isNaN(totalTime) || totalTime <= 0 ? 1 : totalTime;
  
  // 计算进度
  const progress = ((validTotalTime - validTimeRemaining) / validTotalTime) * 100;
  
  // 格式化时间显示
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const isShortBreak = type === 'short_break';
  const remainingPostpones = postponeLimit - postponeCount;
  
  // 计算进度环 - 增加尺寸以确保数字不被裁剪
  const ringSize = isFullscreen ? 420 : 280;
  const circumference = 2 * Math.PI * (ringSize / 2 - 12);
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100vw',
      background: isShortBreak 
        ? '#10b981' // 短休息 - 纯绿色
        : '#3b82f6', // 长休息 - 纯蓝色
      padding: isFullscreen ? '40px' : '20px',
      boxSizing: 'border-box',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* 中央内容容器 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isFullscreen ? '40px' : '28px',
        width: '100%',
        maxWidth: isFullscreen ? '500px' : '340px',
      }}>
        
        {/* 休息类型图标 */}
        <div style={{
          width: isFullscreen ? 80 : 56,
          height: isFullscreen ? 80 : 56,
          borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          {isShortBreak ? (
            <Coffee size={isFullscreen ? 40 : 28} color="white" strokeWidth={2} />
          ) : (
            <Sparkles size={isFullscreen ? 40 : 28} color="white" strokeWidth={2} />
          )}
        </div>
        
        {/* 休息标题 */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontSize: isFullscreen ? '36px' : '24px',
            fontWeight: 'bold',
            color: 'white',
            margin: '0 0 8px 0',
            letterSpacing: '2px',
          }}>
            {isShortBreak ? t('break.shortBreak') : t('break.longBreak')}
          </h1>
          <p style={{
            fontSize: isFullscreen ? '16px' : '13px',
            color: 'rgba(255,255,255,0.85)',
            margin: 0,
          }}>
            {isShortBreak ? t('break.restEyes') : t('break.restEnergy')}
          </p>
        </div>
        
        {/* 中央倒计时 - 醒目大字体 */}
        <div style={{
          position: 'relative',
          width: ringSize,
          height: ringSize,
          flexShrink: 0,
        }}>
          {/* 进度环 */}
          <svg style={{
            width: '100%',
            height: '100%',
            transform: 'rotate(-90deg)',
          }} viewBox={`0 0 ${ringSize} ${ringSize}`}>
            {/* 背景环 */}
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={ringSize / 2 - 12}
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth={10}
            />
            {/* 进度环 */}
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={ringSize / 2 - 12}
              fill="none"
              stroke="white"
              strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ 
                transition: 'stroke-dashoffset 1s linear',
              }}
            />
          </svg>
          
          {/* 中央大倒计时 */}
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{
              fontSize: isFullscreen ? '120px' : '72px',
              fontFamily: '"SF Mono", Monaco, "Cascadia Code", monospace',
              fontWeight: 'bold',
              color: 'white',
              lineHeight: 1,
              letterSpacing: '4px',
            }}>
              {formatTime(validTimeRemaining)}
            </span>
            <span style={{
              fontSize: isFullscreen ? '18px' : '14px',
              color: 'rgba(255,255,255,0.7)',
              marginTop: '8px',
              fontWeight: 500,
            }}>
              {t('break.timeRemaining')}
            </span>
          </div>
        </div>
        
        {/* 进度百分比 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 16px',
          backgroundColor: 'rgba(255,255,255,0.15)',
          borderRadius: '20px',
        }}>
          <Clock size={16} color="white" />
          <span style={{
            fontSize: '14px',
            color: 'white',
            fontWeight: 600,
          }}>
            {Math.round(progress)}% {t('break.completed')}
          </span>
        </div>
        
        {/* 中央按钮区域 */}
        <div style={{
          display: 'flex',
          flexDirection: isFullscreen ? 'row' : 'column',
          gap: '16px',
          width: '100%',
          maxWidth: isFullscreen ? '480px' : '100%',
          marginTop: '8px',
        }}>
          {/* 推迟按钮 */}
          {canPostpone && remainingPostpones > 0 && onPostpone && (
            <button
              onClick={onPostpone}
              style={{
                flex: isFullscreen ? 1 : undefined,
                padding: isFullscreen ? '18px 32px' : '14px 24px',
                borderRadius: '12px',
                border: '2px solid white',
                backgroundColor: 'transparent',
                color: 'white',
                fontSize: isFullscreen ? '18px' : '15px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Zap size={20} />
              {t('break.postponeBreak', { shortcut: postponeShortcut })}
            </button>
          )}
          
          {/* 结束/跳过休息按钮 - 更醒目的实心按钮 */}
          <button
            onClick={onComplete}
            disabled={strictMode}
            style={{
              flex: isFullscreen ? 1 : undefined,
              padding: isFullscreen ? '18px 32px' : '14px 24px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: strictMode ? 'rgba(255,255,255,0.3)' : 'white',
              color: isShortBreak ? '#10b981' : '#3b82f6',
              fontSize: isFullscreen ? '18px' : '15px',
              fontWeight: 700,
              cursor: strictMode ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'all 0.2s ease',
              boxShadow: strictMode ? 'none' : '0 4px 14px rgba(0,0,0,0.2)',
              opacity: strictMode ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!strictMode) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!strictMode) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.2)';
              }
            }}
          >
            <X size={20} />
            {strictMode ? t('break.cannotSkipDuringBreak') : t('break.skipWithShortcut', { shortcut: endBreakShortcut })}
          </button>
        </div>
        
        {/* 底部提示信息 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          marginTop: '8px',
        }}>
          {canPostpone && remainingPostpones > 0 && (
            <span style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.7)',
            }}>
              {t('break.remainingPostpones', { count: remainingPostpones })}
            </span>
          )}
          {!strictMode && (
            <span style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,0.5)',
            }}>
              {t('break.shortcut')}: {endBreakShortcut} {t('break.skipBreak')}{canPostpone && remainingPostpones > 0 ? ` | ${postponeShortcut} ${t('break.postpone')}` : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
