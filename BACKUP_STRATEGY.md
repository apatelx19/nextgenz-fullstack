# NextGenZ Tech - Backup Strategy

## MongoDB Atlas Backups

MongoDB Atlas provides robust automated backup solutions.

### 1. Automated Cloud Backups
- **Continuous Backups**: Ensure that continuous backups (Point-in-Time Recovery) are enabled in your cluster settings.
- **Retention Policy**: 
  - Daily snapshots retained for 7 days.
  - Weekly snapshots retained for 4 weeks.
  - Monthly snapshots retained for 1 year.

### 2. Manual Snapshots
Before any major deployment or database schema change:
1. Navigate to your MongoDB Atlas dashboard.
2. Go to your Cluster > Backups.
3. Click "Take Snapshot".

### 3. On-Demand Local Backups (mongodump)
For local offline archives, run the following command weekly:
```bash
mongodump --uri="mongodb+srv://<username>:<password>@cluster0.mongodb.net/nextgenz" --out=/path/to/local/backup/dir
```

## Cloudinary Assets Backups

Cloudinary automatically replicates data across multiple AWS availability zones.

### 1. Automatic Cloudinary Backup Feature
- Upgrade to an Advanced plan to enable the "Automatic Backup" feature. This syncs your entire media library to an external S3 bucket securely.

### 2. Manual Export via Admin API
To programmatically backup all resumes and assets:
```javascript
const cloudinary = require('cloudinary').v2;
cloudinary.api.resources({ type: 'upload', max_results: 500 }, function(error, result) {
    // Save the result list (URLs, public IDs) to a JSON file
    // Write a script to download these URLs to a secure local drive
});
```

### 3. Recovery Protocol
In the event of accidental deletion:
1. Contact Cloudinary support within 30 days to retrieve assets from the secondary backup.
2. For MongoDB, click "Restore" on the Atlas dashboard and select the exact timestamp immediately preceding the incident.
