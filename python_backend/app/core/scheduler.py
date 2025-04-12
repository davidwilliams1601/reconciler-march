import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any, List, Callable, Awaitable
import logging
import time

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger("scheduler")

class TaskScheduler:
    """
    A simple background task scheduler that can run periodic tasks.
    """
    
    def __init__(self):
        self.tasks = {}
        self.running = False
        self.task_loop = None
    
    def start(self):
        """Start the scheduler."""
        if not self.running:
            self.running = True
            self.task_loop = asyncio.create_task(self._scheduler_loop())
            logger.info("Scheduler started")
    
    def stop(self):
        """Stop the scheduler."""
        if self.running:
            self.running = False
            if self.task_loop:
                self.task_loop.cancel()
            logger.info("Scheduler stopped")
    
    def add_task(
        self, 
        name: str, 
        func: Callable[..., Awaitable[Any]], 
        interval_minutes: int, 
        args: List[Any] = None, 
        kwargs: Dict[str, Any] = None
    ):
        """
        Add a task to the scheduler.
        
        Args:
            name: Name of the task
            func: Async function to call
            interval_minutes: Interval in minutes between task runs
            args: Positional arguments to pass to the function
            kwargs: Keyword arguments to pass to the function
        """
        self.tasks[name] = {
            "func": func,
            "interval_minutes": interval_minutes,
            "args": args or [],
            "kwargs": kwargs or {},
            "last_run": None,
            "next_run": datetime.now(),
        }
        logger.info(f"Added task: {name} with interval {interval_minutes} minutes")
    
    def remove_task(self, name: str):
        """Remove a task from the scheduler."""
        if name in self.tasks:
            del self.tasks[name]
            logger.info(f"Removed task: {name}")
    
    async def run_task(self, name: str):
        """Run a task immediately."""
        if name in self.tasks:
            task = self.tasks[name]
            try:
                logger.info(f"Running task: {name}")
                result = await task["func"](*task["args"], **task["kwargs"])
                task["last_run"] = datetime.now()
                task["next_run"] = task["last_run"] + timedelta(minutes=task["interval_minutes"])
                logger.info(f"Task {name} completed successfully")
                return result
            except Exception as e:
                logger.error(f"Error running task {name}: {str(e)}")
                return {"error": str(e)}
    
    async def _scheduler_loop(self):
        """The main scheduler loop."""
        try:
            while self.running:
                now = datetime.now()
                
                # Check each task
                for name, task in self.tasks.items():
                    if task["next_run"] <= now:
                        try:
                            logger.info(f"Running scheduled task: {name}")
                            await task["func"](*task["args"], **task["kwargs"])
                            task["last_run"] = now
                            task["next_run"] = now + timedelta(minutes=task["interval_minutes"])
                            logger.info(f"Scheduled task {name} completed")
                        except Exception as e:
                            logger.error(f"Error in scheduled task {name}: {str(e)}")
                
                # Sleep for a bit to avoid busy waiting
                await asyncio.sleep(60)  # Check every minute
        except asyncio.CancelledError:
            logger.info("Scheduler loop cancelled")
        except Exception as e:
            logger.error(f"Error in scheduler loop: {str(e)}")

# Create singleton instance
scheduler = TaskScheduler() 