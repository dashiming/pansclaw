# Stock Chart Generator

生成股票走势图并返回图表。

## 触发条件

当用户请求生成股票走势图、K线图、或股票数据分析时触发。

## 输入参数

```json
{
  "stockCode": "AAPL",
  "period": "1mo"
}
```

## 输出

生成的图表文件路径，或 base64 编码的图片数据。

## 实现步骤

1. 解析股票代码（支持 AAPL、TSLA 等美股，或 600519 等A股）
2. 使用 `yfinance` 获取历史数据
3. 使用 `matplotlib` 或 `plotly` 生成 K 线/折线图
4. 保存为 PNG 返回

## 示例命令

```python
import yfinance as yf
import matplotlib.pyplot as plt
from datetime import datetime, timedelta

def generate_stock_chart(stock_code: str, period: str = "1mo") -> str:
    stock = yf.Ticker(stock_code)
    hist = stock.history(period=period)

    plt.figure(figsize=(12, 6))
    plt.plot(hist.index, hist['Close'], color='#60a5fa', linewidth=2)
    plt.title(f'{stock_code} Stock Price - Last {period}', color='white', fontsize=14)
    plt.xlabel('Date', color='white')
    plt.ylabel('Price (USD)', color='white')
    plt.style.use('dark_background')
    plt.grid(True, alpha=0.3)

    output_path = f'/tmp/{stock_code}_chart.png'
    plt.savefig(output_path, dpi=100, bbox_inches='tight', facecolor='#1a1a2e')
    plt.close()

    return output_path
```
