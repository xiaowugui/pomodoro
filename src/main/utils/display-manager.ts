import { screen, Display } from 'electron';

/**
 * DisplayManager - 管理多显示器配置
 * 借鉴 Stretchly 的 displayManager.js 实现
 */
export class DisplayManager {
  /**
   * 获取显示器数量
   */
  getDisplayCount(): number {
    return screen.getAllDisplays().length;
  }

  /**
   * 获取所有显示器
   */
  getAllDisplays(): Display[] {
    return screen.getAllDisplays();
  }

  /**
   * 获取主显示器
   */
  getPrimaryDisplay(): Display {
    return screen.getPrimaryDisplay();
  }

  /**
   * 获取指定显示器
   * @param displayId 显示器索引，-1 表示主显示器
   */
  getDisplay(displayId: number = -1): Display {
    const displays = this.getAllDisplays();
    
    if (displayId === -1 || displayId >= displays.length) {
      return this.getPrimaryDisplay();
    }
    
    return displays[displayId];
  }

  /**
   * 获取光标所在的显示器
   */
  getDisplayAtCursor(): Display {
    const cursorPoint = screen.getCursorScreenPoint();
    return screen.getDisplayNearestPoint(cursorPoint);
  }

  /**
   * 获取显示器宽度
   */
  getDisplayWidth(displayId: number = -1): number {
    return this.getDisplay(displayId).bounds.width;
  }

  /**
   * 获取显示器高度
   */
  getDisplayHeight(displayId: number = -1): number {
    return this.getDisplay(displayId).bounds.height;
  }

  /**
   * 获取显示器 X 坐标
   */
  getDisplayX(displayId: number = -1): number {
    return this.getDisplay(displayId).bounds.x;
  }

  /**
   * 获取显示器 Y 坐标
   */
  getDisplayY(displayId: number = -1): number {
    return this.getDisplay(displayId).bounds.y;
  }

  /**
   * 计算居中窗口的 X 坐标
   * @param displayId 显示器索引
   * @param windowWidth 窗口宽度
   * @param fullscreen 是否全屏
   */
  getCenteredX(displayId: number = -1, windowWidth: number, fullscreen: boolean = false): number {
    const display = this.getDisplay(displayId);
    
    if (fullscreen) {
      return display.bounds.x;
    }
    
    return Math.round(display.bounds.x + (display.bounds.width - windowWidth) / 2);
  }

  /**
   * 计算居中窗口的 Y 坐标
   * @param displayId 显示器索引
   * @param windowHeight 窗口高度
   * @param fullscreen 是否全屏
   */
  getCenteredY(displayId: number = -1, windowHeight: number, fullscreen: boolean = false): number {
    const display = this.getDisplay(displayId);
    
    if (fullscreen) {
      return display.bounds.y;
    }
    
    return Math.round(display.bounds.y + (display.bounds.height - windowHeight) / 2);
  }

  /**
   * 计算窗口大小（按百分比）
   * @param displayId 显示器索引
   * @param widthPercent 宽度百分比 (0.0 - 1.0)
   * @param heightPercent 高度百分比 (0.0 - 1.0)
   */
  getWindowSize(
    displayId: number = -1,
    widthPercent: number = 0.85,
    heightPercent: number = 0.85
  ): { width: number; height: number } {
    const display = this.getDisplay(displayId);
    
    return {
      width: Math.floor(display.bounds.width * widthPercent),
      height: Math.floor(display.bounds.height * heightPercent),
    };
  }

  /**
   * 获取工作区域（排除任务栏/菜单栏）
   */
  getWorkArea(displayId: number = -1): { x: number; y: number; width: number; height: number } {
    const display = this.getDisplay(displayId);
    return display.workArea;
  }

  /**
   * 获取工作区域大小
   */
  getWorkAreaSize(displayId: number = -1): { width: number; height: number } {
    const workArea = this.getWorkArea(displayId);
    return {
      width: workArea.width,
      height: workArea.height,
    };
  }
}

export const displayManager = new DisplayManager();
