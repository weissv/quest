#!/bin/bash
echo "Triggering deploy..."
RESPONSE=$(sshpass -e ssh -o StrictHostKeyChecking=no root@185.217.131.26 'curl -s -X POST "http://localhost:8000/api/v1/deploy?uuid=a8s0s88oc04wkoo0wg88kco8&force=true" -H "Authorization: Bearer 2|mysecrettoken123"')
echo "Response: $RESPONSE"
UUID=$(echo $RESPONSE | grep -o '"deployment_uuid":"[^"]*"' | cut -d'"' -f4)
echo "Deployment UUID: $UUID"

if [ -z "$UUID" ]; then
  echo "Failed to get deployment UUID"
  exit 1
fi

while true; do
  STATUS=$(sshpass -e ssh -o StrictHostKeyChecking=no root@185.217.131.26 "curl -s -X GET \"http://localhost:8000/api/v1/deployments/$UUID\" -H \"Authorization: Bearer 2|mysecrettoken123\"" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
  echo "Status: $STATUS"
  if [ "$STATUS" != "in_progress" ] && [ "$STATUS" != "queued" ]; then
    break
  fi
  sleep 10
done
sshpass -e ssh -o StrictHostKeyChecking=no root@185.217.131.26 "curl -s -X GET \"http://localhost:8000/api/v1/deployments/$UUID\" -H \"Authorization: Bearer 2|mysecrettoken123\"" > deploy_result_2.json
echo "Finished!"
