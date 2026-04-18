#!/bin/bash
# Demo Scenario: Trigger High CPU Anomaly

echo "Triggering fake high CPU metric for InfraBot demonstration..."
echo "high" > /tmp/infrabot_demo_cpu

echo "High CPU triggered. The Monitor Agent should pick this up within 30 seconds."
echo "To revert, delete /tmp/infrabot_demo_cpu"

# Note: This is read by the backend/src/agents/monitor.js override block over SSH (or local mock).
