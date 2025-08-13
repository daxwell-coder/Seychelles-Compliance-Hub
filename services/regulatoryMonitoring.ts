// Automated Regulatory Monitoring System
// Tracks changes on FSA and FIU websites and adjusts services accordingly

import { createHash } from 'crypto';

export interface RegulatoryWebsite {
  name: string;
  baseUrl: string;
  monitoredPages: MonitoredPage[];
  lastChecked?: Date;
  checkFrequency: number; // minutes
}

export interface MonitoredPage {
  path: string;
  name: string;
  contentHash?: string;
  lastModified?: Date;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  changeHandlers: ChangeHandler[];
}

export interface ChangeHandler {
  type: 'NEW_DOCUMENT' | 'UPDATED_CONTENT' | 'NEW_REGULATION' | 'DEADLINE_CHANGE';
  action: 'UPDATE_FRAMEWORK' | 'NOTIFY_CLIENTS' | 'ADJUST_WORKFLOW' | 'LEGAL_REVIEW';
  automationLevel: 'AUTOMATIC' | 'SEMI_AUTOMATIC' | 'MANUAL_REVIEW';
}

export interface RegulatoryChange {
  id: string;
  websiteName: string;
  pageName: string;
  changeType: string;
  detectedAt: Date;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  affectedServices: string[];
  actionRequired: boolean;
  autoApplied: boolean;
  reviewRequired: boolean;
}

// Predefined monitoring configuration for Seychelles regulators
export const REGULATORY_WEBSITES: RegulatoryWebsite[] = [
  {
    name: 'FSA_SEYCHELLES',
    baseUrl: 'https://fsaseychelles.sc',
    checkFrequency: 60, // Check every hour
    monitoredPages: [
      {
        path: '/news',
        name: 'FSA News & Updates',
        priority: 'HIGH',
        changeHandlers: [
          {
            type: 'NEW_REGULATION',
            action: 'UPDATE_FRAMEWORK',
            automationLevel: 'SEMI_AUTOMATIC'
          }
        ]
      },
      {
        path: '/legal-framework/guidelines',
        name: 'FSA Guidelines',
        priority: 'CRITICAL' as any,
        changeHandlers: [
          {
            type: 'UPDATED_CONTENT',
            action: 'UPDATE_FRAMEWORK',
            automationLevel: 'MANUAL_REVIEW'
          }
        ]
      },
      {
        path: '/legal-framework/circulars',
        name: 'FSA Circulars',
        priority: 'HIGH',
        changeHandlers: [
          {
            type: 'NEW_DOCUMENT',
            action: 'NOTIFY_CLIENTS',
            automationLevel: 'AUTOMATIC'
          }
        ]
      },
      {
        path: '/legal-framework/application-forms',
        name: 'FSA Application Forms',
        priority: 'MEDIUM',
        changeHandlers: [
          {
            type: 'UPDATED_CONTENT',
            action: 'ADJUST_WORKFLOW',
            automationLevel: 'SEMI_AUTOMATIC'
          }
        ]
      },
      {
        path: '/vasp',
        name: 'Virtual Asset Service Providers',
        priority: 'HIGH',
        changeHandlers: [
          {
            type: 'NEW_REGULATION',
            action: 'UPDATE_FRAMEWORK',
            automationLevel: 'MANUAL_REVIEW'
          }
        ]
      }
    ]
  },
  {
    name: 'FIU_SEYCHELLES',
    baseUrl: 'https://www.seychellesfiu.sc',
    checkFrequency: 120, // Check every 2 hours
    monitoredPages: [
      {
        path: '/beneficial-ownership',
        name: 'FIU Beneficial Ownership Requirements',
        priority: 'HIGH',
        changeHandlers: [
          {
            type: 'UPDATED_CONTENT',
            action: 'UPDATE_FRAMEWORK',
            automationLevel: 'SEMI_AUTOMATIC'
          }
        ]
      },
      {
        path: '/reporting-entities',
        name: 'FIU Reporting Requirements',
        priority: 'HIGH',
        changeHandlers: [
          {
            type: 'NEW_REGULATION',
            action: 'ADJUST_WORKFLOW',
            automationLevel: 'MANUAL_REVIEW'
          }
        ]
      }
    ]
  },
  {
    name: 'FIU_BO_PORTAL',
    baseUrl: 'https://www.fiu.sc:4443',
    checkFrequency: 240, // Check every 4 hours
    monitoredPages: [
      {
        path: '/BO_Live/Home',
        name: 'FIU BO Database Portal',
        priority: 'HIGH',
        changeHandlers: [
          {
            type: 'UPDATED_CONTENT',
            action: 'ADJUST_WORKFLOW',
            automationLevel: 'SEMI_AUTOMATIC'
          }
        ]
      }
    ]
  }
];

