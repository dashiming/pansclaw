#!/usr/bin/env python3
"""
股票走势图生成器 (支持真实数据和模拟数据)
Usage: python stock_chart.py AAPL
"""

import sys
import json
import random
import base64
from io import BytesIO
from datetime import datetime, timedelta

try:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    HAS_MATPLOTLIB = True
except ImportError:
    HAS_MATPLOTLIB = False

try:
    import yfinance as yf
    HAS_YFINANCE = True
except ImportError:
    HAS_YFINANCE = False

def get_stock_data(stock_code: str, period: str = "1mo") -> dict:
    """获取股票数据，真实数据失败时返回模拟数据"""
    
    if HAS_YFINANCE:
        try:
            stock = yf.Ticker(stock_code)
            hist = stock.history(period=period)
            if not hist.empty:
                dates = [d.strftime('%Y-%m-%d') for d in hist.index]
                closes = hist['Close'].tolist()
                volumes = hist['Volume'].tolist() if 'Volume' in hist.columns else []
                return {'success': True, 'dates': dates, 'closes': closes, 'volumes': volumes}
        except Exception as e:
            print(f"[警告] 真实数据获取失败，使用模拟数据: {e}", file=sys.stderr)
    
    # 生成模拟数据
    print(f"[模拟数据] 为 {stock_code} 生成", file=sys.stderr)
    base_price = random.uniform(50, 500)
    dates = []
    closes = []
    current_date = datetime.now()
    
    # 解析 period
    period_map = {'1w': 7, '1mo': 30, '3mo': 90, '6mo': 180, '1y': 365}
    days = period_map.get(period, 30)
    
    for i in range(days):
        date = current_date - timedelta(days=days-i-1)
        dates.append(date.strftime('%Y-%m-%d'))
        # 随机游走
        change = random.uniform(-0.03, 0.035)
        base_price = base_price * (1 + change)
        closes.append(round(base_price, 2))
    
    return {'success': True, 'dates': dates, 'closes': closes, 'volumes': [], 'simulated': True}

def generate_stock_chart(stock_code: str, period: str = "1mo") -> str:
    if not HAS_MATPLOTLIB:
        return None, "需要安装 matplotlib: pip install matplotlib"
    
    data = get_stock_data(stock_code, period)
    
    if not data['success']:
        return None, f"获取 {stock_code} 数据失败"
    
    closes = data['closes']
    dates = data['dates']
    
    if not closes:
        return None, f"未找到 {stock_code} 的有效数据"
    
    # 设置暗色主题
    plt.style.use('dark_background')
    fig, ax = plt.subplots(figsize=(12, 6), facecolor='#1a1a2e')
    ax.set_facecolor('#16213e')
    
    # 绘制收盘价曲线
    x = range(len(closes))
    ax.plot(x, closes, color='#60a5fa', linewidth=2, label='收盘价')
    ax.fill_between(x, closes, alpha=0.3, color='#60a5fa')
    
    # 添加模拟标签
    if data.get('simulated'):
        ax.text(0.02, 0.98, '[演示数据]', transform=ax.transAxes, 
                color='#fbbf24', fontsize=9, va='top',
                bbox=dict(boxstyle='round', facecolor='#1a1a2e', alpha=0.8))
    
    # 标题和标签
    ax.set_title(f'{stock_code} 股价走势 - 近{period}', color='white', fontsize=14, pad=15)
    ax.set_xlabel('日期', color='white', fontsize=10)
    ax.set_ylabel('价格 (USD)', color='white', fontsize=10)
    
    # X轴日期标签
    step = max(1, len(dates) // 6)
    ax.set_xticks(range(0, len(dates), step))
    ax.set_xticklabels([dates[i] for i in range(0, len(dates), step)], rotation=45, fontsize=8)
    
    # 网格
    ax.grid(True, alpha=0.2, color='white')
    ax.tick_params(colors='white', labelsize=9)
    
    # 最高/最低点标注
    max_price = max(closes)
    min_price = min(closes)
    max_idx = closes.index(max_price)
    min_idx = closes.index(min_price)
    
    ax.scatter([max_idx], [max_price], color='#4ade80', s=100, zorder=5)
    ax.scatter([min_idx], [min_price], color='#f87171', s=100, zorder=5)
    ax.annotate(f'最高: ${max_price:.2f}', xy=(max_idx, max_price), 
               xytext=(max_idx, max_price + (max_price * 0.05)),
               color='#4ade80', fontsize=9, ha='center')
    ax.annotate(f'最低: ${min_price:.2f}', xy=(min_idx, min_price),
               xytext=(min_idx, min_price - (min_price * 0.05)),
               color='#f87171', fontsize=9, ha='center')
    
    # 当前价格
    current = closes[-1]
    change = ((closes[-1] - closes[0]) / closes[0]) * 100
    color = '#4ade80' if change >= 0 else '#f87171'
    sign = '+' if change >= 0 else ''
    ax.text(0.98, 0.98, f'当前: ${current:.2f} ({sign}{change:.1f}%)', 
           transform=ax.transAxes, color=color, fontsize=11, va='top', ha='right',
           bbox=dict(boxstyle='round', facecolor='#1a1a2e', alpha=0.8))
    
    plt.tight_layout()
    
    # 保存到 BytesIO
    buffer = BytesIO()
    plt.savefig(buffer, format='png', dpi=100, bbox_inches='tight', 
               facecolor='#1a1a2e', edgecolor='none')
    buffer.seek(0)
    plt.close()
    
    # 转为 base64
    img_base64 = base64.b64encode(buffer.getvalue()).decode()
    return f"data:image/png;base64,{img_base64}", None

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python stock_chart.py <STOCK_CODE> [period]", file=sys.stderr)
        print("Example: python stock_chart.py AAPL 1mo", file=sys.stderr)
        sys.exit(1)
    
    stock_code = sys.argv[1].upper()
    period = sys.argv[2] if len(sys.argv) > 2 else "1mo"
    
    result, error = generate_stock_chart(stock_code, period)
    
    if error:
        print(f"Error: {error}", file=sys.stderr)
        sys.exit(1)
    else:
        print(result)
