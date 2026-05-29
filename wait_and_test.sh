#!/bin/bash
DEPLOY_UUID="hgkgs4ccwokcs4ogckg8g8os"
echo "Waiting for deployment $DEPLOY_UUID..."

for i in $(seq 1 40); do
  STATUS=$(curl -s "http://185.217.131.26:8000/api/v1/deployments/$DEPLOY_UUID" \
    -H "Authorization: Bearer 2|mysecrettoken123" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('status','unknown'))")
  echo "[$(date +%H:%M:%S)] Status: $STATUS"
  if [ "$STATUS" != "in_progress" ] && [ "$STATUS" != "queued" ]; then
    echo "=== DONE: $STATUS ==="
    break
  fi
  sleep 15
done

echo "Deployment finished. Triggering Re-Evaluate for F2026_ABC..."

# PAPA: d7027742-7a85-4190-97c6-6185849271c3
echo "Re-evaluating PAPA..."
curl -s -X POST "https://quest.mezon.uz/api/re-evaluate" \
  -H "Content-Type: application/json" \
  -d '{"resultId": "d7027742-7a85-4190-97c6-6185849271c3"}' | jq

# MAMA: 74d004f5-8a39-4a12-88be-6c8298b000c1
echo "Re-evaluating MAMA..."
curl -s -X POST "https://quest.mezon.uz/api/re-evaluate" \
  -H "Content-Type: application/json" \
  -d '{"resultId": "74d004f5-8a39-4a12-88be-6c8298b000c1"}' | jq

