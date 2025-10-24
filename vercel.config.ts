export default {
  "crons": [
    {
      "path": "/api/cron/post-scheduled",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/cleanup-storage",
      "schedule": "0 2 * * *"
    }
  ]
};