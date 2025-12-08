import pygetwindow as gw
import time

print("OS Agent Verification Script")
print("----------------------------")
print("Checking for active windows...")

try:
    for i in range(5):
        window = gw.getActiveWindow()
        if window:
            print(f"[{i+1}/5] Active Window: '{window.title}'")
        else:
            print(f"[{i+1}/5] No active window detected.")
        time.sleep(1)
    print("\nSUCCESS: Window tracking is working.")
except Exception as e:
    print(f"\nERROR: {e}")
    print("Ensure you installed requirements: pip install -r requirements.txt")
