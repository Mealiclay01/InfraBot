# Container Crash Runbook

If Docker containers show as "Exited" or are constantly restarting:

1. Use `docker ps -a` to find crashed containers.
2. Identify the failing container.
3. Use the `docker_restart` tool to cycle the container.
4. If the container continues to crash, check the service dependent on it and notify an administrator via `send_alert`.