export class RegulatoryMonitoringService {
  private changes: RegulatoryChange[] = [];
  private isMonitoring: boolean = false;
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Start automated monitoring of all regulatory websites
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.warn('Regulatory monitoring already active');
      return;
    }

    this.isMonitoring = true;
    console.log('🔍 Starting automated regulatory monitoring...');

    for (const website of REGULATORY_WEBSITES) {
      this.startWebsiteMonitoring(website);
    }

    console.log(`✅ Monitoring ${REGULATORY_WEBSITES.length} regulatory websites`);
  }

  /**
   * Stop all monitoring
   */
  stopMonitoring(): void {
    this.monitoringIntervals.forEach((interval) => clearInterval(interval));
    this.monitoringIntervals.clear();
    this.isMonitoring = false;
    console.log('🛑 Regulatory monitoring stopped');
  }

  /**
   * Start monitoring a specific website
   */
  private startWebsiteMonitoring(website: RegulatoryWebsite): void {
    // Initial check
    this.checkWebsiteForChanges(website);

    // Set up periodic checking
    const interval = setInterval(
      () => this.checkWebsiteForChanges(website),
      website.checkFrequency * 60 * 1000 // Convert minutes to milliseconds
    );

    this.monitoringIntervals.set(website.name, interval);
  }

  /**
   * Check a website for changes
   */
  private async checkWebsiteForChanges(website: RegulatoryWebsite): Promise<void> {
    console.log(`🔍 Checking ${website.name} for regulatory changes...`);

    try {
      for (const page of website.monitoredPages) {
        await this.checkPageForChanges(website, page);
      }
      
      // Update last checked timestamp
      website.lastChecked = new Date();
      
    } catch (error) {
      console.error(`❌ Error checking ${website.name}:`, error.message);
    }
  }

  /**
   * Check specific page for changes
   */
  private async checkPageForChanges(
    website: RegulatoryWebsite, 
    page: MonitoredPage
  ): Promise<void> {
    try {
      const fullUrl = `${website.baseUrl}${page.path}`;
      
      // Fetch page content
      const response = await fetch(fullUrl);
      if (!response.ok) {
        console.warn(`⚠️ Unable to fetch ${fullUrl}: ${response.status}`);
        return;
      }

      const content = await response.text();
      
      // Calculate content hash
      const currentHash = createHash('sha256').update(content).digest('hex');
      
      // Compare with stored hash
      if (page.contentHash && page.contentHash !== currentHash) {
        // Content has changed!
        await this.handlePageChange(website, page, content, currentHash);
      } else if (!page.contentHash) {
        // First time checking - store baseline
        page.contentHash = currentHash;
        page.lastModified = new Date();
        console.log(`📝 Baseline established for ${website.name}/${page.name}`);
      }

    } catch (error) {
      console.error(`❌ Error checking page ${page.path}:`, error.message);
    }
  }

  /**
   * Handle detected changes
   */
  private async handlePageChange(
    website: RegulatoryWebsite,
    page: MonitoredPage,
    newContent: string,
    newHash: string
  ): Promise<void> {
    console.log(`🚨 CHANGE DETECTED: ${website.name}/${page.name}`);

    // Analyze the change
    const changeAnalysis = await this.analyzeChange(newContent, page);
    
    // Create change record
    const change: RegulatoryChange = {
      id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      websiteName: website.name,
      pageName: page.name,
      changeType: changeAnalysis.type,
      detectedAt: new Date(),
      severity: this.determineSeverity(changeAnalysis, page.priority as any),
      description: changeAnalysis.description,
      affectedServices: changeAnalysis.affectedServices,
      actionRequired: true,
      autoApplied: false,
      reviewRequired: changeAnalysis.requiresReview
    };

    this.changes.push(change);

    // Update page tracking
    page.contentHash = newHash;
    page.lastModified = new Date();

    // Execute change handlers
    for (const handler of page.changeHandlers) {
      await this.executeChangeHandler(change, handler);
    }

    // Notify relevant parties
    await this.notifyOfChange(change);
  }

  /**
   * Analyze what type of change occurred
   */
  private async analyzeChange(content: string, page: MonitoredPage): Promise<{
    type: string;
    description: string;
    affectedServices: string[];
    requiresReview: boolean;
  }> {
    // Use AI/NLP to analyze content changes
    // For now, basic keyword detection
    const keywords = {
      newRegulation: ['new regulation', 'amended act', 'updated guidelines', 'circular'],
      deadlineChange: ['deadline', 'due date', 'submission date', 'annual return'],
      formUpdate: ['application form', 'updated form', 'new form'],
      feeChange: ['fee', 'cost', 'payment', 'annual fee']
    };

    let changeType = 'CONTENT_UPDATE';
    let description = 'Content has been updated';
    const affectedServices: string[] = [];
    let requiresReview = true;

    // Analyze content for specific changes
    const lowerContent = content.toLowerCase();

    if (keywords.newRegulation.some(keyword => lowerContent.includes(keyword))) {
      changeType = 'NEW_REGULATION';
      description = 'New regulation or guideline detected';
      affectedServices.push('onboarding', 'compliance-monitoring');
      requiresReview = true;
    }

    if (keywords.deadlineChange.some(keyword => lowerContent.includes(keyword))) {
      changeType = 'DEADLINE_CHANGE';
      description = 'Compliance deadline or date change detected';
      affectedServices.push('compliance-calendar', 'client-notifications');
      requiresReview = false; // Can be automated
    }

    if (keywords.formUpdate.some(keyword => lowerContent.includes(keyword))) {
      changeType = 'FORM_UPDATE';
      description = 'Application form or document template updated';
      affectedServices.push('onboarding', 'document-generation');
      requiresReview = false;
    }

    return {
      type: changeType,
      description,
      affectedServices,
      requiresReview
    };
  }

  /**
   * Determine severity of change
   */
  private determineSeverity(
    changeAnalysis: any, 
    pagePriority: 'HIGH' | 'MEDIUM' | 'LOW'
  ): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    if (changeAnalysis.type === 'NEW_REGULATION' && pagePriority === 'HIGH') {
      return 'CRITICAL';
    }
    if (changeAnalysis.type === 'DEADLINE_CHANGE') {
      return 'HIGH';
    }
    if (pagePriority === 'HIGH') {
      return 'HIGH';
    }
    return 'MEDIUM';
  }

  /**
   * Execute change handler actions
   */
  private async executeChangeHandler(
    change: RegulatoryChange,
    handler: ChangeHandler
  ): Promise<void> {
    console.log(`🔄 Executing ${handler.action} for ${change.description}`);

    switch (handler.action) {
      case 'UPDATE_FRAMEWORK':
        if (handler.automationLevel === 'AUTOMATIC') {
          await this.autoUpdateFramework(change);
        } else {
          await this.scheduleFrameworkReview(change);
        }
        break;

      case 'NOTIFY_CLIENTS':
        await this.notifyClients(change);
        break;

      case 'ADJUST_WORKFLOW':
        if (handler.automationLevel === 'AUTOMATIC') {
          await this.autoAdjustWorkflow(change);
        } else {
          await this.scheduleWorkflowReview(change);
        }
        break;

      case 'LEGAL_REVIEW':
        await this.scheduleLegalReview(change);
        break;
    }
  }

  /**
   * Automatically update regulatory framework
   */
  private async autoUpdateFramework(change: RegulatoryChange): Promise<void> {
    console.log(`🔧 Auto-updating framework for: ${change.description}`);
    
    // This would integrate with our regulatory framework system
    // For now, log the action
    change.autoApplied = true;
    
    // In production, this would:
    // 1. Update regulatory framework enums/constants
    // 2. Adjust compliance requirements
    // 3. Update form validation rules
    // 4. Refresh client compliance status
  }

  /**
   * Notify clients of regulatory changes
   */
  private async notifyClients(change: RegulatoryChange): Promise<void> {
    console.log(`📧 Notifying clients of: ${change.description}`);
    
    // This would integrate with our notification system
    // Send targeted notifications based on affected services
  }

  /**
   * Schedule reviews for manual changes
   */
  private async scheduleFrameworkReview(change: RegulatoryChange): Promise<void> {
    console.log(`📅 Scheduling framework review for: ${change.description}`);
    
    // Create task for legal/compliance team
    change.reviewRequired = true;
  }

  private async scheduleWorkflowReview(change: RegulatoryChange): Promise<void> {
    console.log(`📅 Scheduling workflow review for: ${change.description}`);
  }

  private async scheduleLegalReview(change: RegulatoryChange): Promise<void> {
    console.log(`⚖️ Scheduling legal review for: ${change.description}`);
  }

  private async autoAdjustWorkflow(change: RegulatoryChange): Promise<void> {
    console.log(`🔄 Auto-adjusting workflow for: ${change.description}`);
    change.autoApplied = true;
  }

  /**
   * Send notifications about detected changes
   */
  private async notifyOfChange(change: RegulatoryChange): Promise<void> {
    const notification = {
      type: 'REGULATORY_CHANGE',
      severity: change.severity,
      message: `${change.websiteName}: ${change.description}`,
      timestamp: change.detectedAt,
      actionRequired: change.actionRequired
    };

    console.log(`🔔 REGULATORY ALERT:`, notification);
    
    // In production, this would:
    // 1. Send email/SMS to compliance team
    // 2. Update dashboard alerts
    // 3. Log to audit system
    // 4. Create support tickets if needed
  }

  /**
   * Get all detected changes
   */
  getChanges(): RegulatoryChange[] {
    return this.changes;
  }

  /**
   * Get pending changes requiring review
   */
  getPendingReviews(): RegulatoryChange[] {
    return this.changes.filter(c => c.reviewRequired && c.actionRequired);
  }

  /**
   * Mark change as reviewed
   */
  markAsReviewed(changeId: string): void {
    const change = this.changes.find(c => c.id === changeId);
    if (change) {
      change.reviewRequired = false;
      change.actionRequired = false;
    }
  }

  /**
   * Get monitoring status
   */
  getMonitoringStatus(): {
    isActive: boolean;
    websitesMonitored: number;
    totalChanges: number;
    pendingReviews: number;
    lastCheck: Date | undefined;
  } {
    return {
      isActive: this.isMonitoring,
      websitesMonitored: REGULATORY_WEBSITES.length,
      totalChanges: this.changes.length,
      pendingReviews: this.getPendingReviews().length,
      lastCheck: Math.max(...REGULATORY_WEBSITES.map(w => w.lastChecked?.getTime() || 0)) 
        ? new Date(Math.max(...REGULATORY_WEBSITES.map(w => w.lastChecked?.getTime() || 0)))
        : undefined
    };
  }
}

// Export singleton instance
export const regulatoryMonitor = new RegulatoryMonitoringService();

// Utility functions
export const RegulatoryMonitorUtils = {
  /**
   * Start monitoring when application starts
   */
  async initializeMonitoring(): Promise<void> {
    console.log('🚀 Initializing regulatory monitoring system...');
    await regulatoryMonitor.startMonitoring();
  },

  /**
   * Get human-readable status
   */
  getStatusSummary(): string {
    const status = regulatoryMonitor.getMonitoringStatus();
    return `
🔍 Regulatory Monitoring Status:
- Active: ${status.isActive ? '✅ YES' : '❌ NO'}
- Websites Monitored: ${status.websitesMonitored}
- Changes Detected: ${status.totalChanges}
- Pending Reviews: ${status.pendingReviews}
- Last Check: ${status.lastCheck?.toLocaleString() || 'Never'}
    `;
  },

  /**
   * Emergency stop (if too many changes detected)
   */
  emergencyStop(reason: string): void {
    console.warn(`🚨 EMERGENCY STOP: ${reason}`);
    regulatoryMonitor.stopMonitoring();
  }
};
