// Regulatory Monitoring Dashboard Function
// Provides API endpoints for monitoring dashboard

import * as logger from "firebase-functions/logger";
import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

interface DashboardData {
  currentStatus: {
    isActive: boolean;
    websitesMonitored: number;
    lastCheck: Date | null;
    systemHealth: 'HEALTHY' | 'WARNING' | 'ERROR';
  };
  recentChanges: any[];
  pendingTasks: any[];
  statistics: {
    totalChanges: number;
    changesLast24h: number;
    criticalChanges: number;
    averageChangesPerDay: number;
  };
  monitoringTargets: {
    name: string;
    url: string;
    status: 'ACTIVE' | 'ERROR' | 'PENDING';
    lastChecked: Date | null;
    changesDetected: number;
  }[];
}

/**
 * HTTP endpoint for regulatory monitoring dashboard
 */
export const getRegulatoryMonitoringDashboard = async (req: any, res: any) => {
  try {
    logger.info('📊 Dashboard data requested');

    // Set CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    const dashboardData = await generateDashboardData();

    res.status(200).json({
      success: true,
      data: dashboardData,
      timestamp: new Date(),
      version: '1.0.0'
    });

  } catch (error) {
    logger.error('❌ Dashboard error:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date()
    });
  }
};

/**
 * Generate comprehensive dashboard data
 */
async function generateDashboardData(): Promise<DashboardData> {
  try {
    // Get recent monitoring results
    const monitoringResultsSnapshot = await db
      .collection('monitoring_results')
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();

    const monitoringResults = monitoringResultsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as any)
    }));

    // Get recent changes
    const changesSnapshot = await db
      .collection('regulatory_changes')
      .orderBy('detectedAt', 'desc')
      .limit(20)
      .get();

    const recentChanges = changesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as any)
    }));

    // Get pending compliance tasks
    const tasksSnapshot = await db
      .collection('compliance_tasks')
      .where('status', '==', 'PENDING')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const pendingTasks = tasksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as any)
    }));

    // Calculate statistics
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const changesLast24h = recentChanges.filter((change: any) => {
      const changeDate = change.detectedAt?.toDate?.() || new Date(change.detectedAt);
      return changeDate >= last24h;
    }).length;

    const criticalChanges = recentChanges.filter((change: any) => 
      change.severity === 'CRITICAL'
    ).length;

    // Determine system status
    const latestResult: any = monitoringResults[0];
    let systemHealth: 'HEALTHY' | 'WARNING' | 'ERROR' = 'HEALTHY';
    
    if (latestResult) {
      if (latestResult.errors && latestResult.errors.length > 0) {
        systemHealth = 'ERROR';
      } else if (latestResult.criticalChanges > 0) {
        systemHealth = 'WARNING';
      }
    }

    // Monitoring targets status
    const monitoringTargets = [
      {
        name: 'FSA Publications',
        url: 'https://www.fsaseychelles.sc/publications',
        status: 'ACTIVE' as const,
        lastChecked: latestResult?.timestamp?.toDate?.() || new Date(),
        changesDetected: recentChanges.filter((c: any) => 
          c.websiteName === 'FSA Publications'
        ).length
      },
      {
        name: 'FSA News & Updates',
        url: 'https://www.fsaseychelles.sc/news-updates', 
        status: 'ACTIVE' as const,
        lastChecked: latestResult?.timestamp?.toDate?.() || new Date(),
        changesDetected: recentChanges.filter((c: any) => 
          c.websiteName === 'FSA News & Updates'
        ).length
      },
      {
        name: 'FIU Website',
        url: 'https://fiu.sc/',
        status: 'ACTIVE' as const,
        lastChecked: latestResult?.timestamp?.toDate?.() || new Date(),
        changesDetected: recentChanges.filter((c: any) => 
          c.websiteName === 'FIU Website'
        ).length
      }
    ];

    const dashboardData: DashboardData = {
      currentStatus: {
        isActive: true,
        websitesMonitored: monitoringTargets.length,
        lastCheck: latestResult?.timestamp?.toDate?.() || null,
        systemHealth
      },
      recentChanges: recentChanges.slice(0, 10),
      pendingTasks: pendingTasks.slice(0, 10),
      statistics: {
        totalChanges: recentChanges.length,
        changesLast24h,
        criticalChanges,
        averageChangesPerDay: calculateAverageChangesPerDay(recentChanges)
      },
      monitoringTargets
    };

    return dashboardData;

  } catch (error) {
    logger.error('❌ Error generating dashboard data:', error);
    throw error;
  }
}

/**
 * Calculate average changes per day
 */
function calculateAverageChangesPerDay(changes: any[]): number {
  if (changes.length === 0) return 0;

  // Get date range
  const dates = changes.map((change: any) => {
    const date = change.detectedAt?.toDate?.() || new Date(change.detectedAt);
    return date.getTime();
  });

  const oldestDate = Math.min(...dates);
  const newestDate = Math.max(...dates);
  const daysDiff = Math.max(1, (newestDate - oldestDate) / (24 * 60 * 60 * 1000));

  return Math.round(changes.length / daysDiff);
}

/**
 * Health check endpoint
 */
export const regulatoryMonitoringHealthCheck = async (req: any, res: any) => {
  try {
    // Set CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    // Check recent monitoring activity
    const recentResultsSnapshot = await db
      .collection('monitoring_results')
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    const hasRecentActivity = !recentResultsSnapshot.empty;
    const lastActivity = hasRecentActivity 
      ? recentResultsSnapshot.docs[0].data().timestamp?.toDate() || null
      : null;

    const isHealthy = hasRecentActivity && lastActivity && 
      (new Date().getTime() - lastActivity.getTime()) < (2 * 60 * 60 * 1000); // 2 hours

    res.status(200).json({
      healthy: isHealthy,
      status: isHealthy ? 'HEALTHY' : 'WARNING',
      lastActivity,
      message: isHealthy 
        ? 'Regulatory monitoring system is operating normally'
        : 'No recent monitoring activity detected',
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('❌ Health check error:', error);
    res.status(500).json({
      healthy: false,
      status: 'ERROR',
      error: (error as Error).message,
      timestamp: new Date()
    });
  }
};
