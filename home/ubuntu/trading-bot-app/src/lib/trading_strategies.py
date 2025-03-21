import sys
sys.path.append('/opt/.manus/.sandbox-runtime')
from data_api import ApiClient
import json
import time
import random
import math
from datetime import datetime, timedelta

class ThousandTradesStrategy:
    """
    Implementation of the 'Thousand Trades' strategy:
    - 1000 trades per day
    - Entry percentage: 5.88% of capital
    - Take profit: 0.18%
    - Stop loss: 0.09%
    - Loss multiplier: x2 up to 5 times
    - Max weekly loss: 20% of capital
    """
    
    def __init__(self, account_id, trading_pair, initial_capital):
        self.account_id = account_id
        self.trading_pair = trading_pair
        self.initial_capital = initial_capital
        self.current_capital = initial_capital
        self.entry_percentage = 5.88
        self.take_profit_percentage = 0.18
        self.stop_loss_percentage = 0.09
        self.max_loss_multiplier = 2
        self.max_loss_multiplier_count = 5
        self.max_weekly_loss_percentage = 20
        
        # Strategy state
        self.current_loss_multiplier = 1
        self.current_loss_count = 0
        self.weekly_trades = []
        self.daily_trades = []
        self.is_active = False
        
        # Market data service
        self.market_service = MarketDataService()
    
    def start(self):
        """Start the trading bot"""
        self.is_active = True
        return {"status": "started", "message": f"بوت صفقة الألف نقطة بدأ العمل على {self.trading_pair}"}
    
    def stop(self):
        """Stop the trading bot"""
        self.is_active = False
        return {"status": "stopped", "message": f"تم إيقاف بوت صفقة الألف نقطة على {self.trading_pair}"}
    
    def get_status(self):
        """Get the current status of the bot"""
        weekly_profit_loss = self.calculate_weekly_profit_loss()
        weekly_profit_loss_percentage = (weekly_profit_loss / self.initial_capital) * 100
        
        return {
            "is_active": self.is_active,
            "trading_pair": self.trading_pair,
            "initial_capital": self.initial_capital,
            "current_capital": self.current_capital,
            "entry_percentage": self.entry_percentage,
            "take_profit_percentage": self.take_profit_percentage,
            "stop_loss_percentage": self.stop_loss_percentage,
            "current_loss_multiplier": self.current_loss_multiplier,
            "current_loss_count": self.current_loss_count,
            "weekly_profit_loss": weekly_profit_loss,
            "weekly_profit_loss_percentage": weekly_profit_loss_percentage,
            "daily_trades_count": len(self.daily_trades),
            "weekly_trades_count": len(self.weekly_trades)
        }
    
    def calculate_weekly_profit_loss(self):
        """Calculate the total profit/loss for the current week"""
        one_week_ago = datetime.now() - timedelta(days=7)
        weekly_trades = [trade for trade in self.weekly_trades if trade["exit_time"] > one_week_ago]
        
        total_profit_loss = sum(trade["profit_loss"] for trade in weekly_trades)
        return total_profit_loss
    
    def check_weekly_loss_limit(self):
        """Check if the weekly loss limit has been reached"""
        weekly_profit_loss = self.calculate_weekly_profit_loss()
        weekly_loss_percentage = (weekly_profit_loss / self.initial_capital) * 100
        
        if weekly_loss_percentage <= -self.max_weekly_loss_percentage:
            self.is_active = False
            return {
                "limit_reached": True,
                "message": f"تم إيقاف البوت تلقائياً لتجاوز حد الخسارة الأسبوعية ({self.max_weekly_loss_percentage}%)"
            }
        
        return {"limit_reached": False}
    
    def execute_trade(self):
        """Execute a single trade based on the strategy"""
        if not self.is_active:
            return {"status": "error", "message": "البوت غير نشط"}
        
        # Check weekly loss limit
        weekly_loss_check = self.check_weekly_loss_limit()
        if weekly_loss_check["limit_reached"]:
            return {"status": "stopped", "message": weekly_loss_check["message"]}
        
        # Get current market data
        market_data = self.market_service.process_market_data(self.trading_pair, interval="1m", range="1d")
        
        if "error" in market_data:
            return {"status": "error", "message": f"خطأ في الحصول على بيانات السوق: {market_data['error']}"}
        
        # Calculate trade parameters
        current_price = market_data["current_price"]
        trade_amount = (self.current_capital * self.entry_percentage / 100) * self.current_loss_multiplier
        trade_quantity = trade_amount / current_price
        
        # Determine trade direction (buy/sell) based on simple analysis
        # In a real implementation, this would use more sophisticated analysis
        if len(market_data["data"]) < 2:
            trade_direction = random.choice(["buy", "sell"])
        else:
            last_candle = market_data["data"][-1]
            previous_candle = market_data["data"][-2]
            
            if last_candle["close"] > previous_candle["close"]:
                trade_direction = "buy"
            else:
                trade_direction = "sell"
        
        # Calculate take profit and stop loss prices
        if trade_direction == "buy":
            take_profit_price = current_price * (1 + self.take_profit_percentage / 100)
            stop_loss_price = current_price * (1 - self.stop_loss_percentage / 100)
        else:
            take_profit_price = current_price * (1 - self.take_profit_percentage / 100)
            stop_loss_price = current_price * (1 + self.stop_loss_percentage / 100)
        
        # Simulate trade execution
        entry_time = datetime.now()
        
        # Simulate market movement (in a real implementation, this would be based on actual market data)
        # For simulation, we'll randomly determine if the trade hits take profit or stop loss
        outcome = random.choices(
            ["take_profit", "stop_loss"],
            weights=[55, 45],  # Slightly biased towards profit for simulation
            k=1
        )[0]
        
        # Calculate exit price and profit/loss
        if outcome == "take_profit":
            exit_price = take_profit_price
            exit_reason = "take_profit"
        else:
            exit_price = stop_loss_price
            exit_reason = "stop_loss"
        
        # Calculate profit/loss
        if trade_direction == "buy":
            profit_loss = (exit_price - current_price) * trade_quantity
        else:
            profit_loss = (current_price - exit_price) * trade_quantity
        
        # Update capital
        self.current_capital += profit_loss
        
        # Update loss multiplier if needed
        if exit_reason == "stop_loss":
            if self.current_loss_count < self.max_loss_multiplier_count:
                self.current_loss_multiplier *= self.max_loss_multiplier
                self.current_loss_count += 1
        else:
            # Reset loss multiplier on successful trade
            self.current_loss_multiplier = 1
            self.current_loss_count = 0
        
        # Record trade
        trade = {
            "account_id": self.account_id,
            "trading_pair": self.trading_pair,
            "trade_direction": trade_direction,
            "entry_price": current_price,
            "exit_price": exit_price,
            "quantity": trade_quantity,
            "entry_time": entry_time,
            "exit_time": datetime.now(),
            "exit_reason": exit_reason,
            "profit_loss": profit_loss,
            "profit_loss_percentage": (profit_loss / trade_amount) * 100,
            "loss_multiplier": self.current_loss_multiplier
        }
        
        # Add to trade history
        self.daily_trades.append(trade)
        self.weekly_trades.append(trade)
        
        # Clean up old trades
        self.cleanup_old_trades()
        
        return {
            "status": "success",
            "trade": trade,
            "current_capital": self.current_capital,
            "current_loss_multiplier": self.current_loss_multiplier
        }
    
    def cleanup_old_trades(self):
        """Remove trades older than 7 days from weekly trades list"""
        one_week_ago = datetime.now() - timedelta(days=7)
        self.weekly_trades = [trade for trade in self.weekly_trades if trade["exit_time"] > one_week_ago]
        
        # Reset daily trades at the start of a new day
        today = datetime.now().date()
        self.daily_trades = [trade for trade in self.daily_trades if trade["exit_time"].date() == today]
    
    def run_simulation(self, days=1, trades_per_day=1000):
        """Run a simulation of the strategy for a specified number of days"""
        if not self.is_active:
            return {"status": "error", "message": "البوت غير نشط"}
        
        simulation_results = {
            "initial_capital": self.initial_capital,
            "final_capital": self.initial_capital,
            "total_trades": 0,
            "profitable_trades": 0,
            "losing_trades": 0,
            "total_profit_loss": 0,
            "daily_results": []
        }
        
        # Save original capital to restore after simulation
        original_capital = self.current_capital
        self.current_capital = self.initial_capital
        
        # Reset state for simulation
        self.current_loss_multiplier = 1
        self.current_loss_count = 0
        self.weekly_trades = []
        self.daily_trades = []
        
        for day in range(days):
            daily_profit_loss = 0
            daily_trades = 0
            daily_profitable_trades = 0
            daily_losing_trades = 0
            
            for _ in range(trades_per_day):
                result = self.execute_trade()
                
                if result["status"] == "stopped":
                    # Bot was stopped due to weekly loss limit
                    break
                
                if result["status"] == "success":
                    trade = result["trade"]
                    daily_profit_loss += trade["profit_loss"]
                    daily_trades += 1
                    
                    if trade["profit_loss"] > 0:
                        daily_profitable_trades += 1
                    else:
                        daily_losing_trades += 1
            
            daily_result = {
                "day": day + 1,
                "starting_capital": self.current_capital - daily_profit_loss,
                "ending_capital": self.current_capital,
                "daily_profit_loss": daily_profit_loss,
                "daily_profit_loss_percentage": (daily_profit_loss / (self.current_capital - daily_profit_loss)) * 100 if self.current_capital - daily_profit_loss > 0 else 0,
                "trades": daily_trades,
                "profitable_trades": daily_profitable_trades,
                "losing_trades": daily_losing_trades
            }
            
            simulation_results["daily_results"].append(daily_result)
            simulation_results["total_trades"] += daily_trades
            simulation_results["profitable_trades"] += daily_profitable_trades
            simulation_results["losing_trades"] += daily_losing_trades
            simulation_results["total_profit_loss"] += daily_profit_loss
            
            # Check if bot was stopped
            if not self.is_active:
                break
        
        simulation_results["final_capital"] = self.current_capital
        simulation_results["total_profit_loss_percentage"] = ((self.current_capital - self.initial_capital) / self.initial_capital) * 100
        
        # Restore original capital
        self.current_capital = original_capital
        
        return simulation_results


