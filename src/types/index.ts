export interface User {
    id: string;
    name: string;
    email: string;
    emailVerified: Date | null;
    image: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface ESGResponse {
    id: string;
    userId: string;
    user: User;
    financialYear: number;
    
    // Environmental Metrics
    totalElectricity: number | null;
    renewableElectricity: number | null;
    totalFuel: number | null;
    carbonEmissions: number | null;
    
    // Social Metrics
    totalEmployees: number | null;
    femaleEmployees: number | null;
    trainingHours: number | null;
    communityInvestment: number | null;
    
    // Governance Metrics
    independentBoard: number | null;
    dataPrivacyPolicy: boolean | null;
    totalRevenue: number | null;
    
    // Auto-calculated Metrics
    carbonIntensity: number | null;
    renewableRatio: number | null;
    diversityRatio: number | null;
    communitySpendRatio: number | null;
    
    // Metadata
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
  }
  
  export interface VerificationToken {
    identifier: string;
    token: string;
    expires: Date;
    createdAt: Date;
  }
  
  export interface AuditLog {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    userId: string;
    oldValue:  null;
    newValue:  null;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
  }
  
  // For form handling and calculations
  export interface ESGFormData {
    financialYear: number;
    
    // Environmental Metrics
    totalElectricity: number | null;
    renewableElectricity: number | null;
    totalFuel: number | null;
    carbonEmissions: number | null;
    
    // Social Metrics
    totalEmployees: number | null;
    femaleEmployees: number | null;
    trainingHours: number | null;
    communityInvestment: number | null;
    
    // Governance Metrics
    independentBoard: number | null;
    dataPrivacyPolicy: boolean | null;
    totalRevenue: number | null;
  }
  
  // For calculated metrics
  export interface CalculatedMetrics {
    carbonIntensity: number | null;
    renewableRatio: number | null;
    diversityRatio: number | null;
    communitySpendRatio: number | null;
  }
  
  // For form field definitions
  export type MetricType = 'number' | 'percentage' | 'boolean' | 'currency';
  
  export interface MetricDefinition {
    id: keyof ESGFormData;
    category: 'environmental' | 'social' | 'governance';
    title: string;
    type: MetricType;
    unit?: string;
    required: boolean;
  }

  declare module "next-auth" {
    interface Session {
      user: {
        id: string;
        name?: string | null;
        email?: string | null;
      };
    }
  }
  
  declare module "next-auth/jwt" {
    interface JWT {
      id: string;
      name?: string | null;
      email?: string | null;
    }
  }