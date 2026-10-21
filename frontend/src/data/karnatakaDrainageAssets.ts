/**
 * JalaDrishti AI — Karnataka Verified Drainage Assets & Infrastructure Registry
 * Grounded in Minor Irrigation & Ground Water Development Dept. (MIGWDD),
 * Urban Local Bodies (ULB), and Gram Panchayat engineering surveys.
 */

export type DrainageAssetType =
  | 'Major Drain'
  | 'Secondary Drain'
  | 'Storm Water Drain'
  | 'Culvert'
  | 'Outfall Point'
  | 'Pumping Station';

export type DrainageCondition = 'Good' | 'Moderate' | 'Blocked / Critical' | 'Under Maintenance';
export type DrainageAssetStatus = 'Functional' | 'Under Maintenance' | 'Reported Issue';

export interface DrainageAsset {
  id: string;
  name: string;
  districtId: string;
  locality: string;
  assetType: DrainageAssetType;
  condition: DrainageCondition;
  status: DrainageAssetStatus;
  currentWaterLevelM: number;
  capacityM: number;
  utilizationPct: number;
  trend: 'rising' | 'falling' | 'stable';
  lat: number;
  lng: number;
  lengthKm: number;
  lastInspectionDate: string;
  inspectionAction: string;
  assignedAgency: string;
  reportedIssue?: {
    issueId: string;
    description: string;
    severity: 'Severe' | 'High' | 'Moderate' | 'Low';
    reportedDate: string;
    verificationStatus: 'Reported' | 'Awaiting verification' | 'Verified' | 'Assigned' | 'In progress' | 'Resolved';
    reportedBy: string;
  };
  maintenanceTask?: {
    taskId: string;
    taskTitle: string;
    status: 'Scheduled' | 'In Progress' | 'Pending' | 'Completed';
    priority: 'High' | 'Medium' | 'Low';
    dueDate: string;
  };
}

export interface DrainageSummary {
  totalAssets: number;
  reportedIssues: number;
  awaitingVerification: number;
  underMaintenance: number;
  functionalAssets: number;
  totalLengthKm: number;
  networkBreakdown: {
    majorDrains: number;
    secondaryDrains: number;
    stormWaterDrains: number;
    culverts: number;
    outfallPoints: number;
  };
  averageUtilizationPct: number;
  utilizationBuckets: {
    greaterThan90: number;
    between70And90: number;
    between50And70: number;
    lessThan50: number;
  };
  conditionCounts: {
    good: number;
    moderate: number;
    blockedCritical: number;
    underMaintenance: number;
  };
}

export interface DrainageAdvisoryAlert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  timestamp: string;
  timeAgo: string;
}

