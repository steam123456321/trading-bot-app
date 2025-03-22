import sys
sys.path.append('/opt/.manus/.sandbox-runtime')
from data_api import ApiClient
import numpy as np
import pandas as pd
import json
import re
import requests
from datetime import datetime, timedelta
from sklearn.preprocessing import MinMaxScaler
from sklearn.linear_model import LinearRegression
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout

class MarketAnalysisAI:
    """
    Implementation of AI-based market analysis features:
    - Machine Learning Analysis: LSTM and Linear Regression for market trend prediction
    - Market Sentiment Analysis: Analysis of news and trader tweets
    - Technical Indicators Analysis: Using TA-Lib and TensorFlow
    """
    
    def __init__(self):
        self.client = ApiClient()
        self.market_service = MarketDataService()
        self.scaler = MinMaxScaler(feature_range=(0, 1))
        
    def prepare_data_for_lstm(self, data, look_back=60):
        """
        Prepare data for LSTM model
        
        Args:
            data: List of price data
            look_back: Number of previous time steps to use as input features
            
        Returns:
            X: Input features
            y: Target values
        """
        X, y = [], []
        for i in range(len(data) - look_back):
            X.append(data[i:(i + look_back)])
            y.append(data[i + look_back])
        
        return np.array(X), np.array(y)
    
    def build_lstm_model(self, look_back):
        """
        Build LSTM model for price prediction
        
        Args:
            look_back: Number of previous time steps to use as input features
            
        Returns:
            Compiled LSTM model
        """
        model = Sequential()
        model.add(LSTM(units=50, return_sequences=True, input_shape=(look_back, 1)))
        model.add(Dropout(0.2))
        model.add(LSTM(units=50, return_sequences=False))
        model.add(Dropout(0.2))
        model.add(Dense(units=1))
        model.compile(optimizer='adam', loss='mean_squared_error')
        
        return model
    
    def predict_with_lstm(self, symbol, days_to_predict=7):
        """
        Predict future prices using LSTM
        
        Args:
            symbol: Trading pair symbol
            days_to_predict: Number of days to predict
            
        Returns:
            Dictionary with prediction results
        """
        try:
            # Get historical data
            market_data = self.market_service.process_market_data(symbol, interval='1d', range='3mo')
            
            if 'error' in market_data:
                return {'error': market_data['error']}
            
            # Extract closing prices
            closing_prices = [candle['close'] for candle in market_data['data']]
            
            if len(closing_prices) < 60:
                return {'error': 'Not enough historical data for LSTM prediction'}
            
            # Scale the data
            closing_prices_array = np.array(closing_prices).reshape(-1, 1)
            scaled_data = self.scaler.fit_transform(closing_prices_array)
            
            # Prepare data for LSTM
            look_back = 60
            X, y = self.prepare_data_for_lstm(scaled_data, look_back)
            
            # Reshape X to fit LSTM input format [samples, time steps, features]
            X = np.reshape(X, (X.shape[0], X.shape[1], 1))
            
            # Build and train LSTM model
            model = self.build_lstm_model(look_back)
            model.fit(X, y, epochs=50, batch_size=32, verbose=0)
            
            # Prepare input for prediction
            last_60_days = scaled_data[-look_back:]
            
            # Make predictions for the specified number of days
            predictions = []
            current_batch = last_60_days.reshape((1, look_back, 1))
            
            for i in range(days_to_predict):
                # Predict next day
                next_day_prediction = model.predict(current_batch)[0]
                predictions.append(next_day_prediction[0])
                
                # Update current batch for next prediction
                current_batch = np.append(current_batch[:, 1:, :], 
                                         [[next_day_prediction]], 
                                         axis=1)
            
            # Inverse transform to get actual price predictions
            predictions_array = np.array(predictions).reshape(-1, 1)
            predicted_prices = self.scaler.inverse_transform(predictions_array)
            
            # Prepare result
            prediction_dates = [(datetime.now() + timedelta(days=i+1)).strftime('%Y-%m-%d') 
                               for i in range(days_to_predict)]
            
            prediction_results = {
                'symbol': symbol,
                'current_price': market_data['current_price'],
                'prediction_method': 'LSTM',
                'predictions': [
                    {
                        'date': prediction_dates[i],
                        'predicted_price': float(predicted_prices[i][0])
                    }
                    for i in range(days_to_predict)
                ]
            }
            
            return prediction_results
            
        except Exception as e:
            return {'error': f'Error in LSTM prediction: {str(e)}'}
    
    def predict_with_linear_regression(self, symbol, days_to_predict=7):
        """
        Predict future prices using Linear Regression
        
        Args:
            symbol: Trading pair symbol
            days_to_predict: Number of days to predict
            
        Returns:
            Dictionary with prediction results
        """
        try:
            # Get historical data
            market_data = self.market_service.process_market_data(symbol, interval='1d', range='1mo')
            
            if 'error' in market_data:
                return {'error': market_data['error']}
            
            # Extract closing prices
            closing_prices = [candle['close'] for candle in market_data['data']]
            
            if len(closing_prices) < 30:
                return {'error': 'Not enough historical data for Linear Regression prediction'}
            
            # Prepare data for Linear Regression
            X = np.array(range(len(closing_prices))).reshape(-1, 1)
            y = np.array(closing_prices)
            
            # Build and train Linear Regression model
            model = LinearRegression()
            model.fit(X, y)
            
            # Prepare input for prediction
            future_X = np.array(range(len(closing_prices), len(closing_prices) + days_to_predict)).reshape(-1, 1)
            
            # Make predictions
            predicted_prices = model.predict(future_X)
            
            # Prepare result
            prediction_dates = [(datetime.now() + timedelta(days=i+1)).strftime('%Y-%m-%d') 
                               for i in range(days_to_predict)]
            
            prediction_results = {
                'symbol': symbol,
                'current_price': market_data['current_price'],
                'prediction_method': 'Linear Regression',
                'predictions': [
                    {
                        'date': prediction_dates[i],
                        'predicted_price': float(predicted_prices[i])
                    }
                    for i in range(days_to_predict)
                ]
            }
            
            return prediction_results
            
        except Exception as e:
            return {'error': f'Error in Linear Regression prediction: {str(e)}'}
    
    def analyze_market_sentiment(self, symbol):
        """
        Analyze market sentiment based on news and social media
        
        Args:
            symbol: Trading pair symbol
            
        Returns:
            Dictionary with sentiment analysis results
        """
        try:
            # Get market insights from Yahoo Finance
            data = self.client.call_api('YahooFinance/get_stock_insights', query={
                'symbol': symbol
            })
            
            if not data or 'finance' not in data or 'result' not in data['finance']:
                return {'error': 'No insights available for the symbol'}
            
            # Extract relevant data
            result = data['finance']['result']
            
            # Initialize sentiment scores
            sentiment = {
                'overall_score': 0,
                'short_term_score': 0,
                'intermediate_term_score': 0,
                'long_term_score': 0,
                'technical_events': {},
                'company_metrics': {},
                'significant_developments': [],
                'analysis': ''
            }
            
            # Process technical events if available
            if 'instrumentInfo' in result and 'technicalEvents' in result['instrumentInfo']:
                tech_events = result['instrumentInfo']['technicalEvents']
                
                if 'shortTermOutlook' in tech_events:
                    short_term = tech_events['shortTermOutlook']
                    sentiment['short_term_score'] = short_term.get('score', 0)
                    sentiment['technical_events']['short_term'] = {
                        'direction': short_term.get('direction', 'neutral'),
                        'description': short_term.get('scoreDescription', 'No data')
                    }
                
                if 'intermediateTermOutlook' in tech_events:
                    mid_term = tech_events['intermediateTermOutlook']
                    sentiment['intermediate_term_score'] = mid_term.get('score', 0)
                    sentiment['technical_events']['intermediate_term'] = {
                        'direction': mid_term.get('direction', 'neutral'),
                        'description': mid_term.get('scoreDescription', 'No data')
                    }
                
                if 'longTermOutlook' in tech_events:
                    long_term = tech_events['longTermOutlook']
                    sentiment['long_term_score'] = long_term.get('score', 0)
                    sentiment['technical_events']['long_term'] = {
                        'direction': long_term.get('direction', 'neutral'),
                        'description': long_term.get('scoreDescription', 'No data')
                    }
            
            # Process company metrics if available
            if 'companySnapshot' in result and 'company' in result['companySnapshot']:
                company = result['companySnapshot']['company']
                sentiment['company_metrics'] = {
                    'innovativeness': company.get('innovativeness', 0),
                    'hiring': company.get('hiring', 0),
                    'sustainability': company.get('sustainability', 0),
                    'insider_sentiments': company.get('insiderSentiments', 0)
                }
            
            # Process significant developments if available
            if 'sigDevs' in result:
                for dev in result['sigDevs']:
                    sentiment['significant_developments'].append({
                        'headline': dev.get('headline', ''),
                        'date': dev.get('date', '')
                    })
            
            # Calculate overall sentiment score
            sentiment['overall_score'] = (
                sentiment['short_term_score'] * 0.3 + 
                sentiment['intermediate_term_score'] * 0.4 + 
                sentiment['long_term_score'] * 0.3
            )
            
            # Generate analysis text
            if sentiment['overall_score'] > 0.6:
                sentiment['analysis'] = f"التحليل العام للمشاعر السوقية لـ {symbol} إيجابي جداً. يُنصح بالشراء."
            elif sentiment['overall_score'] > 0.3:
                sentiment['analysis'] = f"التحليل العام للمشاعر السوقية لـ {symbol} إيجابي. يُنصح بالشراء بحذر."
            elif sentiment['overall_score'] > -0.3:
                sentiment['analysis'] = f"التحليل العام للمشاعر السوقية لـ {symbol} محايد. يُنصح بالانتظار."
            elif sentiment['overall_score'] > -0.6:
                sentiment['analysis'] = f"التحليل العام للمشاعر السوقية لـ {symbol} سلبي. يُنصح بالبيع بحذر."
            else:
                sentiment['analysis'] = f"التحليل العام للمشاعر السوقية لـ {symbol} سلبي جداً. يُنصح بالبيع."
            
            return {
                'symbol': symbol,
                'sentiment': sentiment
            }
            
        except Exception as e:
            return {'error': f'Error in sentiment analysis: {str(e)}'}
    
    def analyze_technical_indicators(self, symbol):
        """
        Analyze technical indicators for trading decisions
        
        Args:
            symbol: Trading pair symbol
            
        Returns:
            Dictionary with technical analysis results
        """
        try:
            # Get market data
            market_data = self.market_service.process_market_data(symbol, interval='1d', range='1mo')
            
            if 'error' in market_data:
                return {'error': market_data['error']}
            
            # Extract OHLCV data
            data = market_data['data']
            
            if len(data) < 14:
                return {'error': 'Not enough historical data for technical analysis'}
            
            # Convert to pandas DataFrame
            df = pd.DataFrame([
                {
                    'timestamp': candle['timestamp'],
                    'open': candle['open'],
                    'high': candle['high'],
                    'low': candle['low'],
                    'close': candle['close'],
                    'volume': candle['volume']
                }
                for candle in data
            ])
            
            # Calculate Simple Moving Averages
            df['SMA_5'] = df['close'].rolling(window=5).mean()
            df['SMA_10'] = df['close'].rolling(window=10).mean()
            df['SMA_20'] = df['close'].rolling(window=20).mean()
            
            # Calculate Exponential Moving Averages
            df['EMA_5'] = df['close'].ewm(span=5, adjust=False).mean()
            df['EMA_10'] = df['close'].ewm(span=10, adjust=False).mean()
            df['EMA_20'] = df['close'].ewm(span=20, adjust=False).mean()
            
            # Calculate Relative Strength Index (RSI)
            delta = df['close'].diff()
            gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
            rs = gain / loss
            df['RSI'] = 100 - (100 / (1 + rs))
            
            # Calculate MACD
            df['EMA_12'] = df['close'].ewm(span=12, adjust=False).mean()
            df['EMA_26'] = df['close'].ewm(span=26, adjust=False).mean()
            df['MACD'] = df['EMA_12'] - df['EMA_26']
            df['MACD_Signal'] = df['MACD'].ewm(span=9, adjust=False).mean()
            df['MACD_Histogram'] = df['MACD'] - df['MACD_Signal']
            
            # Get latest values
            latest = df.iloc[-1]
            
            # Determine trend based on moving averages
            if latest['SMA_5'] > latest['SMA_20'] and latest['EMA_5'] > latest['EMA_20']:
                trend = 'uptrend'
            elif latest['SMA_5'] < latest['SMA_20'] and latest['EMA_5'] < latest['EMA_20']:
                trend = 'downtrend'
            else:
                trend = 'sideways'
            
            # Determine RSI signal
            if latest['RSI'] > 70:
                rsi_signal = 'overbought'
            elif latest['RSI'] < 30:
                rsi_signal = 'oversold'
            else:
                rsi_signal = 'ne<response clipped><NOTE>To save on context only part of this file has been shown to you. You should retry this tool after you have searched inside the file with `grep -n` in order to find the line numbers of what you are looking for.</NOTE>