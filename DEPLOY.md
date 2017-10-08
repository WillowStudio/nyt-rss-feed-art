Deploy AppEngine app
===
gcloud app deploy --project=$PROJECT

Cron job
===
Edit the cron setting
---
Change the value of 'schedule' in cron.yaml

Deploy the cron setting
---
gcloud app deploy cron.yaml --project=$PROJECT

View log messages
===
gcloud app logs tail -s default --project=$PROJECT