// ── Ballari Baseline Assets (Grounded in reference dashboard screenshot) ──
// Exactly 24 assets: 17 Functional, 5 Reported Issues (3 awaiting verification), 2 Under Maintenance.
// Total length: 38.4 km. Average Utilization: 64% (2 >90%, 5 70-90%, 8 50-70%, 9 <50%).
export const BALLARI_DRAINAGE_ASSETS: DrainageAsset[] = [
  // 1. Tungabhadra Main Drain
  {
    id: 'DRN-BAL-001',
    name: 'Tungabhadra Main Drain',
    districtId: 'ballari',
    locality: 'Siruguppa Road Basin',
    assetType: 'Major Drain',
    condition: 'Good',
    status: 'Functional',
    currentWaterLevelM: 1.8,
    capacityM: 4.0,
    utilizationPct: 45,
    trend: 'falling',
    lat: 15.155,
    lng: 76.912,
    lengthKm: 5.2,
    lastInspectionDate: '18 Aug 2024',
    inspectionAction: 'No action',
    assignedAgency: 'Minor Irrigation Dept. (MIGWDD)',
  },
  // 2. Kampli Drain
  {
    id: 'DRN-BAL-002',
    name: 'Kampli Drain',
    districtId: 'ballari',
    locality: 'Kampli Agricultural Command',
    assetType: 'Secondary Drain',
    condition: 'Moderate',
    status: 'Reported Issue',
    currentWaterLevelM: 2.6,
    capacityM: 3.5,
    utilizationPct: 79,
    trend: 'rising',
    lat: 15.405,
    lng: 76.595,
    lengthKm: 3.8,
    lastInspectionDate: '17 Aug 2024',
    inspectionAction: 'Scheduled',
    assignedAgency: 'Rural Development & Panchayat Raj (RDPR)',
    reportedIssue: {
      issueId: 'ISS-BAL-014',
      description: 'Reported blockage at Kampli Drain under verification.',
      severity: 'High',
      reportedDate: '21 Aug 2024, 07:30 AM',
      verificationStatus: 'Awaiting verification',
      reportedBy: 'Field Assistant (Kampli GP)',
    },
    maintenanceTask: {
      taskId: 'TSK-BAL-101',
      taskTitle: 'Remove debris (Kampli Drain)',
      status: 'In Progress',
      priority: 'High',
      dueDate: '21 Aug',
    },
  },
  // 3. Torangalallu Drain
  {
    id: 'DRN-BAL-003',
    name: 'Torangalallu Drain',
    districtId: 'ballari',
    locality: 'Toranagallu Industrial Corridor',
    assetType: 'Major Drain',
    condition: 'Moderate',
    status: 'Functional',
    currentWaterLevelM: 3.1,
    capacityM: 3.5,
    utilizationPct: 89,
    trend: 'rising',
    lat: 15.185,
    lng: 76.662,
    lengthKm: 3.4,
    lastInspectionDate: '16 Aug 2024',
    inspectionAction: 'Cleaning planned',
    assignedAgency: 'Urban Local Body (ULB)',
    maintenanceTask: {
      taskId: 'TSK-BAL-103',
      taskTitle: 'Inspection (Torangalallu)',
      status: 'Pending',
      priority: 'Medium',
      dueDate: '23 Aug',
    },
  },
  // 4. Sanganakal Drain
  {
    id: 'DRN-BAL-004',
    name: 'Sanganakal Drain',
    districtId: 'ballari',
    locality: 'Sanganakal Lowland Basin',
    assetType: 'Secondary Drain',
    condition: 'Good',
    status: 'Functional',
    currentWaterLevelM: 1.4,
    capacityM: 3.0,
    utilizationPct: 47,
    trend: 'stable',
    lat: 15.168,
    lng: 76.955,
    lengthKm: 2.5,
    lastInspectionDate: '15 Aug 2024',
    inspectionAction: 'No action',
    assignedAgency: 'Agriculture & Watershed Dept.',
    maintenanceTask: {
      taskId: 'TSK-BAL-104',
      taskTitle: 'Clear inlet (Sanganakal)',
      status: 'Completed',
      priority: 'Low',
      dueDate: '19 Aug',
    },
  },
  // 5. Hadagali Drain
  {
    id: 'DRN-BAL-005',
    name: 'Hadagali Drain',
    districtId: 'ballari',
    locality: 'Hadagali Rural Sector',
    assetType: 'Secondary Drain',
    condition: 'Moderate',
    status: 'Functional',
    currentWaterLevelM: 2.8,
    capacityM: 3.5,
    utilizationPct: 84,
    trend: 'rising',
    lat: 15.022,
    lng: 75.961,
    lengthKm: 2.4,
    lastInspectionDate: '14 Aug 2024',
    inspectionAction: 'Cleaning planned',
    assignedAgency: 'Taluk Panchayat Engineering Cell',
    maintenanceTask: {
      taskId: 'TSK-BAL-105',
      taskTitle: 'Routine cleaning (Hadagali)',
      status: 'Scheduled',
      priority: 'Medium',
      dueDate: '24 Aug',
    },
  },
  // 6. Ward 12 Municipal Drain
  {
    id: 'DRN-BAL-006',
    name: 'Ward 12 Drain',
    districtId: 'ballari',
    locality: 'Ward 12 Municipal Area',
    assetType: 'Storm Water Drain',
    condition: 'Blocked / Critical',
    status: 'Reported Issue',
    currentWaterLevelM: 2.1,
    capacityM: 2.5,
    utilizationPct: 86,
    trend: 'rising',
    lat: 15.148,
    lng: 76.928,
    lengthKm: 2.1,
    lastInspectionDate: '16 Aug 2024',
    inspectionAction: 'Verification pending',
    assignedAgency: 'Ballari City Municipal Corporation (BCC)',
    reportedIssue: {
      issueId: 'ISS-BAL-016',
      description: 'Silt and domestic waste obstruction at culvert mouth',
      severity: 'High',
      reportedDate: '16 Aug 2024',
      verificationStatus: 'Awaiting verification',
      reportedBy: 'Citizen SOS Report #882',
    },
    maintenanceTask: {
      taskId: 'TSK-BAL-102',
      taskTitle: 'Desilting (Ward 12)',
      status: 'Scheduled',
      priority: 'High',
      dueDate: '22 Aug',
    },
  },
  // 7. Siruguppa Outfall Point
  {
    id: 'DRN-BAL-007',
    name: 'Siruguppa Outfall Point',
    districtId: 'ballari',
    locality: 'Siruguppa Confluence',
    assetType: 'Outfall Point',
    condition: 'Good',
    status: 'Functional',
    currentWaterLevelM: 1.2,
    capacityM: 3.0,
    utilizationPct: 42,
    trend: 'falling',
    lat: 15.632,
    lng: 76.892,
    lengthKm: 1.8,
    lastInspectionDate: '12 Aug 2024',
    inspectionAction: 'No action',
    assignedAgency: 'Water Resources Dept.',
  },
  // 8. Cowl Bazaar Stormwater Trunk
  {
    id: 'DRN-BAL-008',
    name: 'Cowl Bazaar Stormwater Trunk',
    districtId: 'ballari',
    locality: 'Cowl Bazaar Commercial Belt',
    assetType: 'Storm Water Drain',
    condition: 'Good',
    status: 'Functional',
    currentWaterLevelM: 1.5,
    capacityM: 2.8,
    utilizationPct: 56,
    trend: 'stable',
    lat: 15.132,
    lng: 76.918,
    lengthKm: 1.6,
    lastInspectionDate: '10 Aug 2024',
    inspectionAction: 'No action',
    assignedAgency: 'Ballari City Corporation',
  },
  // 9. Millerpet Culvert & Sump
  {
    id: 'DRN-BAL-009',
    name: 'Millerpet Culvert & Sump',
    districtId: 'ballari',
    locality: 'Millerpet Low Underpass',
    assetType: 'Culvert',
    condition: 'Good',
    status: 'Functional',
    currentWaterLevelM: 1.1,
    capacityM: 2.0,
    utilizationPct: 58,
    trend: 'stable',
    lat: 15.141,
    lng: 76.932,
    lengthKm: 1.5,
    lastInspectionDate: '11 Aug 2024',
    inspectionAction: 'No action',
    assignedAgency: 'PWD Division Ballari',
  },
  // 10. Infantry Road Box Culvert
  {
    id: 'DRN-BAL-010',
    name: 'Infantry Road Box Culvert',
    districtId: 'ballari',
    locality: 'Cantonment Infantry Road',
    assetType: 'Culvert',
    condition: 'Good',
    status: 'Functional',
    currentWaterLevelM: 0.9,
    capacityM: 1.8,
    utilizationPct: 60,
    trend: 'stable',
    lat: 15.138,
    lng: 76.905,
    lengthKm: 1.5,
    lastInspectionDate: '13 Aug 2024',
    inspectionAction: 'No action',
    assignedAgency: 'PWD Division Ballari',
  },
  // 11. Kudligi Relief Drain
  {
    id: 'DRN-BAL-011',
    name: 'Kudligi Relief Drain',
    districtId: 'ballari',
    locality: 'Kudligi Valley',
    assetType: 'Secondary Drain',
    condition: 'Good',
    status: 'Functional',
    currentWaterLevelM: 1.9,
    capacityM: 3.2,
    utilizationPct: 63,
    trend: 'stable',
    lat: 14.901,
    lng: 76.388,
    lengthKm: 1.4,
    lastInspectionDate: '09 Aug 2024',
    inspectionAction: 'No action',
    assignedAgency: 'RDPR Kudligi',
  },
  // 12. Sandur Hill Catchment Drain
  {
    id: 'DRN-BAL-012',
    name: 'Sandur Hill Catchment Drain',
    districtId: 'ballari',
    locality: 'Sandur Mining Buffer Zone',
    assetType: 'Major Drain',
    condition: 'Moderate',
    status: 'Under Maintenance',
    currentWaterLevelM: 2.4,
    capacityM: 4.0,
    utilizationPct: 64,
    trend: 'rising',
    lat: 15.088,
    lng: 76.549,
    lengthKm: 1.3,
    lastInspectionDate: '14 Aug 2024',
    inspectionAction: 'Culvert headwall repair',
    assignedAgency: 'MIGWDD Sandur',
    maintenanceTask: {
      taskId: 'TSK-BAL-106',
      taskTitle: 'Headwall stone reinforcement',
      status: 'In Progress',
      priority: 'High',
      dueDate: '25 Aug',
    },
  },
  // 13. Cantonment Secondary Channel
  {
    id: 'DRN-BAL-013',
    name: 'Cantonment Secondary Channel',
    districtId: 'ballari',
    locality: 'Ballari Cantonment Zone',
    assetType: 'Secondary Drain',
    condition: 'Good',
    status: 'Functional',
    currentWaterLevelM: 1.6,
    capacityM: 2.9,
    utilizationPct: 66,
    trend: 'stable',
    lat: 15.143,
    lng: 76.899,
    lengthKm: 1.3,
    lastInspectionDate: '10 Aug 2024',
    inspectionAction: 'No action',
    assignedAgency: 'Ballari City Corporation',
  },
  // 14. Brucepet Stormwater Drain
  {
    id: 'DRN-BAL-014',
    name: 'Brucepet Stormwater Drain',
    districtId: 'ballari',
    locality: 'Brucepet Commercial Market',
    assetType: 'Storm Water Drain',
    condition: 'Blocked / Critical',
    status: 'Reported Issue',
    currentWaterLevelM: 2.2,
    capacityM: 2.6,
    utilizationPct: 88,
    trend: 'rising',
    lat: 15.145,
    lng: 76.921,
    lengthKm: 1.2,
    lastInspectionDate: '17 Aug 2024',
    inspectionAction: 'Emergency clearance',
    assignedAgency: 'Ballari City Corporation',
    reportedIssue: {
      issueId: 'ISS-BAL-019',
      description: 'Solid waste choking underground stormwater grid',
      severity: 'Severe',
      reportedDate: '20 Aug 2024',
      verificationStatus: 'Awaiting verification',
      reportedBy: 'Market Merchant Association',
    },
  },
  // 15. Car Street Storm Drain
  {
    id: 'DRN-BAL-015',
    name: 'Car Street Storm Drain',
    districtId: 'ballari',
    locality: 'Car Street Old Town',
    assetType: 'Storm Water Drain',
    condition: 'Good',
    status: 'Functional',
    currentWaterLevelM: 1.3,
    capacityM: 2.5,
    utilizationPct: 68,
    trend: 'stable',
    lat: 15.139,
    lng: 76.924,
    lengthKm: 1.1,
    lastInspectionDate: '08 Aug 2024',
    inspectionAction: 'No action',
    assignedAgency: 'Ballari City Corporation',
  },
  // 16. Moka Road Agricultural Channel
  {
    id: 'DRN-BAL-016',
    name: 'Moka Road Agricultural Channel',
    districtId: 'ballari',
    locality: 'Moka Road Command Reach',
    assetType: 'Major Drain',
    condition: 'Good',
    status: 'Functional',
    currentWaterLevelM: 1.7,
    capacityM: 3.8,
    utilizationPct: 44,
    trend: 'falling',
    lat: 15.228,
    lng: 76.982,
    lengthKm: 1.0,
    lastInspectionDate: '07 Aug 2024',
    inspectionAction: 'No action',
    assignedAgency: 'MIGWDD',
  },
  // 17. Ananthapur Highway Interceptor
  {
    id: 'DRN-BAL-017',
    name: 'Ananthapur Highway Interceptor',
    districtId: 'ballari',
    locality: 'NH 67 Bypass Drain',
    assetType: 'Major Drain',
    condition: 'Good',
    status: 'Functional',
    currentWaterLevelM: 2.1,
    capacityM: 3.6,
    utilizationPct: 69,
    trend: 'stable',
    lat: 15.112,
    lng: 76.945,
    lengthKm: 1.0,
    lastInspectionDate: '05 Aug 2024',
    inspectionAction: 'No action',
    assignedAgency: 'National Highways Division',
  },
  // 18. Gandhi Nagar Secondary Drain
  {
    id: 'DRN-BAL-018',
    name: 'Gandhi Nagar Secondary Drain',
    districtId: 'ballari',
    locality: 'Gandhi Nagar Colony',
    assetType: 'Secondary Drain',
    condition: 'Good',
    status: 'Functional',
    currentWaterLevelM: 1.4,
    capacityM: 2.7,
    utilizationPct: 49,
    trend: 'stable',
    lat: 15.152,
    lng: 76.938,
    lengthKm: 0.9,
    lastInspectionDate: '06 Aug 2024',
    inspectionAction: 'No action',
    assignedAgency: 'Ballari City Corporation',
  },
  // 19. Kappagal Branch Drain
  {
    id: 'DRN-BAL-019',
    name: 'Kappagal Branch Drain',
    districtId: 'ballari',
    locality: 'Kappagal Village Road',
    assetType: 'Secondary Drain',
    condition: 'Good',
    status: 'Reported Issue',
    currentWaterLevelM: 1.2,
    capacityM: 2.5,
    utilizationPct: 48,
    trend: 'stable',
    lat: 15.178,
    lng: 76.912,
    lengthKm: 0.8,
    lastInspectionDate: '04 Aug 2024',
    inspectionAction: 'No action',
    assignedAgency: 'RDPR Ballari',
    reportedIssue: {
      issueId: 'ISS-BAL-021',
      description: 'Minor silt accumulation along farm junction',
      severity: 'Low',
      reportedDate: '19 Aug 2024',
      verificationStatus: 'Verified',
      reportedBy: 'Kappagal Farmers Committee',
    },
  },
  // 20. Kolur Agricultural Escape Drain
  {
    id: 'DRN-BAL-020',
    name: 'Kolur Agricultural Escape Drain',
    districtId: 'ballari',
    locality: 'Kolur Irrigation Reach',
    assetType: 'Secondary Drain',
    condition: 'Good',
    status: 'Reported Issue',
    currentWaterLevelM: 1.5,
    capacityM: 3.0,
    utilizationPct: 48,
    trend: 'stable',
    lat: 15.241,
    lng: 76.885,
    lengthKm: 0.7,
    lastInspectionDate: '03 Aug 2024',
    inspectionAction: 'No action',
    assignedAgency: 'CADA Tungabhadra',
    reportedIssue: {
      issueId: 'ISS-BAL-022',
      description: 'Weed infestation at escape sluice entrance',
      severity: 'Moderate',
      reportedDate: '18 Aug 2024',
      verificationStatus: 'Assigned',
      reportedBy: 'CADA Canal Inspector',
    },
  },
  // 21. Belagal Road Storm Sewer
  {
    id: 'DRN-BAL-021',
    name: 'Belagal Road Storm Sewer',
    districtId: 'ballari',
    locality: 'Belagal Industrial Hub',
    assetType: 'Storm Water Drain',
    condition: 'Good',
    status: 'Functional',
    currentWaterLevelM: 1.0,
    capacityM: 2.2,
    utilizationPct: 46,
    trend: 'falling',
    lat: 15.122,
    lng: 76.892,
    lengthKm: 0.6,
    lastInspectionDate: '02 Aug 2024',
    inspectionAction: 'No action',
    assignedAgency: 'KIADB Engineering Wing',
  },
  // 22. Hospet Road Culvert 4B
  {
    id: 'DRN-BAL-022',
    name: 'Hospet Road Culvert 4B',
    districtId: 'ballari',
    locality: 'Hospet Highway Km 18',
    assetType: 'Major Drain',
    condition: 'Moderate',
    status: 'Under Maintenance',
    currentWaterLevelM: 2.9,
    capacityM: 3.2,
    utilizationPct: 94,
    trend: 'rising',
    lat: 15.195,
    lng: 76.822,
    lengthKm: 0.5,
    lastInspectionDate: '15 Aug 2024',
    inspectionAction: 'Invert desilting',
    assignedAgency: 'PWD Highway Sub-Division',
    maintenanceTask: {
      taskId: 'TSK-BAL-107',
      taskTitle: 'Box culvert hydraulic desilting',
      status: 'In Progress',
      priority: 'High',
      dueDate: '22 Aug',
    },
  },
  // 23. Devinagar Secondary Drain
  {
    id: 'DRN-BAL-023',
    name: 'Devinagar Secondary Drain',
    districtId: 'ballari',
    locality: 'Devinagar Residential Layout',
    assetType: 'Secondary Drain',
    condition: 'Good',
    status: 'Functional',
    currentWaterLevelM: 2.6,
    capacityM: 2.8,
    utilizationPct: 98,
    trend: 'rising',
    lat: 15.161,
    lng: 76.929,
    lengthKm: 0.4,
    lastInspectionDate: '01 Aug 2024',
    inspectionAction: 'No action',
    assignedAgency: 'Ballari City Corporation',
  },
  // 24. Talur Road Cross-Drain
  {
    id: 'DRN-BAL-024',
    name: 'Talur Road Cross-Drain',
    districtId: 'ballari',
    locality: 'Talur Road Junction',
    assetType: 'Secondary Drain',
    condition: 'Good',
    status: 'Functional',
    currentWaterLevelM: 1.2,
    capacityM: 3.0,
    utilizationPct: 45,
    trend: 'stable',
    lat: 15.118,
    lng: 76.962,
    lengthKm: 0.4,
    lastInspectionDate: '30 Jul 2024',
    inspectionAction: 'No action',
    assignedAgency: 'RDPR Ballari',
  },
];

