export class ZoomDetectionManager {
  private baseWidth = 1920;
  private baseHeight = 1080;
  private systemZoom = 1;
  private browserZoom = 1;

  constructor() {
    this.detectZoomLevels();
    this.setupEventListeners();
  }

  private getSystemZoom(): number {
    const dpr = window.devicePixelRatio || 1;
    
    const screenZoom = window.screen.width / window.screen.availWidth;
    
    const testDiv = document.createElement('div');
    testDiv.style.width = '1in';
    testDiv.style.height = '1in';
    testDiv.style.position = 'absolute';
    testDiv.style.left = '-100%';
    testDiv.style.top = '-100%';
    document.body.appendChild(testDiv);
    
    const computedInch = testDiv.offsetWidth;
    document.body.removeChild(testDiv);
    
    const dpiZoom = computedInch / 96;
    
    console.log('DPR:', dpr, 'Screen Zoom:', screenZoom, 'DPI Zoom:', dpiZoom);
    
    return dpiZoom;
  }

  private getBrowserZoom(): number {
    const browserZoom1 = window.screen.width / window.innerWidth / this.systemZoom;
    
    const browserZoom2 = window.outerWidth / window.innerWidth;
    
    let browserZoom3 = 1;
    const mqTests = [
      { zoom: 0.25, mq: '(max-resolution: 30dpi)' },
      { zoom: 0.5, mq: '(max-resolution: 60dpi)' },
      { zoom: 0.67, mq: '(max-resolution: 80dpi)' },
      { zoom: 0.75, mq: '(max-resolution: 90dpi)' },
      { zoom: 0.8, mq: '(max-resolution: 100dpi)' },
      { zoom: 0.9, mq: '(max-resolution: 110dpi)' },
      { zoom: 1, mq: '(max-resolution: 120dpi)' },
      { zoom: 1.1, mq: '(max-resolution: 130dpi)' },
      { zoom: 1.25, mq: '(max-resolution: 140dpi)' },
      { zoom: 1.5, mq: '(max-resolution: 170dpi)' },
      { zoom: 2, mq: '(max-resolution: 240dpi)' },
    ];
    
    for (const test of mqTests) {
      if (window.matchMedia(test.mq).matches) {
        browserZoom3 = test.zoom;
        break;
      }
    }
    
    console.log('Browser Zoom Methods:', browserZoom1, browserZoom2, browserZoom3);
    
    return browserZoom1;
  }

  private detectZoomLevels(): void {
    this.systemZoom = this.getSystemZoom();
    this.browserZoom = this.getBrowserZoom();
    
    console.log('System Zoom:', this.systemZoom, 'Browser Zoom:', this.browserZoom);
  }

  private calculateCompensation(): number {
    const totalZoom = this.systemZoom * this.browserZoom;
    const compensation = 1 / totalZoom;
    
    console.log('Total Zoom:', totalZoom, 'Compensation needed:', compensation);
    
    return compensation;
  }

  public applyZoomCompensation(): void {
    const compensation = this.calculateCompensation();
    
    document.body.style.zoom = compensation.toString();
    

    document.documentElement.style.setProperty('--zoom-compensation', compensation.toString());
  }

  public applyEnhancedScaling(): void {
    const availableWidth = window.innerWidth;
    const availableHeight = window.innerHeight;
    
    const scaleX = availableWidth / this.baseWidth;
    const scaleY = availableHeight / this.baseHeight;
    const baseScale = Math.min(scaleX, scaleY);
    
    const compensation = this.calculateCompensation();
    const finalScale = baseScale * compensation;
    
    const container = document.getElementById('app-scale-container');
    if (container) {
      container.style.transform = `scale(${finalScale})`;
      container.style.transformOrigin = '0 0';
      container.style.width = `${this.baseWidth}px`;
      container.style.height = `${this.baseHeight}px`;
      
      const scaledWidth = this.baseWidth * finalScale;
      const scaledHeight = this.baseHeight * finalScale;
      const offsetX = (availableWidth - scaledWidth) / 2;
      const offsetY = (availableHeight - scaledHeight) / 2;
      
      const wrapper = document.getElementById('app-wrapper');
      if (wrapper) {
        wrapper.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
      }
    }
    
    console.log('Applied scaling - Base:', baseScale, 'Compensation:', compensation, 'Final:', finalScale);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => {
      setTimeout(() => {
        this.detectZoomLevels();
        this.applyEnhancedScaling();
      }, 100);
    });

    const mediaQuery = window.matchMedia('(resolution: 1dppx)');
    mediaQuery.addListener(() => {
      setTimeout(() => {
        this.detectZoomLevels();
        this.applyEnhancedScaling();
      }, 100);
    });

    window.addEventListener('zoom', () => {
      setTimeout(() => {
        this.detectZoomLevels();
        this.applyEnhancedScaling();
      }, 100);
    });
  }

  public getZoomInfo(): { systemZoom: number; browserZoom: number; totalZoom: number } {
    return {
      systemZoom: this.systemZoom,
      browserZoom: this.browserZoom,
      totalZoom: this.systemZoom * this.browserZoom
    };
  }
}