import { useState, useEffect } from 'react';
import { Coffee, Sparkles, X, Clock, AlertCircle, Zap } from 'lucide-react';

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
  const [isFullscreen, setIsFullscreen] = useState(true);
  
  // 检测屏幕尺寸判断是否全屏
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
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const isShortBreak = type === 'short_break';
  
  // 根据全屏状态调整尺寸
  const iconSize = isFullscreen ? 48 : 28;
  const titleSize = isFullscreen ? '48px' : '24px';
  const subtitleSize = isFullscreen ? '20px' : '14px';
  const timerSize = isFullscreen ? '96px' : '48px';
  const ringSize = isFullscreen ? 280 : 192;
  const circumference = 2 * Math.PI * (ringSize / 2 - 10);
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  // 计算剩余推迟次数
  const remainingPostpones = postponeLimit - postponeCount;
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100vw',
      background: isShortBreak 
        ? 'linear-gradient(135deg, #10b981 0%, #0d9488 50%, #0891b2 100%)' 
        : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)',
      padding: isFullscreen ? '48px' : '24px',
      boxSizing: 'border-box',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* 内容容器 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: isFullscreen ? '32px' : '24px',
        width: '100%',
        maxWidth: isFullscreen ? '600px' : '320px',
      }}>
        {/* 图标 */}
        <div style={{
          width: isFullscreen ? 96 : 56,
          height: isFullscreen ? 96 : 56,
          borderRadius: isFullscreen ? 24 : 16,
          backgroundColor: 'rgba(255,255,255,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(10px)',
        }}>
          {isShortBreak ? (
            <Coffee size={iconSize} color="white" />
          ) : (
            <Sparkles size={iconSize} color="white" />
          )}
        </div>
        
        {/* 标题区域 */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontSize: titleSize,
            fontWeight: 'bold',
            color: 'white',
            margin: '0 0 8px 0',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}>
            {isShortBreak ? '短休息' : '长休息'}
          </h1>
          <p style={{
            fontSize: subtitleSize,
            color: 'rgba(255,255,255,0.85)',
            margin: 0,
          }}>
            {isShortBreak ? '短暂放松一下，让眼睛休息' : '好好休息充电，恢复精力'}
          </p>
        </div>
        
        {/* 严格模式指示器 */}
        {strictMode && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            borderRadius: '20px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}>
            <AlertCircle size={16} color="#fca5a5" />
            <span style={{
              fontSize: '14px',
              color: '#fca5a5',
              fontWeight: 500,
            }}>
              严格模式 - 休息期间无法关闭窗口
            </span>
          </div>
        )}
        
        {/* 计时器环形 */}
        <div style={{
          position: 'relative',
          width: ringSize,
          height: ringSize,
        }}>
          {/* 环形背景 */}
          <svg style={{
            width: '100%',
            height: '100%',
            transform: 'rotate(-90deg)',
          }} viewBox={`0 0 ${ringSize} ${ringSize}`}>
            {/* 背景环 */}
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={ringSize / 2 - 10}
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth={isFullscreen ? 8 : 5}
            />
            {/* 进度环 */}
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={ringSize / 2 - 10}
              fill="none"
              stroke="white"
              strokeWidth={isFullscreen ? 8 : 5}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ 
                transition: 'stroke-dashoffset 1s linear',
                filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.3))',
              }}
            />
          </svg>
          
          {/* 时间显示 */}
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{
              fontSize: timerSize,
              fontFamily: 'monospace',
              fontWeight: 'bold',
              color: 'white',
              textShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}>
              {formatTime(validTimeRemaining)}
            </span>
            <span style={{
              fontSize: isFullscreen ? '16px' : '12px',
              color: 'rgba(255,255,255,0.7)',
              marginTop: '4px',
            }}>
              剩余时间
            </span>
          </div>
        </div>
        
        {/* 进度文本 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderRadius: '16px',
          }}>
            <Clock size={14} color="rgba(255,255,255,0.8)" />
            <span style={{
              fontSize: '14px',
              color: 'rgba(255,255,255,0.8)',
            }}>
              {Math.round(progress)}% 已完成
            </span>
          </div>
          
          {canPostpone && remainingPostpones > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: 'rgba(251, 191, 36, 0.2)',
              borderRadius: '16px',
            }}>
              <Zap size={14} color="#fbbf24" />
              <span style={{
                fontSize: '14px',
                color: '#fbbf24',
              }}>
                可推迟 {remainingPostpones} 次
              </span>
            </div>
          )}
        </div>
        
        {/* 按钮区域 */}
        <div style={{
          display: 'flex',
          flexDirection: isFullscreen ? 'row' : 'column',
          gap: '12px',
          width: '100%',
          maxWidth: isFullscreen ? '500px' : '100%',
        }}>
          {/* 推迟按钮 */}
          {canPostpone && remainingPostpones > 0 && onPostpone && (
            <button
              onClick={onPostpone}
              style={{
                flex: isFullscreen ? 1 : undefined,
                padding: isFullscreen ? '16px 24px' : '12px 24px',
                borderRadius: '12px',
                border: '2px solid rgba(251, 191, 36, 0.5)',
                backgroundColor: 'rgba(251, 191, 36, 0.1)',
                color: '#fbbf24',
                fontSize: isFullscreen ? '16px' : '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(10px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(251, 191, 36, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.7)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(251, 191, 36, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.5)';
              }}
            >
              <Clock size={18} />
              推迟休息 ({postponeShortcut})
            </button>
          )}
          
          {/* 结束休息按钮 */}
          <button
            onClick={onComplete}
            style={{
              flex: isFullscreen ? 1 : undefined,
              padding: isFullscreen ? '16px 24px' : '12px 24px',
              borderRadius: '12px',
              border: '2px solid rgba(255,255,255,0.3)',
              backgroundColor: 'rgba(255,255,255,0.15)',
              color: 'white',
              fontSize: isFullscreen ? '16px' : '14px',
              fontWeight: 600,
              cursor: strictMode ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(10px)',
              opacity: strictMode ? 0.5 : 1,
            }}
            disabled={strictMode}
            onMouseEnter={(e) => {
              if (!strictMode) {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
            }}
          >
            <X size={18} />
            {strictMode ? '休息期间无法结束' : `结束休息 (${endBreakShortcut})`}
          </button>
        </div>
        
        {/* 快捷键提示 */}
        {!strictMode && (
          <div style={{
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}>
            <span style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,0.5)',
            }}>
              快捷键: {endBreakShortcut} 结束
            </span>
            {canPostpone && remainingPostpones > 0 && (
              <span style={{
                fontSize: '12px',
                color: 'rgba(255,255,255,0.5)',
              }}>
                {postponeShortcut} 推迟
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
