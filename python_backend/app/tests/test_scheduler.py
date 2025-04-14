import pytest
import asyncio
import unittest
from unittest.mock import patch, MagicMock, AsyncMock, call
import logging
from datetime import datetime, timedelta
import time

from app.core.scheduler import TaskScheduler


class TestTaskScheduler(unittest.TestCase):
    """Test suite for the TaskScheduler class"""

    def setUp(self):
        """Set up test fixtures"""
        # Configure logging to avoid output during tests
        logging.basicConfig(level=logging.CRITICAL)
        self.scheduler = TaskScheduler()
        
        # Create test task functions
        async def test_task1():
            return "Task 1 completed"
        
        async def test_task2(param1, param2):
            return f"Task 2 completed with {param1} and {param2}"
        
        self.test_task1 = test_task1
        self.test_task2 = test_task2
    
    def tearDown(self):
        """Tear down test fixtures"""
        # Ensure scheduler is stopped after each test
        if self.scheduler._running:
            asyncio.run(self.scheduler.stop())
    
    async def async_setup(self):
        """Async setup for tests that need it"""
        await self.scheduler.start()
    
    async def async_teardown(self):
        """Async teardown for tests that need it"""
        await self.scheduler.stop()
    
    def test_initialization(self):
        """Test that the scheduler initializes correctly"""
        self.assertFalse(self.scheduler._running)
        self.assertEqual(len(self.scheduler._tasks), 0)
        self.assertIsNone(self.scheduler._main_task)
    
    @patch('asyncio.create_task')
    def test_start(self, mock_create_task):
        """Test the start method"""
        # Setup mock
        mock_task = MagicMock()
        mock_create_task.return_value = mock_task
        
        # Run the method
        asyncio.run(self.scheduler.start())
        
        # Verify
        self.assertTrue(self.scheduler._running)
        mock_create_task.assert_called_once()
        self.assertEqual(self.scheduler._main_task, mock_task)
    
    async def test_stop(self):
        """Test the stop method"""
        # Start the scheduler first
        await self.scheduler.start()
        self.assertTrue(self.scheduler._running)
        
        # Stop the scheduler
        await self.scheduler.stop()
        
        # Verify
        self.assertFalse(self.scheduler._running)
        self.assertIsNone(self.scheduler._main_task)
    
    async def test_add_task(self):
        """Test adding a task to the scheduler"""
        # Add a task to the scheduler
        task_id = self.scheduler.add_task(
            self.test_task1,
            interval=60,
            task_name="Test Task 1"
        )
        
        # Verify the task was added
        self.assertIn(task_id, self.scheduler._tasks)
        task_data = self.scheduler._tasks[task_id]
        self.assertEqual(task_data["name"], "Test Task 1")
        self.assertEqual(task_data["interval"], 60)
        self.assertEqual(task_data["func"], self.test_task1)
        self.assertEqual(task_data["args"], ())
        self.assertEqual(task_data["kwargs"], {})
    
    async def test_add_task_with_args(self):
        """Test adding a task with arguments"""
        # Add a task with arguments
        task_id = self.scheduler.add_task(
            self.test_task2,
            interval=120,
            task_name="Test Task 2",
            args=("value1",),
            kwargs={"param2": "value2"}
        )
        
        # Verify the task was added with arguments
        self.assertIn(task_id, self.scheduler._tasks)
        task_data = self.scheduler._tasks[task_id]
        self.assertEqual(task_data["name"], "Test Task 2")
        self.assertEqual(task_data["interval"], 120)
        self.assertEqual(task_data["func"], self.test_task2)
        self.assertEqual(task_data["args"], ("value1",))
        self.assertEqual(task_data["kwargs"], {"param2": "value2"})
    
    async def test_remove_task(self):
        """Test removing a task from the scheduler"""
        # Add a task
        task_id = self.scheduler.add_task(
            self.test_task1,
            interval=60,
            task_name="Test Task 1"
        )
        
        # Verify the task was added
        self.assertIn(task_id, self.scheduler._tasks)
        
        # Remove the task
        self.scheduler.remove_task(task_id)
        
        # Verify the task was removed
        self.assertNotIn(task_id, self.scheduler._tasks)
    
    async def test_remove_nonexistent_task(self):
        """Test removing a task that doesn't exist"""
        # Attempt to remove a non-existent task
        self.scheduler.remove_task("nonexistent_task_id")
        
        # No exception should be raised
        self.assertTrue(True)
    
    @patch("asyncio.sleep")
    async def test_start_scheduler(self, mock_sleep):
        """Test starting the scheduler"""
        # Mock asyncio.sleep to avoid waiting in the test
        mock_sleep.side_effect = [None, asyncio.CancelledError()]
        
        # Add a task
        mock_task = AsyncMock()
        self.scheduler.add_task(
            mock_task,
            interval=5,
            task_name="Mock Task"
        )
        
        # Start the scheduler (it should run until cancelled)
        try:
            await self.scheduler.start()
        except asyncio.CancelledError:
            pass
        
        # Verify the scheduler was running
        self.assertTrue(self.scheduler._running)
        
        # Verify sleep was called with the expected interval
        mock_sleep.assert_called_with(5)
    
    async def test_start_stop_scheduler(self):
        """Test starting and stopping the scheduler"""
        # Start the scheduler
        await self.scheduler.start()
        
        # Verify the scheduler is running
        self.assertTrue(self.scheduler._running)
        self.assertIsNotNone(self.scheduler._main_task)
        
        # Stop the scheduler
        await self.scheduler.stop()
        
        # Verify the scheduler is stopped
        self.assertFalse(self.scheduler._running)
        self.assertIsNone(self.scheduler._main_task)
    
    @patch("asyncio.create_task")
    async def test_start_already_running(self, mock_create_task):
        """Test starting the scheduler when it's already running"""
        # Set the scheduler as running
        self.scheduler._running = True
        self.scheduler._main_task = MagicMock()
        
        # Try to start the scheduler again
        await self.scheduler.start()
        
        # Verify create_task wasn't called
        mock_create_task.assert_not_called()
    
    async def test_stop_not_running(self):
        """Test stopping the scheduler when it's not running"""
        # Make sure scheduler is not running
        self.scheduler._running = False
        self.scheduler._main_task = None
        
        # Try to stop the scheduler
        await self.scheduler.stop()
        
        # No exception should be raised
        self.assertFalse(self.scheduler._running)
    
    @patch("asyncio.gather")
    async def test_run_task(self, mock_gather):
        """Test running a task"""
        # Setup a mock task
        mock_task = AsyncMock(return_value="Task result")
        task_id = self.scheduler.add_task(
            mock_task,
            interval=60,
            task_name="Mock Task"
        )
        
        # Set up gather to return the task result
        mock_gather.return_value = ["Task result"]
        
        # Run the task
        result = await self.scheduler._run_task(task_id)
        
        # Verify the task was called
        mock_task.assert_called_once()
        self.assertEqual(result, "Task result")
    
    @patch("asyncio.gather")
    async def test_run_task_with_args(self, mock_gather):
        """Test running a task with arguments"""
        # Setup a mock task with arguments
        mock_task = AsyncMock(return_value="Task with args result")
        task_id = self.scheduler.add_task(
            mock_task,
            interval=60,
            task_name="Mock Task",
            args=("arg1", "arg2"),
            kwargs={"kwarg1": "value1"}
        )
        
        # Set up gather to return the task result
        mock_gather.return_value = ["Task with args result"]
        
        # Run the task
        result = await self.scheduler._run_task(task_id)
        
        # Verify the task was called with the correct arguments
        mock_task.assert_called_once_with("arg1", "arg2", kwarg1="value1")
        self.assertEqual(result, "Task with args result")
    
    @patch("asyncio.gather")
    async def test_run_task_exception(self, mock_gather):
        """Test handling exceptions when running a task"""
        # Setup a mock task that raises an exception
        mock_task = AsyncMock(side_effect=Exception("Test exception"))
        task_id = self.scheduler.add_task(
            mock_task,
            interval=60,
            task_name="Exception Task"
        )
        
        # Configure gather to propagate the exception
        mock_gather.side_effect = Exception("Test exception")
        
        # Run the task (should handle the exception)
        result = await self.scheduler._run_task(task_id)
        
        # Verify the task was called and the result indicates failure
        mock_task.assert_called_once()
        self.assertIsNone(result)
    
    @patch("asyncio.gather")
    async def test_run_nonexistent_task(self, mock_gather):
        """Test running a task that doesn't exist"""
        # Run a non-existent task
        result = await self.scheduler._run_task("nonexistent_task_id")
        
        # Verify gather wasn't called and the result is None
        mock_gather.assert_not_called()
        self.assertIsNone(result)
    
    @patch.object(TaskScheduler, "_run_task")
    async def test_run_all_tasks(self, mock_run_task):
        """Test running all scheduled tasks"""
        # Setup tasks
        mock_run_task.side_effect = ["Task 1 result", "Task 2 result"]
        
        # Add two tasks
        task_id1 = self.scheduler.add_task(
            self.test_task1,
            interval=60,
            task_name="Test Task 1"
        )
        task_id2 = self.scheduler.add_task(
            self.test_task2,
            interval=120,
            task_name="Test Task 2",
            args=("value1",),
            kwargs={"param2": "value2"}
        )
        
        # Update the last run time for the tasks to simulate different scenarios
        now = datetime.now()
        self.scheduler._tasks[task_id1]["last_run"] = now - timedelta(seconds=65)  # Should run (interval passed)
        self.scheduler._tasks[task_id2]["last_run"] = now - timedelta(seconds=60)  # Should not run (interval not passed)
        
        # Run all tasks
        await self.scheduler._run_scheduled_tasks()
        
        # Verify only the first task was run (because its interval passed)
        mock_run_task.assert_called_once_with(task_id1)
    
    @patch.object(TaskScheduler, "_run_task")
    async def test_run_now(self, mock_run_task):
        """Test running a task immediately"""
        # Setup
        mock_run_task.return_value = "Task result"
        
        # Add a task
        task_id = self.scheduler.add_task(
            self.test_task1,
            interval=60,
            task_name="Test Task 1"
        )
        
        # Run the task immediately
        result = await self.scheduler.run_now(task_id)
        
        # Verify the task was run and the result was correct
        mock_run_task.assert_called_once_with(task_id)
        self.assertEqual(result, "Task result")
    
    async def test_run_now_nonexistent_task(self):
        """Test running a non-existent task immediately"""
        # Run a non-existent task
        result = await self.scheduler.run_now("nonexistent_task_id")
        
        # Verify the result is None
        self.assertIsNone(result)


