const XLSX = require('xlsx');
const path = require('path');

// Create workbook
const wb = XLSX.utils.book_new();

// Single sheet - Final Budget
const budgetData = [
  ['WAXFEED - 6 MONTH PROCUREMENT COSTS'],
  ['Brown Broadcasting Service (WBRU)'],
  ['December 2024'],
  [''],
  ['ITEM', 'DESCRIPTION', 'MONTHLY', '6-MONTH TOTAL'],
  [''],
  ['INFRASTRUCTURE (Google Cloud)'],
  ['Cloud Run (Hosting)', 'Next.js app server, 2 vCPU / 4GB RAM', 95, 570],
  ['Cloud SQL (Database)', 'PostgreSQL, 2 vCPU / 7.5GB RAM + backups', 99, 594],
  ['Cloud Storage + CDN', 'File storage, bandwidth, content delivery', 46, 276],
  [''],
  ['DOMAIN'],
  ['Domain Registration', 'waxfeed.com (annual)', '', 15],
  [''],
  ['SERVICES'],
  ['Email (SendGrid)', 'Transactional emails', 15, 90],
  ['Metadata API Reserve', 'For 7digital/Tuned Global if needed', 250, 1500],
  [''],
  ['MOBILE APP STORES'],
  ['Apple Developer Program', 'iOS App Store publishing (annual)', '', 99],
  ['Google Play Developer', 'Android publishing (one-time)', '', 25],
  [''],
  ['OPERATIONS'],
  ['Error Monitoring', 'Sentry for bug tracking', 26, 156],
  ['Scaling Buffer', 'Traffic spikes, growth, emergencies', 130, 780],
  [''],
  ['', '', '', ''],
  ['', '', 'TOTAL', 4105],
  [''],
  ['', '', 'ROUNDED REQUEST', 5000],
  [''],
  [''],
  ['NOTES:'],
  ['- Spotify API for music metadata: FREE (current)'],
  ['- LRCLIB for lyrics: FREE (current)'],
  ['- Google OAuth: FREE'],
  ['- SSL Certificate: FREE (included with GCP)'],
  [''],
  ['Per Lars\'s contact: If Spotify metadata becomes unreliable,'],
  ['licensed providers like 7digital cost ~$250/month extra.'],
  ['Metadata reserve included above to cover this scenario.'],
];

const budgetSheet = XLSX.utils.aoa_to_sheet(budgetData);
budgetSheet['!cols'] = [{ wch: 25 }, { wch: 45 }, { wch: 12 }, { wch: 15 }];
XLSX.utils.book_append_sheet(wb, budgetSheet, 'Budget');

// Write file
const outputPath = path.join(__dirname, '..', 'WaxFeed_WBRU_Procurement.xlsx');
XLSX.writeFile(wb, outputPath);

console.log(`✅ Procurement spreadsheet created: ${outputPath}`);
