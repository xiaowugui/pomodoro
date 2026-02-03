import { SkipForward, Coffee, Sparkles, X } from 'lucide-react';

interface BreakOverlayProps {
  type: 'short_break' | 'long_break';
  timeRemaining: number;
  totalTime: number;
  onComplete: () => void;
}

export default function BreakOverlay({ 
  type, 
  timeRemaining, 
  totalTime,
  onComplete 
}: BreakOverlayProps) {
  
  // 确保时间值有效
  const validTimeRemaining = isNaN(timeRemaining) || timeRemaining < 0 ? 0 : timeRemaining;
  const validTotalTime = isNaN(totalTime) || totalTime <= 0 ? 1 : totalTime;
  
  // Calculate progress for ring
  const progress = ((validTotalTime - validTimeRemaining) / validTotalTime) * 100;
  const circumference = 2 * Math.PI * 80;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const isShortBreak = type === 'short_break';
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100vw',
      background: isShortBreak 
        ? 'linear-gradient(to bottom, #10b981, #0d9488, #0891b2)' 
        : 'linear-gradient(to bottom, #3b82f6, #2563eb, #1d4ed8)',
      padding: '24px',
      boxSizing: 'border-box'
    }}>
      {/* Content Container */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
        width: '100%',
        maxWidth: '320px'
      }}>
        {/* Icon */}
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          backgroundColor: 'rgba(255,255,255,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {isShortBreak ? (
            <Coffee size={28} color="white" />
          ) : (
            <Sparkles size={28} color="white" />
          )}
        </div>
        
        {/* Title */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '4px'
          }}>
            {isShortBreak ? '短休息' : '长休息'}
          </h1>
          <p style={{
            fontSize: '14px',
            color: 'rgba(255,255,255,0.7)'
          }}>
            {isShortBreak ? '短暂放松一下' : '好好休息充电'}
          </p>
        </div>
        
        {/* Timer with Ring */}
        <div style={{
          position: 'relative',
          width: '192px',
          height: '192px'
        }}>
          {/* Ring SVG */}
          <svg style={{
            width: '100%',
            height: '100%',
            transform: 'rotate(-90deg)'
          }} viewBox="0 0 180 180">
            {/* Background ring */}
            <circle
              cx="90"
              cy="90"
              r="80"
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="5"
            />
            {/* Progress ring */}
            <circle
              cx="90"
              cy="90"
              r="80"
              fill="none"
              stroke="white"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'all 1s linear' }}
            />
          </svg>
          
          {/* Time display */}
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{
              fontSize: '48px',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              color: 'white'
            }}>
              {formatTime(validTimeRemaining)}
            </span>
            <span style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,0.6)',
              marginTop: '4px'
            }}>剩余时间</span>
          </div>
        </div>
        
        {/* Progress text */}
        <p style={{
          fontSize: '14px',
          color: 'rgba(255,255,255,0.6)'
        }}>
          {Math.round(progress)}% 已完成
        </p>
        
        {/* Complete button */}
        <button
          onClick={onComplete}
          style={{
            width: '100%',
            padding: '12px 24px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.3)',
            backgroundColor: 'rgba(255,255,255,0.2)',
            color: 'white',
            fontSize: '16px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
          }}
        >
          <X size={16} />
          结束休息
        </button>
      </div>
    </div>
  );
}
