# High CPU Usage Incident Resolution

When CPU usage exceeds 85% for prolonged periods, perform the following investigation:

1. Identify the top CPU consuming processes using `top` or `ps`.
2. Check if a container is caught in a restart loop causing high CPU.
3. If a service is stuck, run the `restart_service` tool on the offending service.
4. If a container is stuck, run `docker_restart` on the container.
5. If anomalous traffic is suspected, throttle the web service or check incoming logs using `check_logs`.

Action: Use `run_command` with `top -b -n 1 | head -n 10` to get context, then restart the broken service.