class TenTradesStrategy:
    """
    Implementation of the 'Ten Trades' strategy:
    - 10 trades per day
    - Entry percentage: 5% of capital
    - Take profit: 9%
    - Stop loss: 4.5%
    - Loss multiplier: x2 up to 4 times
    - Max weekly loss: 20% of capital
    """
    
    def __init__(self, account_id, trading_pair, initial_capital):
        self.account_id = account_id
        self.trading_pair = trading_pair
        self.initial_capital = initial_capital
        self.current_capital = initial_capital
        self.entry_percentage = 5
        self.take_profit_percentage = 9
        self.stop_loss_percentage = 4.5
        self.max_loss_multiplier = 2
        self.max_loss_multiplier_count = 4
        self.max_weekly_loss_percentage = 20
        
        # Strategy state
        self.current_loss_multiplier = 1
        self.current_loss_count = 0
        self.weekly_trades = []
        self.daily_trades = []
        self.is_active = False
        
        # Market data service
        self.market_service = MarketDataService()
    
    def start(self):
        """Start the trading bot"""
        self.is_active = True
        return {"status": "started", "message": f"بوت العشرة عين بدأ العمل على {self.trading_pair}"}
    
    def stop(self):
        """Stop the trading bot"""
        self.is_active = False
        return {"status": "stopped", "message": f"تم إيقاف بوت العشرة عين على {self.trading_pair}"}
    
    def get_status(self):
        """Get the current status of the bot"""
        weekly_profit_loss = self.calculate_weekly_profit_loss()
        weekly_profit_loss_percentage = (weekly_profit_loss / self.initial_capital) * 100
        
        return {
            "is_active": self.is_active,
            "trading_pair": self.trading_pair,
            "initial_capital": self.initial_capital,
            "current_capital": self.current_capital,
            "entry_percentage": self.entry_percentage,
            "take_profit_percentage": self.take_profit_percentage,
            "stop_loss_percentage": self.stop_loss_percentage,
            "current_loss_multiplier": self.current_loss_multiplier,
            "current_loss_count": self.current_loss_count,
            "weekly_profit_loss": weekly_profit_loss,
            "weekly_profit_loss_percentage": weekly_profit_loss_percentage,
            "daily_trades_count": len(self.daily_trades),
            "weekly_trades_count": len(self.weekly_trades)
        }
    
    def calculate_weekly_profit_loss(self):
        """Calculate the total profit/loss for the current week"""
        one_week_ago = datetime.now() - timedelta(days=7)
        weekly_trades = [trade for trade in self.weekly_trades if trade["exit_time"] > one_week_ago]
        
        total_profit_loss = sum(trade["profit_loss"] for trade in weekly_trades)
        return total_profit_loss
    
    def check_weekly_loss_limit(self):
        """Check if the weekly loss limit has been reached"""
        weekly_profit_loss = self.calculate_weekly_profit_loss()
        weekly_loss_percentage = (weekly_profit_loss / self.initial_capital) * 100
        
        if weekly_loss_percentage <= -self.max_weekly_loss_percentage:
            self.is_active = False
            return {
                "limit_reached": True,
                "message": f"تم إيقاف البوت تلقائياً لتجاوز حد الخسارة الأسبوعية ({self.max_weekly_loss_percentage}%)"
            }
        
        return {"limit_reached": False}
    
    def execute_trade(self):
        """Execute a single trade based on the strategy"""
        if not self.is_active:
            return {"status": "error", "message": "البوت غير نشط"}
        
        # Check weekly loss limit
        weekly_loss_check = self.check_weekly_loss_limit()
        if weekly_loss_check["limit_reached"]:
            return {"status": "stopped", "message": weekly_loss_check["message"]}
        
        # Get current market data
        market_data = self.market_service.process_market_data(self.trading_pair, interval="15m", range="1d")
        
        if "error" in market_data:
            return {"status": "err<response clipped><NOTE>To save on context only part of this file has been shown to you. You should retry this tool after you have searched inside the file with `grep -n` in order to find the line numbers of what you are looking for.</NOTE>