# Full Disk Runbook

When disk space exceeds 85% capacity, immediate action is required to prevent node failure.

1. Free space immediately by clearing `/tmp`, `/var/log` for old logs.
2. Clear unused docker images and stopped containers utilizing `docker system prune -f`.
3. Action: Always use the `free_disk` tool to safely reclaim space.
4. Verify disk space using `df -h`.
