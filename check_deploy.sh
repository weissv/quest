#!/bin/bash
while true; do
  STATUS=$(sshpass -e ssh -o StrictHostKeyChecking=no root@185.217.131.26 'curl -s -X GET "http://localhost:8000/api/v1/deployments/ycgg8c8wososwgo0ocow8wc0" -H "Authorization: Bearer 2|mysecrettoken123"' | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
  echo "Status: $STATUS"
  if [ "$STATUS" != "in_progress" ] && [ "$STATUS" != "queued" ]; then
    break
  fi
  sleep 10
done
sshpass -e ssh -o StrictHostKeyChecking=no root@185.217.131.26 'curl -s -X GET "http://localhost:8000/api/v1/deployments/ycgg8c8wososwgo0ocow8wc0" -H "Authorization: Bearer 2|mysecrettoken123"' > deploy_result.json
