import psutil
import os
import signal
import sys

def kill_processes_on_port(port):
    print(f"Scanning for processes on port {port}...")
    killed_count = 0
    
    for proc in psutil.process_iter(['pid', 'name']):
        try:
            # Check all connections for this process
            for conn in proc.connections(kind='inet'):
                if conn.laddr.port == port:
                    print(f"Found process {proc.info['name']} (PID: {proc.info['pid']}) on port {port}")
                    
                    # Try to terminate gracefully first
                    proc.terminate()
                    try:
                        proc.wait(timeout=3)
                        print(f"PID {proc.info['pid']} terminated gracefully.")
                    except psutil.TimeoutExpired:
                        print(f"PID {proc.info['pid']} hung. Killing forcefully...")
                        proc.kill()
                    
                    killed_count += 1
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass

    if killed_count == 0:
        print(f"No processes found listening on port {port}. System is clean.")
    else:
        print(f"Total processes killed: {killed_count}. Port {port} is now free.")

if __name__ == "__main__":
    kill_processes_on_port(8000)