# Helper function to run async tests
def async_test(coro):
    def wrapper(*args, **kwargs):
        loop = asyncio.get_event_loop()
        return loop.run_until_complete(coro(*args, **kwargs))
    return wrapper


# Apply the decorator to make async tests work with unittest
TestTaskScheduler.test_add_task = async_test(TestTaskScheduler.test_add_task)
TestTaskScheduler.test_add_task_with_args = async_test(TestTaskScheduler.test_add_task_with_args)
TestTaskScheduler.test_remove_task = async_test(TestTaskScheduler.test_remove_task)
TestTaskScheduler.test_remove_nonexistent_task = async_test(TestTaskScheduler.test_remove_nonexistent_task)
TestTaskScheduler.test_start_scheduler = async_test(TestTaskScheduler.test_start_scheduler)
TestTaskScheduler.test_start_stop_scheduler = async_test(TestTaskScheduler.test_start_stop_scheduler)
TestTaskScheduler.test_start_already_running = async_test(TestTaskScheduler.test_start_already_running)
TestTaskScheduler.test_stop_not_running = async_test(TestTaskScheduler.test_stop_not_running)
TestTaskScheduler.test_run_task = async_test(TestTaskScheduler.test_run_task)
TestTaskScheduler.test_run_task_with_args = async_test(TestTaskScheduler.test_run_task_with_args)
TestTaskScheduler.test_run_task_exception = async_test(TestTaskScheduler.test_run_task_exception)
TestTaskScheduler.test_run_nonexistent_task = async_test(TestTaskScheduler.test_run_nonexistent_task)
TestTaskScheduler.test_run_all_tasks = async_test(TestTaskScheduler.test_run_all_tasks)
TestTaskScheduler.test_run_now = async_test(TestTaskScheduler.test_run_now)
TestTaskScheduler.test_run_now_nonexistent_task = async_test(TestTaskScheduler.test_run_now_nonexistent_task)


if __name__ == "__main__":
    unittest.main() 