import pygetwindow as gw
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OSTracker:
    def __init__(self):
        self.last_title = ""

    def get_active_window_info(self):
        """
        Retrieves the title of the currently active window.
        Returns a dictionary with 'title' and 'app_name' (inferred).
        Robust against Windows permission errors.
        """
        try:
            window = gw.getActiveWindow()
            if window and hasattr(window, 'title') and window.title:
                title = window.title.strip()
                if not title: return None
                
                return {
                    "title": title,
                    "app_name": "Unknown App" 
                }
            return None
        except Exception as e:
            # On Windows, some system windows (Task Manager, Admin prompts) 
            # throw generic exceptions when accessed without Admin rights.
            # We log a warning but DO NOT CRASH.
            logger.warning(f"Tracker Warning: Could not access active window. (Admin rights might be needed). Details: {e}")
            return None