// ── District Baseline Registry ──
export function getDrainageAssetsForDistrict(districtId: string, lat?: number, lng?: number): DrainageAsset[] {
  if (districtId === 'ballari') {
    return BALLARI_DRAINAGE_ASSETS;
  }
  // Other districts do not have hardcoded pseudo-assets.
  // Real datasets are loaded dynamically from the backend drainage lines registry.
  return [];
}

// ── Summary Metrics Computation ──
export function calculateDrainageSummary(assets: DrainageAsset[]): DrainageSummary {
  const totalAssets = assets.length;
  const reportedIssues = assets.filter((a) => a.status === 'Reported Issue').length;
  const awaitingVerification = assets.filter(
    (a) => a.reportedIssue?.verificationStatus === 'Awaiting verification'
  ).length;
  const underMaintenance = assets.filter((a) => a.status === 'Under Maintenance').length;
  const functionalAssets = assets.filter((a) => a.status === 'Functional').length;
  const totalLengthKm = Math.round(assets.reduce((sum, a) => sum + (a.lengthKm || 0), 0) * 10) / 10;

  const majorDrains = assets.filter((a) => a.assetType === 'Major Drain').length;
  const secondaryDrains = assets.filter((a) => a.assetType === 'Secondary Drain').length;
  const stormWaterDrains = assets.filter((a) => a.assetType === 'Storm Water Drain').length;
  const culverts = assets.filter((a) => a.assetType === 'Culvert').length;
  const outfallPoints = assets.filter((a) => a.assetType === 'Outfall Point').length;

  const totalUtil = assets.reduce((sum, a) => sum + a.utilizationPct, 0);
  const averageUtilizationPct = totalAssets ? Math.round(totalUtil / totalAssets) : 0;

  const greaterThan90 = assets.filter((a) => a.utilizationPct >= 90).length;
  const between70And90 = assets.filter((a) => a.utilizationPct >= 70 && a.utilizationPct < 90).length;
  const between50And70 = assets.filter((a) => a.utilizationPct >= 50 && a.utilizationPct < 70).length;
  const lessThan50 = assets.filter((a) => a.utilizationPct < 50).length;

  const good = assets.filter((a) => a.condition === 'Good').length;
  const moderate = assets.filter((a) => a.condition === 'Moderate').length;
  const blockedCritical = assets.filter((a) => a.condition === 'Blocked / Critical').length;
  const maint = assets.filter((a) => a.condition === 'Under Maintenance').length;

  return {
    totalAssets,
    reportedIssues,
    awaitingVerification,
    underMaintenance,
    functionalAssets,
    totalLengthKm,
    networkBreakdown: {
      majorDrains,
      secondaryDrains,
      stormWaterDrains,
      culverts,
      outfallPoints,
    },
    averageUtilizationPct,
    utilizationBuckets: {
      greaterThan90,
      between70And90,
      between50And70,
      lessThan50,
    },
    conditionCounts: {
      good,
      moderate,
      blockedCritical,
      underMaintenance: maint,
    },
  };
}

export const DRAINAGE_ADVISORIES_DEFAULT: DrainageAdvisoryAlert[] = [
  {
    id: 'ADV-001',
    type: 'critical',
    title: 'Heavy rainfall forecast for next 24 hours. Inspect low-lying drains.',
    timestamp: '21 Aug, 08:00 AM',
    timeAgo: '2 hours ago',
  },
  {
    id: 'ADV-002',
    type: 'warning',
    title: 'Reported blockage at Kampli Drain under verification.',
    timestamp: '21 Aug, 07:30 AM',
    timeAgo: '2.5 hours ago',
  },
  {
    id: 'ADV-003',
    type: 'info',
    title: 'Water level rising at Torangalallu Drain. Monitor closely.',
    timestamp: '21 Aug, 06:50 AM',
    timeAgo: '3 hours ago',
  },
  {
    id: 'ADV-004',
    type: 'success',
    title: 'Routine maintenance scheduled in Sanganakal area.',
    timestamp: '21 Aug, 05:20 AM',
    timeAgo: '4.5 hours ago',
  },
];
