import sys
sys.path.append('/opt/.manus/.sandbox-runtime')
from data_api import ApiClient
import json

class MarketDataService:
    def __init__(self):
        self.client = ApiClient()
    
    def get_stock_data(self, symbol, interval='1d', range='1mo'):
        """
        Fetch stock market data using Yahoo Finance API
        
        Args:
            symbol: The trading pair symbol (e.g., 'BTC-USD')
            interval: Data interval (1m, 2m, 5m, 15m, 30m, 60m, 1d, 1wk, 1mo)
            range: Data range (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
            
        Returns:
            Dictionary containing the market data
        """
        try:
            data = self.client.call_api('YahooFinance/get_stock_chart', query={
                'symbol': symbol,
                'interval': interval,
                'range': range,
                'includePrePost': False,
                'includeAdjustedClose': True
            })
            
            if not data or 'chart' not in data or 'result' not in data['chart'] or not data['chart']['result']:
                return {'error': 'No data available for the symbol'}
            
            return data
        except Exception as e:
            return {'error': str(e)}
    
    def get_stock_insights(self, symbol):
        """
        Fetch stock insights and analysis using Yahoo Finance API
        
        Args:
            symbol: The trading pair symbol (e.g., 'BTC-USD')
            
        Returns:
            Dictionary containing the insights data
        """
        try:
            data = self.client.call_api('YahooFinance/get_stock_insights', query={
                'symbol': symbol
            })
            
            if not data or 'finance' not in data or 'result' not in data['finance']:
                return {'error': 'No insights available for the symbol'}
            
            return data
        except Exception as e:
            return {'error': str(e)}
    
    def process_market_data(self, symbol, interval='1d', range='1mo'):
        """
        Process market data into a format suitable for trading decisions
        
        Args:
            symbol: The trading pair symbol (e.g., 'BTC-USD')
            interval: Data interval
            range: Data range
            
        Returns:
            Dictionary containing processed market data
        """
        data = self.get_stock_data(symbol, interval, range)
        
        if 'error' in data:
            return data
        
        try:
            result = data['chart']['result'][0]
            meta = result['meta']
            timestamps = result['timestamp']
            quote = result['indicators']['quote'][0]
            
            processed_data = {
                'symbol': meta['symbol'],
                'currency': meta['currency'],
                'exchange': meta['exchangeName'],
                'current_price': meta.get('regularMarketPrice', 0),
                'previous_close': meta.get('chartPreviousClose', 0),
                'data': []
            }
            
            for i in range(len(timestamps)):
                if i < len(quote['close']) and quote['close'][i] is not None:
                    candle = {
                        'timestamp': timestamps[i],
                        'open': quote['open'][i] if i < len(quote['open']) and quote['open'][i] is not None else 0,
                        'high': quote['high'][i] if i < len(quote['high']) and quote['high'][i] is not None else 0,
                        'low': quote['low'][i] if i < len(quote['low']) and quote['low'][i] is not None else 0,
                        'close': quote['close'][i],
                        'volume': quote['volume'][i] if i < len(quote['volume']) and quote['volume'][i] is not None else 0
                    }
                    processed_data['data'].append(candle)
            
            return processed_data
        except Exception as e:
            return {'error': f'Error processing data: {str(e)}'}

# Example usage
if __name__ == "__main__":
    service = MarketDataService()
    
    # Test with Bitcoin
    btc_data = service.process_market_data('BTC-USD')
    print(json.dumps(btc_data, indent=2))
    
    # Test with Ethereum
    eth_data = service.process_market_data('ETH-USD')
    print(json.dumps(eth_data, indent=2))
